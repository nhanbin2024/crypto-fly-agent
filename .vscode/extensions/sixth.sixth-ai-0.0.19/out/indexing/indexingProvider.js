"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexingProvider = void 0;
const vscode = __importStar(require("vscode"));
const extension_1 = require("../extension");
const projectUtils_1 = require("../utils/projectUtils");
const fs = __importStar(require("fs"));
const axios_1 = __importDefault(require("axios"));
const path_1 = __importDefault(require("path"));
const treeNode_1 = require("../sidebars/treeNode");
const genUtils_1 = require("../utils/genUtils");
const fileIndex_1 = require("../utils/fileIndex");
const colors_1 = require("../utils/colors");
const mainMenuProvider_1 = require("../mainMenu/mainMenuProvider");
const axiosInstance_1 = require("../utils/axiosInstance");
const sentry_1 = require("../utils/sentry");
const api = (0, axiosInstance_1.createAxiosInstance)();
// --- Constants ---
const POLLING_INTERVAL_MS = 5000; // Poll every 5 seconds
const MAX_POLLING_FAILURES = 3; // Stop polling after this many consecutive errors
const MAX_STALLED_STATE_COUNT = 5; // Stop polling if stalled state persists for this many polls
class IndexingProvider {
    constructor(unsupportedFiles, ignoredFilesAndFolders, currentWorkspace) {
        this.indexSummary = null; // Use the interface
        this.workspace = "";
        this.unsupportedFiles = [];
        this.ignoredFilesAndFolders = [];
        // --- Polling State ---
        this.isPolling = false;
        this.pollingTimeoutId = null;
        this.pollingFailureCount = 0;
        // --- Stalled State Tracking --- (NEW)
        this.stalledStateCounter = 0;
        this.lastStalledSuccess = null;
        this.lastStalledFailures = null;
        this.lastStalledTotal = null;
        this.pollProgress = async () => {
            if (!this.isPolling || !this.panel) {
                // console.log("pollProgress: Polling stopped or panel closed."); // Optional log
                return;
            }
            // console.log("Polling for index progress..."); // Optional log
            const shouldContinue = await this.getIndexSummary();
            if (this.isPolling && this.panel) { // Check again after async operation
                if (shouldContinue) {
                    this.pollingTimeoutId = setTimeout(this.pollProgress, POLLING_INTERVAL_MS);
                }
                else {
                    // Indexing finished, stalled, or max errors reached
                    this.stopPolling(); // stopPolling handles cleanup
                }
            }
        };
        this.unsupportedFiles = unsupportedFiles;
        this.ignoredFilesAndFolders = ignoredFilesAndFolders;
        this.workspace = currentWorkspace;
        // Initialize stalled state (NEW)
        this.resetStalledState();
    }
    // Helper to reset stalled state variables (NEW)
    resetStalledState() {
        this.stalledStateCounter = 0;
        this.lastStalledSuccess = null;
        this.lastStalledFailures = null;
        this.lastStalledTotal = null;
    }
    initiateWebview() {
        const iconPath = vscode.Uri.joinPath((0, extension_1.getExtensionContext)().extensionUri, 'waves.png');
        this.panel = vscode.window.createWebviewPanel('centeredInput', // Keep ID as is, per user request
        'Indexing Status', vscode.ViewColumn.Beside, // Show in the active editor column
        {
            enableScripts: true,
            retainContextWhenHidden: true // Keep webview alive when hidden
        });
        this.panel.iconPath = iconPath;
        this.webview = this.panel.webview;
        (0, extension_1.setCurrentWebviewTab)(this.panel);
        (0, extension_1.setCurrentWebviewTabDisposed)(false);
        this.panel.onDidDispose(() => {
            (0, extension_1.setCurrentWebviewTabDisposed)(true);
            this.stopPolling(); // Stop polling when the panel is closed
            this.panel = undefined;
            this.webview = undefined;
        });
        // Load HTML content - Keep existing fs.readFileSync per user request
        let html = fs.readFileSync(path_1.default.join(__dirname, "indexing.html"), 'utf-8'); // Use path.join for safety
        const themeColors = (0, colors_1.getThemeColors)();
        // Fill template with workspace and theme colors
        html = (0, treeNode_1.fillTemplate)(html, this.workspace ? this.workspace : 'empty', "REPLACE_THIS");
        html = (0, treeNode_1.fillTemplate)(html, JSON.stringify(themeColors), "THEME_COLORS_JSON");
        if (this.webview) {
            this.webview.html = html;
            // Initial data load after HTML is set - Keep logic as is
            this.getIndexSummary(); // Load initial summary
            this.addFileInfoDetails(); // Load file info
        }
        this.webview.onDidReceiveMessage(async (message) => {
            if (!this.webview || !this.panel)
                return; // Guard against messages after disposal
            switch (message.command) {
                case "log_event":
                    console.log("Webview Log:", message.value); // Keep log_event as is
                    break;
                case "reindex":
                    if (!message.value) {
                        console.warn("Reindex command received without workspace path.");
                        return;
                    }
                    console.log("Reindex command received for:", message.value); // Keep log
                    vscode.window.showInformationMessage(`Starting re-index for ${path_1.default.basename(message.value)}...`); // Keep message
                    this.stopPolling(); // Stop previous polling (existing logic)
                    try {
                        // Keep existing IndexWorkspaceFiles call
                        vscode.window.showInformationMessage("Indexing will take a while depending on how large your codebase is,for large codebases you can always come back to check the progress.");
                        await (0, fileIndex_1.IndexWorkspaceFiles)((0, fileIndex_1.normalization)(message.value));
                        console.log(`Initial indexing process triggered successfully for ${message.value}. Starting progress polling.`); // Keep log
                        vscode.window.showInformationMessage(`Indexing initiated. Monitoring progress...`); // Keep message
                        this.startPolling(); // Start polling after successful initiation (existing logic)
                    }
                    catch (err) {
                        console.error(`Error initiating indexing for ${message.value}:`, err); // Keep error log
                        vscode.window.showErrorMessage(`Failed to start indexing: ${err.message || 'Unknown error'}`); // Keep error message
                        (0, sentry_1.captureException)(err, { context: 'reindex' }); // Keep Sentry capture
                        // Re-enable button in webview on failure (existing logic)
                        this.webview.postMessage({ command: "reenable_resync_button" });
                    }
                    break;
                case "delete_index":
                    console.log("Delete index command received for:", this.workspace); // Keep log
                    this.stopPolling(); // Stop polling before deleting (existing logic)
                    try {
                        // Keep existing axios.delete call
                        const response = await axios_1.default.delete(`${genUtils_1.httpBaseUrl}/delete_indexed_data_v2`, {
                            params: {
                                user_id: (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, ""),
                                project_path: (0, fileIndex_1.normalization)(this.workspace)
                            }
                        });
                        console.log("Delete index response:", response.data); // Keep log
                        vscode.window.showInformationMessage(response.data.message || "Index deletion requested."); // Keep message
                        // Refresh summary and restore button (existing logic)
                        this.getIndexSummary();
                        this.webview.postMessage({ command: "restore_delete_button" });
                    }
                    catch (error) {
                        console.error("Error deleting index:", error); // Keep error log
                        vscode.window.showErrorMessage(`Failed to delete index: ${error.response?.data?.message || error.message || 'Unknown error'}`); // Keep error message
                        (0, sentry_1.captureException)(error, { context: 'delete_index' }); // Keep Sentry capture
                        // Restore button even on error (existing logic)
                        this.webview.postMessage({ command: "restore_delete_button" });
                    }
                    break;
                case "go_back_to_menu": // Keep go_back_to_menu logic
                    this.panel?.dispose(); // Will trigger stopPolling via onDidDispose
                    // Show main menu
                    const mainMenu = new mainMenuProvider_1.mainMenuProvider(false); // Need subscriber status
                    mainMenu.initWebview();
                    break;
            }
        });
    }
    // Fetches summary and sends to webview. Returns true if progress < 100%, false otherwise/on error or stall.
    async getIndexSummary() {
        if (!this.webview || !this.panel || !this.workspace) {
            console.log("getIndexSummary: Cannot fetch, webview or workspace not available.");
            return false; // Cannot continue polling
        }
        try {
            // Keep existing axios.get call
            const response = await axios_1.default.get(`${genUtils_1.httpBaseUrl}/get_indexing_progress_v2`, {
                params: {
                    user_id: (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, ""),
                    project_path: (0, fileIndex_1.normalization)(this.workspace)
                }
            });
            // --- Type Check and Assign --- (Keep existing validation)
            if (response.data && typeof response.data.data === 'object' && response.data.data !== null) {
                this.indexSummary = response.data.data;
                this.pollingFailureCount = 0;
                // console.log("Index Summary fetched:", this.indexSummary); // Optional log
            }
            else {
                console.warn("getIndexSummary: Received invalid or missing summary data.", response.data);
                this.indexSummary = null;
                this.pollingFailureCount++;
                if (this.pollingFailureCount >= MAX_POLLING_FAILURES) {
                    vscode.window.showWarningMessage("Received invalid indexing data multiple times. Stopping updates.");
                    this.webview.postMessage({ command: "polling_error", value: "Invalid data" });
                    return false; // Stop polling
                }
                this.webview.postMessage({ command: "fill_summary", value: null });
                return true; // Continue polling to retry
            }
            // --- Destructure AFTER validation --- (Keep existing)
            if (!this.indexSummary) {
                // Should have been handled above, but safeguard remains
                return true;
            }
            const { success = 0, failures = 0, total = 0, pending = 0 } = this.indexSummary;
            // --- Post Message --- (Keep existing)
            this.webview.postMessage({
                command: "fill_summary",
                value: this.indexSummary
            });
            // --- Standard Completion Check --- (Keep existing)
            const isComplete = (total > 0 && (success + failures) >= total && pending === 0);
            if (isComplete) {
                console.log("Indexing appears complete.");
                this.resetStalledState(); // Reset stall state on normal completion (NEW)
                this.webview.postMessage({ command: "indexing_complete" });
                return false; // Stop polling
            }
            // --- Stall Condition Check --- (NEW LOGIC)
            if (pending === 0 && total > 0 && (success + failures) < total) {
                // Potential stall condition met
                if (this.lastStalledSuccess === success &&
                    this.lastStalledFailures === failures &&
                    this.lastStalledTotal === total) {
                    // Values are identical to the last poll during stall
                    this.stalledStateCounter++;
                    console.log(`Stalled state detected for ${this.stalledStateCounter} consecutive polls (S: ${success}, F: ${failures}, T: ${total}, P: ${pending}).`);
                }
                else {
                    // Values changed, or this is the first time seeing this specific stall state
                    // console.log(`Potential stall detected, resetting counter (New state: S: ${success}, F: ${failures}, T: ${total}, P: ${pending}).`);
                    this.stalledStateCounter = 1; // Start counting for this specific state
                    this.lastStalledSuccess = success;
                    this.lastStalledFailures = failures;
                    this.lastStalledTotal = total;
                }
                // Check if stall limit reached
                if (this.stalledStateCounter >= MAX_STALLED_STATE_COUNT) {
                    console.warn(`Polling stopped due to stalled state persisting for ${MAX_STALLED_STATE_COUNT} polls (S: ${success}, F: ${failures}, T: ${total}, P: ${pending}).`);
                    vscode.window.showWarningMessage("Indexing seems stalled. Stopping progress updates.");
                    this.resetStalledState(); // Reset state after stopping
                    this.webview.postMessage({ command: "polling_error", value: "Stalled" }); // Notify webview
                    // Ensure button is re-enabled in webview when polling stops due to stall
                    this.webview.postMessage({ command: "reenable_resync_button" });
                    return false; // Stop polling
                }
            }
            else {
                // Not in a stalled state (either pending > 0, completed, or total=0), reset stall tracking
                this.resetStalledState();
            }
            // --- End Stall Condition Check ---
            // If neither complete nor stalled limit reached
            return true; // Continue polling
        }
        catch (err) { // Keep existing catch block
            this.pollingFailureCount++;
            console.error(`Error fetching index summary (Attempt ${this.pollingFailureCount}/${MAX_POLLING_FAILURES}):`, err.response?.data || err.message);
            (0, sentry_1.captureException)(err, { context: 'getIndexSummaryPoll' }); // Add Sentry capture here too
            if (this.pollingFailureCount >= MAX_POLLING_FAILURES) {
                console.error("Max polling failures reached. Stopping polling.");
                vscode.window.showWarningMessage("Could not retrieve indexing progress after multiple attempts.");
                this.webview?.postMessage({ command: "polling_error", value: "Network/API Error" }); // Use optional chaining
                this.resetStalledState(); // Also reset stall state on network failure stop (NEW)
                return false; // Stop polling
            }
            // Don't update UI with stale/error data, just retry
            return true; // Continue polling (allow retries)
        }
    }
    startPolling() {
        if (this.isPolling) {
            // console.log("Polling already active."); // Optional log
            return;
        }
        if (!this.panel) {
            console.warn("Cannot start polling, panel is not available.");
            return;
        }
        console.log("Starting index progress polling.");
        this.isPolling = true;
        this.pollingFailureCount = 0;
        this.resetStalledState(); // Reset stall state every time polling starts (NEW)
        if (this.pollingTimeoutId) {
            clearTimeout(this.pollingTimeoutId);
            this.pollingTimeoutId = null;
        }
        this.pollProgress(); // Initial poll
    }
    stopPolling() {
        if (!this.isPolling && !this.pollingTimeoutId) {
            return;
        }
        console.log("Stopping index progress polling.");
        this.isPolling = false;
        if (this.pollingTimeoutId) {
            clearTimeout(this.pollingTimeoutId);
            this.pollingTimeoutId = null;
        }
        // Reset stall state when polling stops for any reason (NEW)
        this.resetStalledState();
        // Existing logic to notify webview
        if (this.webview && this.panel) { // Check panel and webview still exist
            // Check if the reason for stopping wasn't completion or error already sent
            // This check might be complex, simpler to just send re-enable always?
            // Or rely on specific stop conditions (like stall) to send the message.
            // Sending it here might re-enable button even if completed/errored out.
            // Let's remove it from here and rely on specific stop points (stall, error limit)
            // this.webview.postMessage({ command: "reenable_resync_button" });
        }
    }
    addFileInfoDetails() {
        if (this.webview && this.panel) { // Added panel check for safety
            this.webview.postMessage({
                command: "fill_info_section",
                value: { 'unsupportedFiles': this.unsupportedFiles, 'ignoredFilesAndFolders': this.ignoredFilesAndFolders }
            });
        }
    }
}
exports.IndexingProvider = IndexingProvider;
//# sourceMappingURL=indexingProvider.js.map