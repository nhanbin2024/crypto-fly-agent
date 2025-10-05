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
exports.ChatGPT4Provider = void 0;
const vscode = __importStar(require("vscode"));
const projectUtils_1 = require("../utils/projectUtils");
const extension_1 = require("../extension");
const fs = __importStar(require("fs"));
const treeNode_1 = require("../sidebars/treeNode");
const fileUtils_1 = require("../utils/fileUtils");
const authPanel_1 = require("../auth/authPanel");
const fileIndex_1 = require("../utils/fileIndex");
const socket_1 = require("../utils/socket");
const path_1 = __importDefault(require("path"));
const stringUtils_1 = __importStar(require("../utils/stringUtils"));
const genUtils_1 = require("../utils/genUtils");
const colors_1 = require("../utils/colors");
const chatHistoryManager_1 = require("../database/chatHistoryManager");
const checkpointManager_1 = require("../database/checkpointManager");
const uuid_1 = require("uuid");
const chatHistoryView_1 = require("./chatHistoryView");
const ignore = __importStar(require("ignore"));
const mainMenuProvider_1 = require("../mainMenu/mainMenuProvider");
const sentry_1 = require("../utils/sentry");
const Sentry = __importStar(require("@sentry/node"));
const axiosInstance_1 = require("../utils/axiosInstance");
var api = (0, axiosInstance_1.createAxiosInstance)();
// Move this class definition outside of ChatGPT4Provider
class ModificationCodeLens extends vscode.CodeLens {
    constructor(range, action, fileUri, isNewFile, blockId) {
        super(range);
        this.action = action;
        this.fileUri = fileUri;
        this.isNewFile = isNewFile;
        this.blockId = blockId;
    }
}
class ChatGPT4Provider {
    constructor(subscriber, threadId) {
        this.highlightedCode = "";
        this.threadId = null;
        this.currentAttachments = [];
        this.subcriber = true;
        this.fileSearchAttachment = [];
        this.filesChanged = new Set();
        this.initialFileChosen = false;
        this.currentWorkingFile = '';
        this.currentFiles = [];
        this.addedFiles = [];
        this.addedImages = [];
        this.allChatAddedFiles = {};
        this.currentChatId = null;
        this.chatId = null;
        this.gitignorePatterns = [];
        this.isApplyingEdit = false;
        this.originalBlocksCount = 0;
        this.finalBlockCount = 0;
        this.cachedCurEditorFileUri = null;
        // Add at top of class
        this.activeDecorations = new Map();
        this.threadId = threadId;
        this.initSocketConnection(subscriber);
        // Initialize currentWorkingFile with currently active document
        this.initCurrentWorkingFile();
        // Set up file change listeners
        this.setupFileListeners();
        (0, extension_1.setChatGPT4Provider)(this);
        // Initialize managers
        chatHistoryManager_1.ChatHistoryManager.getInstance().then(manager => {
            this.chatHistory = manager;
        }).catch(error => {
            console.error('Failed to initialize ChatHistoryManager:', error);
        });
        this.checkpointManager = checkpointManager_1.CheckpointManager.getInstance();
        this.pendingModifications = new Map();
        this.addDecorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(0, 255, 0, 0.1)',
            isWholeLine: true,
            after: {
                contentText: '// Added',
                color: 'rgba(0, 255, 0, 0.1)'
            },
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
        });
        this.removeDecorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            isWholeLine: true,
            textDecoration: 'line-through',
            after: {
                contentText: '// Removed',
                color: 'rgba(255, 0, 0, 0.1)'
            },
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
        });
        // Register the command handlers for accept/reject modifications
        this.registerModificationCommands();
        // Register the CodeLens provider
        this.setUpDecorationListener();
        //this.initializeTerminalListener();
        try {
            // ... existing constructor code ...
        }
        catch (error) {
            (0, sentry_1.captureException)(error, {
                context: 'ChatGPT4Provider initialization'
            });
            throw error;
        }
    }
    initCurrentWorkingFile() {
        const visibleEditors = vscode.window.visibleTextEditors;
        if (visibleEditors.length > 0) {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                this.currentWorkingFile = activeEditor.document.fileName;
                const relativePath = vscode.workspace.asRelativePath(activeEditor.document.uri);
                if (!this.addedFiles.includes(relativePath)) {
                    this.addedFiles.push(relativePath);
                }
            }
            else {
                const lastEditor = visibleEditors[visibleEditors.length - 1];
                this.currentWorkingFile = lastEditor.document.fileName;
                const relativePath = vscode.workspace.asRelativePath(lastEditor.document.uri);
                if (!this.addedFiles.includes(relativePath)) {
                    this.addedFiles.push(relativePath);
                }
            }
            // Update webview with initial file and context
            this.webview?.postMessage({
                command: "update_file_indicator",
                value: this.currentWorkingFile
            });
            this.webview?.postMessage({
                command: 'update_file_list',
                value: {
                    files: this.currentFiles,
                    addedFiles: this.addedFiles
                }
            });
        }
    }
    setupFileListeners() {
        // Listen for active editor changes
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                this.currentWorkingFile = editor.document.fileName;
                const relativePath = vscode.workspace.asRelativePath(editor.document.uri);
                // Add file to context if not already added
                if (!this.addedFiles.includes(relativePath)) {
                    this.addedFiles.push(relativePath);
                    // Update webview with new file list
                    this.webview?.postMessage({
                        command: 'update_file_list',
                        value: {
                            files: this.currentFiles,
                            addedFiles: this.addedFiles
                        }
                    });
                }
                this.webview?.postMessage({
                    command: "update_file_indicator",
                    value: this.currentWorkingFile
                });
            }
        });
        // Listen for file opens
        vscode.workspace.onDidOpenTextDocument(document => {
            this.currentWorkingFile = document.fileName;
            const relativePath = vscode.workspace.asRelativePath(document.uri);
            // Add file to context if not already added
            if (!this.addedFiles.includes(relativePath)) {
                this.addedFiles.push(relativePath);
                // Update webview with new file list
                this.webview?.postMessage({
                    command: 'update_file_list',
                    value: {
                        files: this.currentFiles,
                        addedFiles: this.addedFiles
                    }
                });
            }
            this.webview?.postMessage({
                command: "update_file_indicator",
                value: this.currentWorkingFile
            });
        });
        // Listen for file changes
        vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document === vscode.window.activeTextEditor?.document) {
                this.currentWorkingFile = event.document.fileName;
                const relativePath = vscode.workspace.asRelativePath(event.document.uri);
                // Add file to context if not already added
                if (!this.addedFiles.includes(relativePath)) {
                    this.addedFiles.push(relativePath);
                    // Update webview with new file list
                    this.webview?.postMessage({
                        command: 'update_file_list',
                        value: {
                            files: this.currentFiles,
                            addedFiles: this.addedFiles
                        }
                    });
                }
                this.webview?.postMessage({
                    command: "update_file_indicator",
                    value: event.document.fileName
                });
            }
        });
    }
    async initSocketConnection(subscriber) {
        this.wss = new socket_1.WebSocketClient(`${genUtils_1.socketBaseUrl}/standard_user_wss_v2`, (connected) => {
            this.webview?.postMessage({
                command: "onNetworkChanged",
                value: connected
            });
        });
        this.wss.setMessageCallback((json) => {
            try {
                // Handle error responses
                if (json.flag === "ERROR") {
                    vscode.window.showErrorMessage(json.message);
                    this.webview?.postMessage({
                        command: "fill_text",
                        value: {
                            id: json.id,
                            message: {
                                value: `Error: ${json.message}`
                            },
                            flag: "ERROR"
                        }
                    });
                    return;
                }
                if (json.flag === "UPGRADE") {
                    this.webview?.postMessage({
                        command: "show_upgrade_text",
                        value: {
                            message: json.message
                        }
                    });
                }
                // Handle successful responses
                if (json.thread_id) {
                    this.threadId = json.thread_id;
                }
                // Send message to webview
                this.webview?.postMessage({
                    command: "fill_text",
                    value: {
                        id: json.id,
                        message: {
                            value: json.message
                        },
                        thread_id: json.thread_id,
                        question_id: json.question_id,
                        flag: json.flag,
                        require_reindex: json.require_reindex,
                        project_path: json.project_path,
                        response: json.response,
                        response_id: json.response_id
                    }
                });
                // Save to chat history
                if (json.flag === "SUCCESS") {
                    this.chatHistory.messageExists("assistant_" + json.id).then(result => {
                        if (result) {
                            this.chatHistory.updateMessageContent("assistant_" + json.id, json.message).catch(e => {
                                console.error("Error updating message content:", e);
                            });
                        }
                        else {
                            this.chatHistory.saveMessage({
                                id: "assistant_" + json.id,
                                thread_id: json.thread_id,
                                chat_id: this.chatId ? this.chatId : "",
                                role: "assistant",
                                file_contents: [],
                                content: json.message,
                                timestamp: new Date()
                            }).catch(e => {
                                console.error("Error saving message:", e);
                            });
                        }
                    }).catch(e => {
                        (0, sentry_1.captureException)(e);
                        console.error("Error checking message existence:", e);
                    });
                }
                // Handle reindexing if needed
                if (json.require_reindex) {
                    (0, fileIndex_1.IndexWorkspaceFiles)(json.project_path).then(() => {
                        vscode.window.showInformationMessage("Codebase Index expired, initiating re-index.");
                    }).catch(e => {
                        console.error("Error reindexing workspace:", e);
                    });
                }
            }
            catch (e) {
                (0, sentry_1.captureException)(e);
            }
        });
    }
    dispose() {
        this.terminalListener?.dispose();
        this.panel?.dispose();
    }
    getWebView() {
        return this.panel;
    }
    setHighlightedCode(code) {
        this.highlightedCode = code;
        this.webview?.postMessage({
            command: "update_hightligted_code",
            value: this.highlightedCode
        });
    }
    setWorkingFile(filename, isIndexing) {
        this.webview?.postMessage({
            command: "set_working_file",
            value: {
                "filename": filename,
                "indexing": isIndexing
            }
        });
    }
    async loadGitignorePatterns() {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                return;
            }
            // Look for .gitignore in the root directory
            const gitignorePath = path_1.default.join(workspaceFolder.uri.fsPath, '.gitignore');
            if (fs.existsSync(gitignorePath)) {
                const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
                this.gitignorePatterns = gitignoreContent
                    .split('\n')
                    .filter(line => line.trim() && !line.startsWith('#'));
            }
        }
        catch (error) {
            (0, sentry_1.captureException)(error);
            console.error('Error loading .gitignore:', error);
        }
    }
    shouldIgnoreFile(filePath) {
        if (this.gitignorePatterns.length === 0) {
            return false;
        }
        const ig = ignore.default().add(this.gitignorePatterns);
        const relativePath = vscode.workspace.asRelativePath(filePath);
        return ig.ignores(relativePath);
    }
    async initializeFiles() {
        await this.loadGitignorePatterns();
        const files = await vscode.workspace.findFiles('**/*.*', '**/node_modules/**');
        this.currentFiles = files
            .map(file => vscode.workspace.asRelativePath(file))
            .filter(filePath => !this.shouldIgnoreFile(filePath));
    }
    async provideChat(loadHistory = false) {
        const iconPath = vscode.Uri.joinPath((0, extension_1.getExtensionContext)().extensionUri, 'waves.png');
        // Get all tabs and find empty ones
        const allTabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
        const emptyTab = allTabs.find(tab => {
            // Only consider tabs that are completely empty (no input)
            return !tab.input && !tab.label && !tab.group.activeTab?.input;
        });
        // Use the empty tab's column if found, otherwise use a new column
        const viewColumn = emptyTab?.group.viewColumn || vscode.ViewColumn.Beside;
        this.panel = vscode.window.createWebviewPanel('centeredInput', 'Sixth AI Tab', viewColumn, {
            enableScripts: true,
            retainContextWhenHidden: true,
        });
        this.panel.iconPath = iconPath;
        this.webview = this.panel.webview;
        (0, extension_1.setCurrentWebviewTab)(this.panel);
        (0, extension_1.setCurrentWebviewTabDisposed)(false);
        this.panel.onDidDispose(() => {
            // Panel has been disposed
            (0, extension_1.setCurrentWebviewTabDisposed)(true);
            (0, extension_1.setChatGPT4Provider)(null);
            this.wss.forceClose();
        });
        // Initialize files first
        await this.initializeFiles();
        // Get current file and add it to context
        const currentFile = this.getCurrentlyOpenedFile();
        if (currentFile) {
            this.addedFiles = [currentFile];
        }
        const themeColors = (0, colors_1.getThemeColors)();
        var html = fs.readFileSync(__dirname + "/chat.html", 'utf-8');
        html = (0, treeNode_1.fillTemplate)(html, JSON.stringify("standard"), "REPLACE_THIS");
        html = (0, treeNode_1.fillTemplate)(html, JSON.stringify("no"), "LOAD_THREAD");
        html = (0, treeNode_1.fillTemplate)(html, (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, "A")[0].toUpperCase(), "FIRST_LETTER");
        html = (0, treeNode_1.fillTemplate)(html, JSON.stringify(themeColors), "THEME_COLORS");
        this.webview.html = html;
        const defaultContext = (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.DEFAULT_CONTEXT, null);
        if (loadHistory && this.threadId) {
            this.fetchConversationsofThread(this.threadId);
        }
        this.webview.onDidReceiveMessage(async (message) => {
            try {
                if (message.command === "log_event") {
                    console.log("log_event called ", message.value);
                }
                if (message.command === "chat_timeout") {
                }
                if (message.command === "retry_connection") {
                    // Prepare v2 payload for retry
                    const payload = {
                        event: "generate",
                        user_id: (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, ""),
                        project_path: (0, fileIndex_1.normalization)((0, fileIndex_1.getProjectPath)()),
                        prompt: message.value,
                        context: [], // Empty context for retry
                        User_timezone_offset: new Date().getTimezoneOffset(),
                        id: Date.now().toString() // Generate new ID for retry
                    };
                    this.wss.sendMessage(JSON.stringify(payload));
                }
                if (message.command == "open_thread") {
                    this.threadId = message.value;
                    if (this.threadId !== null) {
                        if (this.webview) {
                            var html = fs.readFileSync(__dirname + "/chat.html", 'utf-8');
                            if (this.subcriber) {
                                html = (0, treeNode_1.fillTemplate)(html, JSON.stringify("standard"), "REPLACE_THIS");
                            }
                            else {
                                html = (0, treeNode_1.fillTemplate)(html, JSON.stringify("Free-tier"), "REPLACE_THIS");
                            }
                            html = (0, treeNode_1.fillTemplate)(html, JSON.stringify("yes"), "LOAD_THREAD");
                            html = (0, treeNode_1.fillTemplate)(html, (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, "A")[0].toUpperCase(), "FIRST_LETTER");
                            this.webview.html = html;
                            if (this.threadId)
                                this.fetchConversationsofThread(this.threadId);
                            this.initSocketConnection(this.subcriber);
                        }
                    }
                    else {
                        var html = fs.readFileSync(__dirname + "/chat.html", 'utf-8');
                        if (this.subcriber) {
                            html = (0, treeNode_1.fillTemplate)(html, JSON.stringify("standard"), "REPLACE_THIS");
                        }
                        else {
                            html = (0, treeNode_1.fillTemplate)(html, JSON.stringify("Free-tier"), "REPLACE_THIS");
                        }
                        html = (0, treeNode_1.fillTemplate)(html, JSON.stringify("no"), "LOAD_THREAD");
                        html = (0, treeNode_1.fillTemplate)(html, (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, "A")[0].toUpperCase(), "FIRST_LETTER");
                        if (this.webview)
                            this.webview.html = html;
                        this.initSocketConnection(this.subcriber);
                    }
                }
                if (message.command === "LOG_SENTRY_ERROR") {
                    (0, sentry_1.captureException)(message.value);
                }
                if (message.command === "chat_history") {
                    this.fetchThreadHistory();
                    //this.currentHtml = this.webview?.html
                    if (this.webview)
                        this.webview.html = fs.readFileSync(__dirname + "/history.html", 'utf-8');
                }
                if (message.command === "craft_email_link") {
                    vscode.env.openExternal(vscode.Uri.parse(`mailto:ope@trysixth.com?subject=Request%20to%20Upgrade%20my%20sixth%20account&body=Hi Sixth AI Team,%0A%0AI would like to upgrade my sixth account to access unlimited features. My account details are:%0A%0A
	Email: ${(0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, "A")}%0A
	API Key: ${(0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, "")}%0A
	%0A%0AThanks`));
                }
                if (message.command === "navigate_back") {
                    if (this.webview) {
                        var html = fs.readFileSync(__dirname + "/chat.html", 'utf-8');
                        if (this.subcriber) {
                            html = (0, treeNode_1.fillTemplate)(html, JSON.stringify("standard"), "REPLACE_THIS");
                        }
                        else {
                            html = (0, treeNode_1.fillTemplate)(html, JSON.stringify("Free-tier"), "REPLACE_THIS");
                        }
                        if (this.threadId) {
                            html = (0, treeNode_1.fillTemplate)(html, JSON.stringify("yes"), "LOAD_THREAD");
                        }
                        else {
                            html = (0, treeNode_1.fillTemplate)(html, JSON.stringify("no"), "LOAD_THREAD");
                        }
                        html = (0, treeNode_1.fillTemplate)(html, (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, "A")[0].toUpperCase(), "FIRST_LETTER");
                        this.webview.html = html;
                        if (this.threadId)
                            this.fetchConversationsofThread(this.threadId);
                        this.initSocketConnection(this.subcriber);
                    }
                }
                if (message.command === "open_select_file_context") {
                    //this.openFilePicker();
                }
                if (message.command === "create_file_for_code") {
                    const selectedFolder = await (0, fileUtils_1.selectFolder)();
                    const data = message.value;
                    if (selectedFolder) {
                        (0, fileUtils_1.createFileInDirectory)(selectedFolder, data["fileName"], data["code"]);
                        vscode.window.showInformationMessage(`Created ${data["fileName"]} file in ${selectedFolder} folder`);
                    }
                    else {
                        vscode.window.showWarningMessage('No folder selected.');
                    }
                }
                if (message.command === "add_code_immediately") {
                    const data = message.value;
                    if (data["needs"]) {
                        (0, fileUtils_1.insertMultilineSnippet)(data["code"], parseInt(data["line"]), data["needs"]);
                    }
                    else {
                        (0, fileUtils_1.insertMultilineStringIntoFile)(data["code"], parseInt(data["line"]));
                    }
                }
                if (message.command === "add_attachments") {
                    if (this.subcriber) {
                        try {
                            //this.currentAttachments = await this.openFilePicker()
                            var files = [];
                            this.currentAttachments.forEach(file => {
                                files.push((0, fileIndex_1.extractFileNameFromPath)(file.fsPath));
                            });
                            this.webview?.postMessage({
                                command: "set_file_attachments",
                                value: {
                                    "files": files,
                                    "loading": true
                                }
                            });
                            var attachmentFirebaseLinks = [];
                            for (let i = 0; i < this.currentAttachments.length; i++) {
                                var file = this.currentAttachments[i];
                                attachmentFirebaseLinks.push({
                                    file_link: await (0, fileUtils_1.uploadLocalFileAndGetURLV2)(file.fsPath, file.fsPath, (0, fileIndex_1.getProjectPath)()),
                                    file_name: (0, fileIndex_1.extractFileNameFromPath)(file.fsPath)
                                });
                            }
                        }
                        catch (error) {
                            (0, sentry_1.captureException)(error);
                        }
                        //this.createAttachments(attachmentFirebaseLinks)
                    }
                    else {
                        this.showAddCardModal();
                    }
                }
                if (message.command === "showInformationModal") {
                    vscode.window.showInformationMessage(message.value, {
                        modal: true
                    });
                }
                if (message.command === "redirect_to_payment") {
                    vscode.window.showInformationMessage("Loading payment details, please wait...");
                    (0, authPanel_1.createPaymentCheckout)(message.value, () => {
                        if (this.webview)
                            this.webview.postMessage({
                                command: "onDone",
                                value: "onDone"
                            });
                    });
                }
                if (message.command === "redirect_link") {
                    vscode.env.openExternal(vscode.Uri.parse(authPanel_1.generalCheckoutUrl));
                }
                if (message.command === "showUploadFileModal") {
                    if (message.value === "PICK_IMAGE") {
                        try {
                            const files = await this.openImagePicker();
                            if (files && files.length > 0) {
                                const file = files[0];
                                const fileName = path_1.default.basename(file.fsPath);
                                // Read file as base64
                                const imageBuffer = fs.readFileSync(file.fsPath);
                                const base64Image = imageBuffer.toString('base64');
                                const mimeType = `image/${path_1.default.extname(file.fsPath).slice(1)}`;
                                this.addedImages.push(file.fsPath);
                                // Send image data to webview
                                this.webview?.postMessage({
                                    command: "add_image_attachment",
                                    value: {
                                        fileName: fileName,
                                        path: file.fsPath,
                                        preview: `data:${mimeType};base64,${base64Image}`
                                    }
                                });
                            }
                        }
                        catch (error) {
                            vscode.window.showErrorMessage('Failed to add image attachment');
                            (0, sentry_1.captureException)(error);
                        }
                    }
                }
                if (message.command === "go_to_billing_from_paywall") {
                    this.createPaywallScreen();
                }
                if (message.command === "chat_with_user") {
                    if (this.subcriber) {
                        try {
                            var data = message.value;
                            data["vscode_version"] = "0.1.78";
                            data["apikey"] = (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, "");
                            data["project_path"] = (0, fileIndex_1.normalization)((0, fileIndex_1.getProjectPath)());
                            data["email"] = (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, "anonymous@gmail.com");
                            if (this.fileSearchAttachment.length > 0 && !this.initialFileChosen) {
                                data["user_prompt"] = (0, stringUtils_1.craftFilePrompts)(this.fileSearchAttachment) + data["user_prompt"];
                                this.fileSearchAttachment = [];
                                this.initialFileChosen = true;
                            }
                            if (this.fileSearchAttachment.length > 0 && this.initialFileChosen) {
                                var allFilesToUpdate = this.fileSearchAttachment.filter(file => this.filesChanged.has(file));
                                data["user_prompt"] = (0, stringUtils_1.updateFilePrompts)(allFilesToUpdate) + data["user_prompt"];
                                this.filesChanged.clear();
                                this.fileSearchAttachment = [];
                            }
                            if (this.threadId) {
                                data["thread_id"] = this.threadId;
                            }
                            var allContextFiles = [];
                            if (this.addedFiles) {
                                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                                if (workspaceFolder) {
                                    this.addedFiles.forEach(file => {
                                        if (file.endsWith(".git")) {
                                        }
                                        else {
                                            if (!file.includes(workspaceFolder.uri.fsPath)) {
                                                const fullPath = path_1.default.join(workspaceFolder.uri.fsPath, file);
                                                allContextFiles.push(fullPath);
                                            }
                                            else {
                                                allContextFiles.push(file);
                                            }
                                        }
                                    });
                                }
                            }
                            else {
                                if (!this.currentWorkingFile.endsWith(".git")) {
                                    allContextFiles.push(this.currentWorkingFile);
                                }
                            }
                            try {
                                if (!this.chatId) {
                                    this.chatId = await this.chatHistory.createChat(data["user_prompt"].substring(0, 50));
                                }
                                this.chatHistory.saveMessage({
                                    id: "user_" + data["id"],
                                    thread_id: this.threadId ? this.threadId : "",
                                    chat_id: this.chatId,
                                    role: "user",
                                    file_contents: allContextFiles,
                                    content: data["user_prompt"],
                                    timestamp: new Date()
                                }).then(response => {
                                }).catch(error => {
                                });
                                this.chatHistory.updateChatLastMessage(this.chatId, {
                                    id: "user_" + data["id"],
                                    thread_id: this.threadId ? this.threadId : "",
                                    chat_id: this.chatId,
                                    role: "user",
                                    file_contents: allContextFiles,
                                    content: data["user_prompt"],
                                    timestamp: new Date()
                                }).catch((error) => {
                                });
                            }
                            catch (error) {
                                (0, sentry_1.captureException)(error);
                            }
                            // Prepare context array
                            const contextArray = [];
                            allContextFiles.filter(filePath => !filePath.endsWith("git")).forEach(filePath => {
                                try {
                                    contextArray.push({
                                        file_name: this.normalizeFilePath(filePath),
                                        type: "file",
                                        file_content: fs.readFileSync(this.normalizeFilePath(filePath), 'utf-8')
                                    });
                                }
                                catch (error) {
                                    (0, sentry_1.captureException)(error);
                                }
                            });
                            if (this.addedImages.length > 0) {
                                const payload = {
                                    event: "vision",
                                    user_id: (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, ""),
                                    project_path: (0, fileIndex_1.normalization)((0, fileIndex_1.getProjectPath)()),
                                    prompt: data["user_prompt"],
                                    context: contextArray,
                                    User_timezone_offset: new Date().getTimezoneOffset(),
                                    id: data["id"],
                                    image_url: await (0, fileUtils_1.uploadLocalFileAndGetURLV2Image)(this.addedImages[this.addedImages.length - 1], this.extractFileName(this.addedImages[this.addedImages.length - 1]), (0, fileIndex_1.getProjectPath)())
                                };
                                if (this.threadId) {
                                    payload["thread_id"] = this.threadId;
                                }
                                this.wss.sendMessage(JSON.stringify(payload));
                            }
                            else {
                                // Prepare v2 payload
                                const payload = {
                                    event: "generate",
                                    user_id: (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, ""),
                                    project_path: (0, fileIndex_1.normalization)((0, fileIndex_1.getProjectPath)()),
                                    prompt: data["user_prompt"],
                                    context: contextArray,
                                    User_timezone_offset: new Date().getTimezoneOffset(),
                                    id: data["id"],
                                };
                                if (this.threadId) {
                                    payload["thread_id"] = this.threadId;
                                }
                                console.log("Thread id is ", this.threadId);
                                this.wss.sendMessage(JSON.stringify(payload));
                            }
                        }
                        catch (error) {
                            (0, sentry_1.captureException)(error);
                        }
                    }
                }
                if (message.command === "show_error_message") {
                    vscode.window.showErrorMessage("No code highlighted!, please highlight the part of your code you wish to perform this action on");
                }
                if (message.command === "show_info_message") {
                    vscode.window.showErrorMessage(message.value);
                }
                if (message.command === "special_chat_with_user") {
                    if (this.subcriber) {
                        if (this.highlightedCode !== "" && this.highlightedCode !== undefined && this.highlightedCode !== null) {
                            var data = {};
                            switch (message.value["user_prompt"]) {
                                case "/fix_code":
                                    data["user_prompt"] = `
										Do the following task on the given code
										- thoroughly debug this given code
										- highlight several scenarios in the code that could cause an error or bug
										- provide a comprehensive solution to the bugs or error
	
										code:
											${this.highlightedCode}
									`;
                                    break;
                                case "/run_code":
                                    data["user_prompt"] = `
										Do the following task on the given code
										- run this code and give the result of the code
										- if you can't run the code, give a potential result of what the code be
										- if you can't state any of the two, give a detailed step by step solution as to hoe the user can run the code
	
										code:
											${this.highlightedCode}
									`;
                                    break;
                                case "/optimize_code":
                                    data["user_prompt"] = `
										Do the following task on the given code
										- Decrease the time complexity of the code below if possible
										- Decrease the spack complexity of the code below if possible
										- provide the code fix for this
										- Briefly explain what was done wrong before and what you did better, and give the runtime analysis of the current code and your suggested code in a file called analysis.txt
										
										code:
											${this.highlightedCode}
									`;
                                    break;
                                case "/generate_unit_test":
                                    data["user_prompt"] = `
										Do the following task on the given code
										- Write a comprehensive set of unit tests for the below code. 
										- It should setup, run tests that check for correctness including important edge cases, and teardown. 
										- Ensure that the tests are complete and sophisticated.
	
										code:
											${this.highlightedCode}
									`;
                                    break;
                                case "/generate_doc_string":
                                    data["user_prompt"] = `
										Do the following task on the given code
										- Generate Docstring for the code below. 
										- It should state the parameters and their possible types, if the data type is not known use the flag <DATA_TYPE_HERE> as the data type. 
						
										
										code:
											${this.highlightedCode}
									`;
                                    break;
                            }
                            data["id"] = message.value["id"];
                            data["vscode_version"] = "0.1.78";
                            data["apikey"] = (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, "");
                            data["project_path"] = (0, fileIndex_1.normalization)((0, fileIndex_1.getProjectPath)());
                            data["email"] = (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, "anonymous@gmail.com");
                            if (this.fileSearchAttachment.length > 0) {
                                data["attachments"] = this.fileSearchAttachment;
                            }
                            if (this.threadId) {
                                data["thread_id"] = this.threadId;
                            }
                            this.wss.sendMessage(JSON.stringify(data));
                        }
                        else {
                            vscode.window.showErrorMessage("No code highlighted!, please highlight the part of your code you wish to perform this action on");
                        }
                    }
                    else {
                        this.createPaywallScreen();
                    }
                }
                if (message.command === "show_add_card_modal") {
                    this.showAddCardModal();
                }
                if (message.command === "useCase") {
                    if (message.value === "JIRA_GPT") {
                        vscode.commands.executeCommand('workbench.view.extension.sixth-jira-container');
                    }
                    if (message.value === "GPT40_UPGRADE") {
                        this.createPaywallScreen();
                    }
                }
                if (message.command === "GET_CONTEXTS") {
                    this.webview?.postMessage({
                        command: "CONTEXT_LIST",
                        value: extension_1.externalContextCurrentData !== null ? extension_1.externalContextCurrentData : {}
                    });
                }
                if (message.command === 'change_vector_store') {
                    const context = message.value;
                    if (context === 'Codebase') {
                        const defaultData = {
                            'external_context': 'Codebase',
                            'vector_store_id': 'default',
                            'email': (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, ''),
                            'apikey': (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, ''),
                            'vscode_version': '0.1.78',
                            'project_path': (0, fileIndex_1.normalization)((0, fileIndex_1.getProjectPath)())
                        };
                        (0, projectUtils_1.saveDataToCache)((0, extension_1.getExtensionContext)(), projectUtils_1.CURRENT_CONTEXT, 'Codebase');
                        //this.wss.sendMessage(JSON.stringify(defaultData));
                    }
                    else {
                        if (extension_1.externalContextCurrentData !== null) {
                            for (const key in extension_1.externalContextCurrentData) {
                                if (extension_1.externalContextCurrentData.hasOwnProperty(key)) {
                                    if (key.trim() === context.trim()) {
                                        try {
                                            const contextData = {
                                                'external_context': key,
                                                'vector_store_id': extension_1.externalContextCurrentData[key].vector_store_id,
                                                'email': (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, ''),
                                                'apikey': (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, ''),
                                                'vscode_version': '0.1.78',
                                                'project_path': (0, fileIndex_1.normalization)((0, fileIndex_1.getProjectPath)())
                                            };
                                            (0, projectUtils_1.saveDataToCache)((0, extension_1.getExtensionContext)(), projectUtils_1.CURRENT_CONTEXT, key);
                                            //this.wss.sendMessage(JSON.stringify(contextData));
                                        }
                                        catch (error) {
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                if (message.command === "get_file_list") {
                    try {
                        const files = await vscode.workspace.findFiles('**/*.*', '**/node_modules/**');
                        this.currentFiles = files
                            .map(file => vscode.workspace.asRelativePath(file))
                            .filter(filePath => !this.shouldIgnoreFile(filePath));
                        this.webview?.postMessage({
                            command: 'update_file_list',
                            value: {
                                files: this.currentFiles,
                                addedFiles: this.addedFiles
                            }
                        });
                    }
                    catch (error) {
                        (0, sentry_1.captureException)(error);
                    }
                }
                if (message.command === "get_file_list_with_id") {
                    try {
                        const id = message.value.id;
                        const files = await vscode.workspace.findFiles('**/*.*', '**/node_modules/**');
                        this.currentFiles = files
                            .map(file => vscode.workspace.asRelativePath(file))
                            .filter(filePath => !this.shouldIgnoreFile(filePath));
                        this.allChatAddedFiles[id] = this.addedFiles;
                        this.webview?.postMessage({
                            command: "update_file_list_with_id",
                            value: {
                                id: id,
                                files: this.currentFiles,
                                addedFiles: this.allChatAddedFiles[id]
                            }
                        });
                    }
                    catch (error) {
                        (0, sentry_1.captureException)(error);
                    }
                }
                if (message.command === "add_file_context") {
                    try {
                        const fileName = message.value;
                        if (!this.addedFiles.includes(fileName)) {
                            this.addedFiles.push(fileName);
                            this.webview?.postMessage({
                                command: 'update_file_list',
                                value: {
                                    files: this.currentFiles,
                                    addedFiles: this.addedFiles
                                }
                            });
                        }
                    }
                    catch (error) {
                        (0, sentry_1.captureException)(error);
                    }
                }
                if (message.command === "add_image_context") {
                    try {
                        const fileName = message.value;
                        this.addedImages.push(fileName);
                        this.webview?.postMessage({
                            command: 'update_file_list',
                            value: {
                                files: this.currentFiles,
                                addedFiles: this.addedImages
                            }
                        });
                    }
                    catch (error) {
                        (0, sentry_1.captureException)(error);
                    }
                }
                if (message.command === "add_file_context_with_id") {
                    const fileName = message.value.fileName;
                    try {
                        if (!this.allChatAddedFiles[message.value.id].includes(fileName)) {
                            this.allChatAddedFiles[message.value.id].push(fileName);
                            this.webview?.postMessage({
                                command: 'update_file_list_with_id',
                                value: {
                                    id: message.value.id,
                                    files: this.currentFiles,
                                    addedFiles: this.allChatAddedFiles[message.value.id]
                                }
                            });
                        }
                    }
                    catch (error) {
                        (0, sentry_1.captureException)(error);
                    }
                }
                if (message.command === "remove_file_context") {
                    try {
                        const fileName = message.value;
                        this.addedFiles = this.addedFiles.filter(f => f !== fileName);
                        this.addedImages = this.addedImages.filter(f => f !== fileName);
                        this.webview?.postMessage({
                            command: 'update_file_list',
                            value: {
                                files: this.currentFiles,
                                addedFiles: this.addedFiles
                            }
                        });
                    }
                    catch (error) {
                        (0, sentry_1.captureException)(error);
                    }
                }
                if (message.command === "remove_file_context_with_id") {
                    const fileName = message.value.fileName;
                    this.allChatAddedFiles[message.value.id] = this.allChatAddedFiles[message.value.id].filter((f) => f !== fileName);
                    this.webview?.postMessage({
                        command: 'update_file_list_with_id',
                        value: {
                            id: message.value.id,
                            files: this.currentFiles,
                            addedFiles: this.allChatAddedFiles[message.value.id]
                        }
                    });
                }
                if (message.command === "preview_file") {
                    try {
                        const filePath = message.value;
                        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                        const baseDir = workspaceFolder?.uri.fsPath;
                        if (this.isImageFile(filePath)) {
                            // For image files, read as base64
                            const imageBuffer = fs.readFileSync(baseDir + "/" + filePath);
                            const base64Image = imageBuffer.toString('base64');
                            const mimeType = `image/${path_1.default.extname(filePath).slice(1)}`; // Remove the dot from extension
                            this.webview?.postMessage({
                                command: "show_file_preview",
                                value: {
                                    filePath: filePath,
                                    content: `data:${mimeType};base64,${base64Image}`,
                                    isImage: true
                                }
                            });
                        }
                        else {
                            const fileContent = fs.readFileSync(baseDir + "/" + filePath, 'utf-8');
                            const lines = fileContent.split('\n').slice(0, 10).join('\n');
                            this.webview?.postMessage({
                                command: "show_file_preview",
                                value: {
                                    filePath: filePath,
                                    content: lines,
                                    language: this.getLanguageFromPath(filePath),
                                    isImage: false
                                }
                            });
                        }
                    }
                    catch (error) {
                        (0, sentry_1.captureException)(error);
                        vscode.window.showErrorMessage(`Error reading file: ${error}`);
                    }
                }
                if (message.command === "preview_file_with_id") {
                    try {
                        const filePath = message.value.filePath;
                        const id = message.value.id;
                        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                        const baseDir = workspaceFolder?.uri.fsPath;
                        if (this.isImageFile(filePath)) {
                            const imageBuffer = fs.readFileSync(baseDir + "/" + filePath);
                            const base64Image = imageBuffer.toString('base64');
                            const mimeType = `image/${path_1.default.extname(filePath).slice(1)}`;
                            this.webview?.postMessage({
                                command: "show_file_preview_with_id",
                                value: {
                                    filePath: filePath,
                                    content: `data:${mimeType};base64,${base64Image}`,
                                    id: id,
                                    isImage: true
                                }
                            });
                        }
                        else {
                            const fileContent = fs.readFileSync(baseDir + "/" + filePath, 'utf-8');
                            const lines = fileContent.split('\n').slice(0, 10).join('\n');
                            this.webview?.postMessage({
                                command: "show_file_preview_with_id",
                                value: {
                                    filePath: filePath,
                                    content: lines,
                                    language: this.getLanguageFromPath(filePath),
                                    id: id,
                                    isImage: false
                                }
                            });
                        }
                    }
                    catch (error) {
                        (0, sentry_1.captureException)(error);
                    }
                }
                if (message.command === "open_file") {
                    try {
                        const filePath = this.normalizeFilePath(message.value);
                        const document = await vscode.workspace.openTextDocument(filePath);
                        const allTabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
                        const nonChatTabs = allTabs.filter(tab => tab.input instanceof vscode.TabInputText &&
                            !tab.input.uri.path.includes('chat.html') &&
                            tab !== vscode.window.tabGroups.activeTabGroup.activeTab);
                        var editor = vscode.window.activeTextEditor;
                        const existingTab = nonChatTabs.find(tab => tab.input instanceof vscode.TabInputText &&
                            tab.input.uri.fsPath === filePath);
                        if (existingTab && existingTab.group) {
                            // File is already open, show it in its current group
                            editor = await vscode.window.showTextDocument(document, {
                                viewColumn: existingTab.group.viewColumn,
                                preserveFocus: true
                            });
                        }
                        else if (nonChatTabs.length > 0 && nonChatTabs[0].group) {
                            // Open in the first non-chat tab group
                            editor = await vscode.window.showTextDocument(document, {
                                viewColumn: nonChatTabs[0].group.viewColumn,
                                preserveFocus: true
                            });
                        }
                        else {
                            // No other editors, open beside
                            editor = await vscode.window.showTextDocument(document, {
                                viewColumn: vscode.ViewColumn.Beside,
                                preserveFocus: true
                            });
                        }
                    }
                    catch (error) {
                        vscode.window.showErrorMessage(`Error opening file: Have you applied the changes yet?`);
                    }
                }
                if (message.command === 'show_history') {
                    await this.showChatHistory();
                }
                if (message.command === 'create_new') {
                    this.threadId = null;
                    this.chatId = null;
                    this.addedFiles = []; // Reset added files
                    this.addedImages = [];
                    this.dispose(); // Clean up existing panel and listeners
                    this.provideChat(false); // Re-initialize with a fresh webview
                }
                if (message.command === 'close_panel') {
                    this.dispose();
                }
                if (message.command === 'apply_code') {
                    const modification = {
                        type: message.value.modification_type,
                        path: message.value.fullFilePath,
                        content: message.value.code
                    };
                    if (message.value.blocks) {
                        modification.blocks = this.parseSearchReplaceBlocks(message.value.code);
                    }
                    await this.applyFileModification(modification, message.value.question_id);
                }
                if (message.command === 'revert_changes') {
                    await this.revertChanges(message.value.question_id);
                }
                if (message.command === 'execute_command') {
                    await this.executeCommand(message.value);
                }
                if (message.command === 'open_function') {
                    const functionLocation = await this.findFunctionLocation(message.value.filePath, message.value.functionName);
                    if (functionLocation) {
                        await this.openLocation(functionLocation);
                    }
                }
                if (message.command === 'open_class') {
                    const classLocation = await this.findClassLocation(message.value.filePath, message.value.className);
                    if (classLocation) {
                        await this.openLocation(classLocation);
                    }
                }
                if (message.command === 'copy_to_clipboard') {
                    try {
                        const extractedContent = this.extractReplaceBlocks(message.value.code);
                        await vscode.env.clipboard.writeText(extractedContent);
                        vscode.window.showInformationMessage('Code copied to clipboard');
                    }
                    catch (error) {
                        vscode.window.showErrorMessage(`Failed to copy to clipboard: ${error}`);
                    }
                }
                // Add to the message handler in provideChat
                if (message.command === 'retry_message') {
                    try {
                        await this.wss.reconnect();
                        // If reconnection successful, try to resend last message
                        if (this.wss.getConnectionStatus()) { // Use public method instead
                            this.webview?.postMessage({
                                command: 'connection_restored'
                            });
                        }
                        else {
                            this.webview?.postMessage({
                                command: 'connection_failed'
                            });
                        }
                    }
                    catch (error) {
                        this.webview?.postMessage({
                            command: 'connection_failed'
                        });
                    }
                }
                // Add to the message handler in provideChat
                if (message.command === 'show_menu') {
                    // Close chat panel
                    this.panel?.dispose();
                    // Show main menu
                    const mainMenu = new mainMenuProvider_1.mainMenuProvider(this.subcriber);
                    mainMenu.initWebview();
                }
                if (message.command === 'scroll_block') {
                    const curBlockIndex = message.value.block_index - 1;
                    if (this.cachedCurEditorFileUri !== null) {
                        const editor = vscode.window.visibleTextEditors.find(e => e.document.uri.fsPath === this.cachedCurEditorFileUri?.fsPath);
                        if (!editor) {
                            console.warn(`[Reject] Editor not found for ${this.cachedCurEditorFileUri.fsPath}`);
                            return;
                        }
                        const documentFsPath = editor.document.uri.fsPath;
                        const pendingModificationData = this.pendingModifications.get(documentFsPath);
                        if (pendingModificationData) {
                            if (pendingModificationData.blocks.length > curBlockIndex) {
                                this.scrollToBlock(editor, pendingModificationData.blocks[curBlockIndex]);
                            }
                        }
                    }
                }
                if (message.command === 'accept_all') {
                    if (this.cachedCurEditorFileUri !== null) {
                        this.applyAllModifications('accept', this.cachedCurEditorFileUri);
                    }
                }
                if (message.command === 'reject_all') {
                    if (this.cachedCurEditorFileUri !== null) {
                        this.applyAllModifications('reject', this.cachedCurEditorFileUri);
                    }
                }
            }
            catch (error) {
                (0, sentry_1.captureException)(error);
            }
        });
        this.setupHistoryListeners();
        // After setting the webview HTML, initialize with current file
        try {
            const initialFile = this.getCurrentlyOpenedFile();
            if (initialFile) {
                this.addedFiles = [initialFile];
                // Send initial file list with the current file already added
                this.webview?.postMessage({
                    command: 'update_file_list',
                    value: {
                        files: this.currentFiles,
                        addedFiles: this.addedFiles
                    }
                });
            }
        }
        catch (error) {
            (0, sentry_1.captureException)(error);
        }
    }
    showAddCardModal(plan = "year") {
        var pricing = 4.99;
        if (plan === "year") {
            pricing = 49.99;
        }
        const panel = vscode.window.createWebviewPanel('centeredInput', 'Update your billing Info', vscode.ViewColumn.Active, // Show in the active editor column
        {
            enableScripts: true,
        });
        panel.webview.html = (0, authPanel_1.createBillingPanel)(pricing, plan);
        panel.webview.onDidReceiveMessage((message) => {
            if (message.command === "show_info_message") {
                vscode.window.showInformationMessage(message.value);
            }
            if (message.command === "billing_submit") {
                vscode.window.showInformationMessage("Updating your billing info");
                (0, authPanel_1.initPaymentForUser)((0, extension_1.getExtensionContext)(), message.value["id"], (message) => {
                    (0, projectUtils_1.saveDataToCache)((0, extension_1.getExtensionContext)(), projectUtils_1.ADDED_BILLING, "true");
                    if (plan === "year") {
                        api.post(`/notiy_me_of_yearly_plan`, {
                            email: (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, ""),
                            user_id: (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, "")
                        }).then((response) => {
                        });
                    }
                    panel.dispose();
                }, (message) => {
                });
            }
            if (message.command === "error") {
                vscode.window.showInformationMessage(message.value);
            }
        });
    }
    fetchThreadHistory() {
        api.get(`/retrieve_threads?apikey=${(0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, "")}`)
            .then(response => {
            const threads = response.data.data;
            if (this.webview)
                this.webview.postMessage({
                    command: "fill_history",
                    value: threads
                });
        });
    }
    fetchConversationsofThread(threadId) {
        api.get(`/retrieve_all_thread_messages?apikey=${(0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, "")}&project_path=not&thread_id=${threadId}&vscode_version=0.1.78`)
            .then(response => {
            const threads = response.data.data;
            if (this.webview) {
                this.webview.postMessage({
                    command: "fill_history",
                    value: threads
                });
            }
        });
    }
    createPaywallScreen() {
        const allTabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
        const emptyTab = allTabs.find(tab => {
            // Only consider tabs that are completely empty (no input)
            return tab.input && tab.label && tab.group.activeTab?.input;
        });
        // Use the empty tab's column if found, otherwise use a new column
        const viewColumn = emptyTab?.group.viewColumn || vscode.ViewColumn.Beside;
        var paymentPanel = vscode.window.createWebviewPanel('centeredInput', 'Upgrade your account', viewColumn, {
            enableScripts: true,
            retainContextWhenHidden: true,
        });
        const iconPath = vscode.Uri.joinPath((0, extension_1.getExtensionContext)().extensionUri, 'waves.png');
        paymentPanel.iconPath = iconPath;
        paymentPanel.webview.html = fs.readFileSync(__dirname + "/paywall.html", 'utf-8');
        paymentPanel.webview.onDidReceiveMessage(async (message) => {
            if (message.command === "redirect_to_payment") {
                vscode.window.showInformationMessage("Loading payment details, please wait...");
                (0, authPanel_1.createPaymentCheckout)(message.value, () => {
                    if (this.webview)
                        this.webview.postMessage({
                            command: "onDone",
                            value: "onDone"
                        });
                });
            }
        });
    }
    // Update getCurrentlyOpenedFile to handle multiple windows
    getCurrentlyOpenedFile() {
        // Get all visible text editors
        const visibleEditors = vscode.window.visibleTextEditors;
        if (visibleEditors.length > 0) {
            // Get the most recently active editor
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                var result = vscode.workspace.asRelativePath(activeEditor.document.uri);
                if (result.trim().includes(".git")) {
                    return undefined;
                }
                return result;
            }
            // If no active editor, use the last visible editor
            const lastEditor = visibleEditors[visibleEditors.length - 1];
            var result = vscode.workspace.asRelativePath(lastEditor.document.uri);
            if (result.trim().includes(".git")) {
                return undefined;
            }
            return result;
        }
        return undefined;
    }
    // Add this helper function to check if a file is an image
    isImageFile(filePath) {
        try {
            const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'];
            const ext = path_1.default.extname(filePath).toLowerCase();
            return imageExtensions.includes(ext);
        }
        catch (error) {
            (0, sentry_1.captureException)(error);
            return false;
        }
    }
    // Add this helper method to get language from file extension
    getLanguageFromPath(filePath) {
        try {
            const ext = path_1.default.extname(filePath).toLowerCase().slice(1);
            // Map file extensions to Prism language classes
            const languageMap = {
                'js': 'javascript',
                'ts': 'typescript',
                'py': 'python',
                'html': 'html',
                'css': 'css',
                'json': 'json',
                'md': 'markdown',
                // Add more mappings as needed
            };
            return languageMap[ext] || 'plaintext';
        }
        catch (error) {
            (0, sentry_1.captureException)(error);
            return 'plaintext';
        }
    }
    // Add this method to handle error fix chat messages
    handleErrorFixChat(prompt, contextChip, errorCode, fileRange) {
        if (this.webview) {
            // Create the message with context
            const message = {
                command: 'error_fix_chat',
                value: {
                    "id": Date.now().toString(),
                    "message": {
                        "value": `${prompt}`,
                        "context_chip": contextChip,
                        "file_range": fileRange
                    }
                }
            };
            // Send to webview
            this.webview.postMessage(message);
            // Set the current working file
            this.currentWorkingFile = fileRange.file;
            this.setWorkingFile(fileRange.file, false);
        }
    }
    parseSearchReplaceBlocks(content) {
        return stringUtils_1.default.parseBlocks(content);
    }
    // Add the CodeLens provider
    normalizeFilePath(filePath) {
        try {
            const baseWorkspace = (0, stringUtils_1.getRootWorkspaceFolder)();
            // Normalize paths by removing trailing slashes and converting backslashes to forward slashes
            const normalizedBase = baseWorkspace.replace(/[\\/]+$/, '').replace(/\\/g, '/');
            const normalizedPath = filePath.replace(/\\/g, '/');
            // Split both paths into segments
            const baseSegments = normalizedBase.split('/').filter(Boolean);
            const pathSegments = normalizedPath.split('/').filter(Boolean);
            // Find the overlap between the paths
            let overlapIndex = -1;
            for (let i = pathSegments.length - 1; i >= 0; i--) {
                const segment = pathSegments[i];
                const baseIndex = baseSegments.lastIndexOf(segment);
                if (baseIndex !== -1) {
                    // Verify that all previous segments match
                    let matches = true;
                    for (let j = 0; j <= i; j++) {
                        if (pathSegments[j] !== baseSegments[baseIndex - i + j]) {
                            matches = false;
                            break;
                        }
                    }
                    if (matches) {
                        overlapIndex = i;
                        break;
                    }
                }
            }
            // Construct the final path
            const finalSegments = [...baseSegments];
            if (overlapIndex !== -1) {
                // Add only the non-overlapping segments from the filePath
                finalSegments.push(...pathSegments.slice(overlapIndex + 1));
            }
            else {
                // No overlap found, add all segments from filePath
                finalSegments.push(...pathSegments);
            }
            // Join segments and ensure it starts with a forward slash
            return '/' + finalSegments.join('/');
        }
        catch (error) {
            (0, sentry_1.captureException)(error);
            return filePath;
        }
    }
    // Update applyFileModification to use this
    async applyFileModification(modification, questionId) {
        try {
            const normalizedPath = this.normalizeFilePath(modification.path);
            const fileUri = vscode.Uri.file(normalizedPath);
            // Create a checkpoint before applying modifications
            if (this.threadId && this.chatId) {
                try {
                    let checkpointContent = '';
                    if (modification.type === 'update') {
                        try {
                            const document = await vscode.workspace.openTextDocument(fileUri);
                            checkpointContent = document.getText();
                        }
                        catch (error) {
                            // File doesn't exist yet
                        }
                    }
                    await this.checkpointManager.createCheckpoint({
                        id: this.chatId,
                        thread_id: this.threadId,
                        checkpoint_content: checkpointContent,
                        full_file_path: normalizedPath,
                        modification_type: modification.type,
                        question_id: questionId
                    });
                }
                catch (error) {
                    console.error('Error creating checkpoint:', error);
                }
            }
            let editor;
            let document;
            let isNewFile = false;
            // Get all non-chat tabs
            const allTabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
            const nonChatTabs = allTabs.filter(tab => tab.input instanceof vscode.TabInputText &&
                !tab.input.uri.path.includes('chat.html') &&
                tab !== vscode.window.tabGroups.activeTabGroup.activeTab);
            try {
                document = await vscode.workspace.openTextDocument(fileUri);
                // Try to find if this file is already open
                const existingTab = nonChatTabs.find(tab => tab.input instanceof vscode.TabInputText &&
                    tab.input.uri.fsPath === fileUri.fsPath);
                if (existingTab && existingTab.group) {
                    // File is already open, show it in its current group
                    editor = await vscode.window.showTextDocument(document, {
                        viewColumn: existingTab.group.viewColumn,
                        preserveFocus: true
                    });
                }
                else if (nonChatTabs.length > 0 && nonChatTabs[0].group) {
                    // Open in the first non-chat tab group
                    editor = await vscode.window.showTextDocument(document, {
                        viewColumn: nonChatTabs[0].group.viewColumn,
                        preserveFocus: true
                    });
                }
                else {
                    // No other editors, open beside
                    editor = await vscode.window.showTextDocument(document, {
                        viewColumn: vscode.ViewColumn.Beside,
                        preserveFocus: true
                    });
                }
            }
            catch {
                isNewFile = true;
                const edit = new vscode.WorkspaceEdit();
                edit.createFile(fileUri, { overwrite: true });
                await vscode.workspace.applyEdit(edit);
                document = await vscode.workspace.openTextDocument(fileUri);
                if (nonChatTabs.length > 0 && nonChatTabs[0].group) {
                    // Open new file in existing editor group
                    editor = await vscode.window.showTextDocument(document, nonChatTabs[0].group.viewColumn);
                }
                else {
                    // No other editors, open beside
                    editor = await vscode.window.showTextDocument(document, vscode.ViewColumn.Beside);
                }
            }
            const blocks = [];
            if (!isNewFile && modification.type === 'update') {
                const searchReplaceBlocks = this.parseSearchReplaceBlocks(modification.content);
                this.originalBlocksCount = searchReplaceBlocks.length;
                for (const block of searchReplaceBlocks) {
                    const searchContent = block.search.trim();
                    const replaceContent = block.replace.trim();
                    const searchIndex = (0, stringUtils_1.findCodeSnippetRange)(searchContent, document.getText());
                    if (searchIndex.startLine !== -1 && searchIndex.found !== false) {
                        console.log("JUST NORMS");
                        const startLineNumber = searchIndex.startLine;
                        const endLineNumber = searchIndex.endLine;
                        if (startLineNumber >= 0 && endLineNumber < document.lineCount && startLineNumber <= endLineNumber) {
                            const startPos = new vscode.Position(startLineNumber, 0);
                            const endLineObject = document.lineAt(endLineNumber);
                            const endLineLength = endLineObject.text.length;
                            const endPos = new vscode.Position(endLineNumber, endLineLength);
                            // Create ranges for both search and replace blocks
                            const searchRange = new vscode.Range(startPos, endPos);
                            // Extract the actual text content from the document using the calculated range
                            const correctSearchContent = document.getText(searchRange);
                            console.log("let's see what the search range gives in actuality", correctSearchContent);
                            const replaceRange = new vscode.Range(
                            // Your original calculation - review its intent:
                            new vscode.Position(startPos.line + this.countLines(correctSearchContent), 0), new vscode.Position(endPos.line + this.countLines(block.originalReplace), 0)
                            // Common Alternative 1: Replace the searchRange content
                            // const replaceRange = searchRange;
                            // Common Alternative 2: Insert after the searchRange (e.g., on the next line)
                            // const replaceRange = new vscode.Range(searchRange.end.translate(1, -searchRange.end.character), searchRange.end.translate(1, -searchRange.end.character)); // Creates a zero-length range for insertion
                            );
                            blocks.push({
                                id: (0, uuid_1.v4)(),
                                searchRange,
                                replaceRange,
                                replaceContent,
                                searchContent: correctSearchContent,
                                originalReplaceContent: block.originalReplace,
                                documentAtTimeOfEdit: document.getText(),
                                questionId: questionId // Add the questionId to each block
                            });
                        }
                        else {
                            // Handle cases where the returned line numbers are out of bounds
                            console.error(`Error: Invalid line numbers received from alignment function. Start=${startLineNumber}, End=${endLineNumber}. Document lines=${document.lineCount}`);
                            // Potentially notify the user or log this error more formally
                        }
                    }
                    else {
                        const misMatchedSearchIndex = (0, stringUtils_1.findCodeRangeWithAlignment)(searchContent, document.getText());
                        // Check if a valid match was found (found is true AND startLine is valid)
                        if (misMatchedSearchIndex.found && misMatchedSearchIndex.startLine !== -1) {
                            const startLineNumber = misMatchedSearchIndex.startLine;
                            const endLineNumber = misMatchedSearchIndex.endLine;
                            console.log("Match found by alignment function: StartLine=", startLineNumber, "EndLine=", endLineNumber);
                            // --- Corrected Position and Range Creation ---
                            // Validate that the returned line numbers are within the document bounds
                            if (startLineNumber >= 0 && endLineNumber < document.lineCount && startLineNumber <= endLineNumber) {
                                // Position at the START of the startLine (e.g., line 6, character 0)
                                const startPos = new vscode.Position(startLineNumber, 0);
                                // Position at the END of the endLine (e.g., line 29, character at the end of that line's text)
                                // Ensure the line number is valid before accessing .lineAt()
                                const endLineObject = document.lineAt(endLineNumber);
                                const endLineLength = endLineObject.text.length;
                                const endPos = new vscode.Position(endLineNumber, endLineLength);
                                console.log("Calculated Positions: Start(L,C)=", startPos.line, startPos.character, "End(L,C)=", endPos.line, endPos.character);
                                // Create the range spanning from the start of the start line to the end of the end line
                                const searchRange = new vscode.Range(startPos, endPos);
                                // Extract the actual text content from the document using the calculated range
                                const correctSearchContent = document.getText(searchRange);
                                // --- End of Correction ---
                                console.log("Extracted correctSearchContent:", correctSearchContent);
                                const replaceRange = new vscode.Range(
                                // Your original calculation - review its intent:
                                new vscode.Position(startPos.line + this.countLines(correctSearchContent), 0), new vscode.Position(endPos.line + this.countLines(block.originalReplace), 0)
                                // Common Alternative 1: Replace the searchRange content
                                // const replaceRange = searchRange;
                                // Common Alternative 2: Insert after the searchRange (e.g., on the next line)
                                // const replaceRange = new vscode.Range(searchRange.end.translate(1, -searchRange.end.character), searchRange.end.translate(1, -searchRange.end.character)); // Creates a zero-length range for insertion
                                );
                                blocks.push({
                                    id: (0, uuid_1.v4)(),
                                    searchRange: searchRange, // Use the correctly calculated range
                                    replaceRange: replaceRange, // Use the calculated (but needs review) replace range
                                    replaceContent: replaceContent,
                                    searchContent: correctSearchContent, // Use the actual content found in the document
                                    originalReplaceContent: block.originalReplace,
                                    documentAtTimeOfEdit: document.getText(),
                                    questionId: questionId // Add the questionId to each block
                                });
                            }
                            else {
                                // Handle cases where the returned line numbers are out of bounds
                                console.error(`Error: Invalid line numbers received from alignment function. Start=${startLineNumber}, End=${endLineNumber}. Document lines=${document.lineCount}`);
                                // Potentially notify the user or log this error more formally
                            }
                        }
                        else {
                            // Handle the case where the alignment function did not find a match
                            console.log("Alignment function did not find a suitable match for the search content.");
                            // Potentially notify the user or try a different matching strategy
                        }
                    }
                }
                // Store modification details
                this.pendingModifications.set(fileUri.fsPath, {
                    originalContent: document.getText(),
                    blocks,
                    isNewFile: isNewFile,
                    questionId: questionId
                });
                console.log("show you stupid face mf", this.pendingModifications);
                // Apply initial decorations and CodeLens
                if (editor) {
                    // updateDecorations now handles both decorations and CodeLens
                    this.updateDecorations(editor, blocks, true);
                }
            }
            else {
                const searchReplaceBlocks = this.parseSearchReplaceBlocks(modification.content);
                if (searchReplaceBlocks.length > 0) {
                    editor.edit(edit => {
                        edit.insert(new vscode.Position(0, 0), searchReplaceBlocks[0].originalReplace);
                    });
                }
                else {
                    editor.edit(edit => {
                        edit.insert(new vscode.Position(0, 0), modification.content);
                    });
                }
            }
        }
        catch (error) {
            (0, sentry_1.captureException)(error);
            vscode.window.showErrorMessage(`Failed to apply file modification: Please use the Copy button instead`);
        }
    }
    // Update the updateDecorations method
    async updateDecorations(editor, blocksToProcess, writeDiffViewToFile = true) {
        // Guard against re-entrancy
        if (this.isApplyingEdit) {
            console.warn("updateDecorations called while already applying an edit. Skipping.");
            return;
        }
        this.isApplyingEdit = true;
        try {
            // Setup: Get the current document text
            const originalDocText = editor.document.getText();
            // Pass 1: Find Original Locations & Filter
            const foundBlocks = [];
            for (const block of blocksToProcess) {
                // Only perform the search if originalSearchRange is not already defined
                if (!('originalSearchRange' in block)) {
                    const result = (0, stringUtils_1.findCodeSnippetRange)(block.searchContent, originalDocText);
                    console.log("i want to see every result generated", result, block.searchContent);
                    if (result.found) {
                        // Validate the returned 0-based startLine and endLine
                        if (result.startLine >= 0 &&
                            result.endLine < editor.document.lineCount &&
                            result.startLine <= result.endLine) {
                            // Create a Range representing the found location in the original document
                            const originalSearchRange = new vscode.Range(new vscode.Position(result.startLine, 0), new vscode.Position(result.endLine, editor.document.lineAt(result.endLine)?.text.length ?? 0));
                            // Assign to block and add to foundBlocks array
                            block.originalSearchRange = originalSearchRange;
                            foundBlocks.push(block);
                        }
                        else {
                            console.warn(`Invalid range for block ${block.id}: startLine=${result.startLine}, endLine=${result.endLine}`);
                        }
                    }
                    else {
                        console.warn(`Search content not found for block ${block.id}`);
                    }
                }
                else {
                    // Block already has originalSearchRange, just add it to foundBlocks
                    foundBlocks.push(block);
                }
            }
            // Handle No Blocks: If foundBlocks is empty, clear decorations and return
            if (foundBlocks.length === 0) {
                editor.setDecorations(this.addDecorationType, []);
                editor.setDecorations(this.removeDecorationType, []);
                if (this.codeLensProviderDisposable) {
                    this.codeLensProviderDisposable.dispose();
                    this.codeLensProviderDisposable = undefined;
                }
                return;
            }
            // Pass 2: Sort & Calculate Virtual Final State
            // Sort blocks based on originalSearchRange.start position
            console.log("i want to fucking see normal blocks", foundBlocks);
            foundBlocks.sort((a, b) => {
                if (a.originalSearchRange.start.line !== b.originalSearchRange.start.line) {
                    return a.originalSearchRange.start.line - b.originalSearchRange.start.line;
                }
                return a.originalSearchRange.start.character - b.originalSearchRange.start.character;
            });
            console.log("i want to fucking see found blocks", foundBlocks);
            // Initialize virtual document state
            let cumulativeLineOffset = 0;
            let currentVirtualDocLines = originalDocText.split('\n');
            const finalBlockData = [];
            // Process blocks in sorted order to calculate virtual final state
            for (const block of foundBlocks) {
                // Ensure originalSearchRange exists (it should based on Pass 1)
                if (!block.originalSearchRange) {
                    console.warn(`Block ${block.id} missing originalSearchRange in Pass 2`);
                    continue;
                }
                // Calculate current virtual position for this block's search content
                const currentSearchStartLine = block.originalSearchRange.start.line + cumulativeLineOffset;
                const currentSearchEndLine = block.originalSearchRange.end.line + cumulativeLineOffset;
                // Validate virtual range is within bounds
                if (currentSearchStartLine < 0 || currentSearchEndLine >= currentVirtualDocLines.length) {
                    console.warn(`Virtual search range out of bounds for block ${block.id}: startLine=${currentSearchStartLine}, endLine=${currentSearchEndLine}, docLines=${currentVirtualDocLines.length}`);
                    continue;
                }
                // Calculate line counts
                const searchLineCount = currentSearchEndLine - currentSearchStartLine + 1;
                console.log("let me see original replace content", block.originalReplaceContent);
                // Normalize replacement content (ensure consistent line endings)
                const normalizedReplaceContent = block.originalReplaceContent.replace(/\r\n/g, '\n');
                // Split replacement content into lines
                const replaceLines = normalizedReplaceContent.split('\n');
                // Calculate accurate replace line count (number of lines the replacement WILL ADD)
                let replaceLineCount;
                if (normalizedReplaceContent === '') {
                    // If the replacement is empty, we add zero lines.
                    replaceLineCount = 0;
                }
                else {
                    // split('\n') result length correctly represents the number of lines
                    // that will be inserted into the virtual document array.
                    // "A" -> ['A'] -> adds 1 line
                    // "A\nB" -> ['A', 'B'] -> adds 2 lines
                    // "A\nB\n" -> ['A', 'B', ''] -> adds 3 lines (A, B, and an empty line after B)
                    // "\n" -> ['', ''] -> adds 2 lines (empty line, empty line) - Wait, this seems wrong for just a newline.
                    // Let's rethink the newline case for insertion.
                    // If normalizedReplaceContent is just "\n", replaceLines is ['', ''].
                    // Inserting ['', ''] adds two empty lines. Is that the intent?
                    // Usually, replacing with "\n" means inserting ONE blank line.
                    // Let's adjust the calculation specifically for offset purposes:
                    if (normalizedReplaceContent === '\n') {
                        replaceLineCount = 1; // A single newline character adds one line break.
                    }
                    else {
                        replaceLineCount = replaceLines.length; // Otherwise, the array length is the number of items added.
                    }
                }
                // Apply virtual edit by splicing the virtual document lines array
                console.log("before splice", currentVirtualDocLines);
                if (replaceLineCount > 0) {
                    // Use the correct `replaceLines` array from the split, even if count was adjusted for offset
                    currentVirtualDocLines.splice(currentSearchEndLine + 1, // Start index (line *after* search end)
                    0, // Remove 0 items
                    ...replaceLines // Insert the replacement lines
                    );
                    console.log("after splice", currentVirtualDocLines);
                }
                // Add processed block to finalBlockData
                finalBlockData.push(block);
                // Update line offset for subsequent blocks
                cumulativeLineOffset += replaceLineCount;
            }
            // Join the lines back into a single string for the final document state
            const finalDocumentText = currentVirtualDocLines.join('\n');
            // Pass 3: Apply Edit (Show Diff View - Conditional)
            let docAfterEdit = editor.document;
            let editAppliedSuccessfully = true;
            // Only apply the edit if requested and there are blocks to process
            if (writeDiffViewToFile && finalBlockData.length > 0) {
                // Only apply edit if the text actually changed
                if (finalDocumentText !== originalDocText) {
                    try {
                        // Apply a single edit operation to replace the entire document
                        const entireDocumentRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(editor.document.lineCount, 0));
                        const editResult = await editor.edit(editBuilder => {
                            editBuilder.replace(entireDocumentRange, finalDocumentText);
                        }, { undoStopBefore: true, undoStopAfter: true });
                        if (!editResult) {
                            console.error("Failed to apply editor edit");
                            vscode.window.showErrorMessage("Failed to apply suggested code changes. Please try again.");
                            editAppliedSuccessfully = false;
                        }
                        else {
                            // Update document reference after successful edit
                            docAfterEdit = editor.document;
                        }
                    }
                    catch (error) {
                        console.error("Error applying edit:", error);
                        editAppliedSuccessfully = false;
                    }
                }
            }
            // Only proceed if the edit was successful or not required
            if (editAppliedSuccessfully) {
                // Pass 4: Calculate Final Decoration Ranges
                const docTextForFinalSearch = docAfterEdit.getText();
                const docLinesForFinalSearch = docTextForFinalSearch.split('\n');
                const addDecorations = [];
                const removeDecorations = [];
                const blocksWithFinalRanges = [];
                let lastFoundEndLine = -1; // 0-based, hint for subsequent searches
                for (const block of finalBlockData) {
                    // Create a slice of the final document to search in, starting from hint
                    // Slice starts AFTER the end of the last block's combined (search+replace) area
                    const sliceStartLine = lastFoundEndLine + 1;
                    const codebaseSliceForSearch = docLinesForFinalSearch.slice(sliceStartLine).join('\n');
                    // Find the SEARCH content in the final document slice
                    const searchResult = (0, stringUtils_1.findCodeSnippetRange)(block.searchContent, codebaseSliceForSearch);
                    if (searchResult.found) {
                        // Adjust found lines by the slice offset to get coordinates in the full document
                        const finalSearchStartLine = searchResult.startLine + sliceStartLine;
                        const finalSearchEndLine = searchResult.endLine + sliceStartLine;
                        // Validate the calculated search range before proceeding
                        if (finalSearchEndLine >= docAfterEdit.lineCount || finalSearchStartLine < 0) {
                            console.warn(`Search range out of bounds for block ${block.id}: startLine=${finalSearchStartLine}, endLine=${finalSearchEndLine}, docLines=${docAfterEdit.lineCount}`);
                            continue; // Skip this block if search range is invalid
                        }
                        // Create the final search range
                        const finalSearchRange = new vscode.Range(new vscode.Position(finalSearchStartLine, 0), new vscode.Position(finalSearchEndLine, docAfterEdit.lineAt(finalSearchEndLine)?.text.length ?? 0));
                        // Assign search range to block and add to remove decorations
                        block.searchRange = finalSearchRange;
                        removeDecorations.push(finalSearchRange);
                        // Now calculate the replace range based on the search range end
                        // and the number of lines in the original replacement content
                        // Calculate replaceLineCount (ensure consistent line endings)
                        const normalizedReplaceContent = block.originalReplaceContent.replace(/\r\n/g, '\n');
                        const replaceLines = normalizedReplaceContent.split('\n');
                        const replaceLineCount = normalizedReplaceContent === '' ?
                            0 :
                            (normalizedReplaceContent.endsWith('\n') ? replaceLines.length - 1 : replaceLines.length);
                        let finalReplaceRange;
                        let finalReplaceEndLine;
                        if (replaceLineCount > 0) {
                            const finalReplaceStartLine = finalSearchEndLine + 1; // Starts immediately after search end
                            finalReplaceEndLine = finalReplaceStartLine + replaceLineCount - 1; // Calculate the end line index
                            // Validate the calculated replace range
                            if (finalReplaceEndLine >= docAfterEdit.lineCount) {
                                console.warn(`Calculated replace range out of bounds for block ${block.id}: endLine=${finalReplaceEndLine}, docLines=${docAfterEdit.lineCount}`);
                                // If replace range is invalid, we might not want to add this block at all,
                                // as the diff view would be incomplete/incorrect.
                                // Let's remove the already added search decoration and skip.
                                removeDecorations.pop(); // Remove the last added search range
                                block.searchRange = undefined; // Clear it from the block
                                continue;
                            }
                            finalReplaceRange = new vscode.Range(new vscode.Position(finalReplaceStartLine, 0), new vscode.Position(finalReplaceEndLine, docAfterEdit.lineAt(finalReplaceEndLine)?.text.length ?? 0));
                        }
                        else {
                            // Handle empty replacement: Zero-length range after search end line
                            const positionAfterSearch = new vscode.Position(finalSearchEndLine + 1, 0);
                            finalReplaceRange = new vscode.Range(positionAfterSearch, positionAfterSearch);
                            finalReplaceEndLine = finalSearchEndLine; // For hint update, the effective end is the search end line
                        }
                        // Assign replace range to block and add to add decorations
                        block.replaceRange = finalReplaceRange;
                        addDecorations.push(finalReplaceRange);
                        // Add block with final ranges calculated to the result array
                        blocksWithFinalRanges.push(block);
                        // Update hint for the *next* search, pointing to the end of the *replace* part
                        lastFoundEndLine = finalReplaceEndLine;
                    }
                    else {
                        // Log if the original search content wasn't found (should ideally not happen if Pass 2/3 worked)
                        console.warn(`Search content not found in final document for block ${block.id}. Content:\n${block.searchContent}`);
                    }
                    // --- END REFACTORED SECTION ---
                }
                // Pass 5: Apply Decorations & CodeLenses
                console.log(`Applying ${addDecorations.length} add decorations and ${removeDecorations.length} remove decorations`);
                // Clear existing decorations
                editor.setDecorations(this.addDecorationType, []);
                editor.setDecorations(this.removeDecorationType, []);
                // Apply new decorations
                editor.setDecorations(this.addDecorationType, addDecorations);
                editor.setDecorations(this.removeDecorationType, removeDecorations);
                this.cachedCurEditorFileUri = editor.document.uri;
                // Dispose old CodeLens provider
                if (this.codeLensProviderDisposable) {
                    this.codeLensProviderDisposable.dispose();
                }
                // Register new CodeLens provider if blocks exist
                if (blocksWithFinalRanges.length > 0) {
                    // Create and register a new CodeLens provider
                    this.codeLensProviderDisposable = vscode.languages.registerCodeLensProvider({ pattern: editor.document.uri.fsPath }, this.createCodeLensProvider(blocksWithFinalRanges, editor));
                    // Corrected Pass 5 - Update pending modifications state section
                    const documentFsPath = editor.document.uri.fsPath; // Use fsPath as the key
                    const existingEntry = this.pendingModifications.get(documentFsPath);
                    if (existingEntry) {
                        // ALWAYS update the blocks array of the existing entry
                        existingEntry.blocks = blocksWithFinalRanges; // blocksWithFinalRanges contains blocks with final calculated ranges
                        // If no blocks remain after processing, remove the entry entirely
                        if (existingEntry.blocks.length === 0) {
                            this.pendingModifications.delete(documentFsPath);
                            console.log(`Removed pending modifications entry for ${documentFsPath} as no blocks remain.`);
                            // Also ensure CodeLens provider is disposed if no blocks remain
                            if (this.codeLensProviderDisposable) {
                                this.codeLensProviderDisposable.dispose();
                                this.codeLensProviderDisposable = undefined;
                            }
                        }
                        else {
                            // Re-set the entry with the updated blocks array (preserves originalContent, isNewFile, questionId)
                            this.pendingModifications.set(documentFsPath, existingEntry);
                            console.log("see reset pending modifications", this.pendingModifications);
                        }
                    }
                    else if (blocksWithFinalRanges.length > 0) {
                        // This branch indicates an issue: updateDecorations was likely called without an initial entry being set.
                        // Log a warning, as we cannot accurately reconstruct the initial state here.
                        console.warn(`[updateDecorations] State anomaly: Attempted to update pending modifications for ${documentFsPath}, but no initial entry was found. Decorations applied, but state might be inconsistent.`);
                        // Avoid creating a new entry here as critical info (originalContent, questionId) is missing.
                    }
                    this.scrollToBlock(editor, blocksWithFinalRanges[0]);
                    if (this.originalBlocksCount !== blocksWithFinalRanges.length) {
                        vscode.window.showWarningMessage(`some diff blocks weren't applied to the file,you can click on the diff icon and manually copy and the changes for those blocks.`);
                    }
                    this.finalBlockCount = blocksWithFinalRanges.length;
                    this.webview?.postMessage({
                        'command': 'SHOW_FILE_MODIFICATION_TOOL_BAR',
                        'value': {
                            'currentIndex': 1,
                            'totalCount': this.finalBlockCount
                        }
                    });
                    // --- End of corrected section ---
                }
                else if (blocksWithFinalRanges.length === 0) {
                    // Clean up if no blocks remain
                    this.codeLensProviderDisposable = undefined;
                    // Remove entry from pending modifications
                    const documentFsPath = editor.document.uri.fsPath;
                    if (this.pendingModifications.has(documentFsPath)) {
                        console.log("show your stupid ass you bug one");
                        this.pendingModifications.delete(documentFsPath);
                    }
                }
            }
        }
        catch (error) {
            (0, sentry_1.captureException)(error);
            console.error("Error updating decorations:", error);
            // Attempt to clear decorations to avoid broken visual state
            try {
                editor.setDecorations(this.addDecorationType, []);
                editor.setDecorations(this.removeDecorationType, []);
            }
            catch (e) {
                console.error("Failed to clear decorations after error:", e);
            }
            // Optionally show user-facing error
            vscode.window.showErrorMessage("An error occurred while processing code changes.");
        }
        finally {
            this.isApplyingEdit = false;
        }
    }
    // Function specifically for refreshing visuals after an edit
    async refreshDecorationsForRemainingBlocks(editor, remainingBlocks) {
        console.log(`Refreshing decorations for ${remainingBlocks.length} remaining blocks.`);
        if (remainingBlocks.length === 0) {
            // Clear decorations and lenses if no blocks are left
            editor.setDecorations(this.addDecorationType, []);
            editor.setDecorations(this.removeDecorationType, []);
            if (this.codeLensProviderDisposable) {
                this.codeLensProviderDisposable.dispose();
                this.codeLensProviderDisposable = undefined;
            }
            this.webview?.postMessage({
                'command': 'HIDE_FILE_MODIFICATION_TOOL_BAR'
            });
            return;
        }
        const docTextForFinalSearch = editor.document.getText();
        const docLinesForFinalSearch = docTextForFinalSearch.split('\n'); // Use split lines for slicing
        const addDecorations = [];
        const removeDecorations = [];
        const blocksFoundSuccessfully = []; // Store blocks we successfully locate and update
        let lastFoundEndLine = -1; // Hint for subsequent searches (0-based line index)
        for (let i = 0; i < remainingBlocks.length; i++) { // Use index for potential removal later
            const block = remainingBlocks[i];
            console.log(`Attempting to re-find block ${block.id} starting search after line ${lastFoundEndLine}`);
            // Search in a slice of the document for efficiency
            const sliceStartLine = Math.max(0, lastFoundEndLine + 1); // Ensure slice start is not negative
            if (sliceStartLine >= docLinesForFinalSearch.length) {
                console.warn(`Block ${block.id}: Search slice start (${sliceStartLine}) is beyond document end (${docLinesForFinalSearch.length}). Cannot find.`);
                continue; // Skip this block
            }
            const codebaseSliceForSearch = docLinesForFinalSearch.slice(sliceStartLine).join('\n');
            // --- Use findCodeSnippetRange to locate the block's SEARCH content ---
            const searchResult = (0, stringUtils_1.findCodeSnippetRange)(block.searchContent, codebaseSliceForSearch); // Use your existing fuzzy search
            if (searchResult.found && searchResult.startLine !== -1 && searchResult.endLine !== -1) {
                // Adjust found lines by the slice offset to get coordinates in the full document
                const finalSearchStartLine = searchResult.startLine + sliceStartLine;
                const finalSearchEndLine = searchResult.endLine + sliceStartLine;
                // --- Validate and Create Search Range ---
                if (finalSearchStartLine < 0 || finalSearchEndLine >= editor.document.lineCount || finalSearchStartLine > finalSearchEndLine) {
                    console.warn(`Block ${block.id}: Re-calculated search range invalid [${finalSearchStartLine}-${finalSearchEndLine}] vs doc lines ${editor.document.lineCount}. Skipping.`);
                    continue;
                }
                const newSearchRange = new vscode.Range(new vscode.Position(finalSearchStartLine, 0), // Assume start of line
                new vscode.Position(finalSearchEndLine, editor.document.lineAt(finalSearchEndLine)?.text.length ?? 0) // End of line
                );
                // --- Calculate and Validate Replace Range ---
                const normalizedReplaceContent = block.originalReplaceContent.replace(/\r\n/g, '\n');
                const replaceLines = normalizedReplaceContent.split('\n');
                // Use the refined line count logic from previous discussions
                let replaceLineCount;
                if (normalizedReplaceContent === '') {
                    replaceLineCount = 0;
                }
                else if (normalizedReplaceContent === '\n') {
                    replaceLineCount = 1;
                }
                else {
                    replaceLineCount = replaceLines.length;
                }
                let newReplaceRange;
                let finalReplaceEndLine;
                if (replaceLineCount > 0) {
                    const finalReplaceStartLine = finalSearchEndLine + 1; // Starts immediately after search end
                    finalReplaceEndLine = finalReplaceStartLine + replaceLineCount - 1;
                    if (finalReplaceStartLine < 0 || finalReplaceEndLine >= editor.document.lineCount) {
                        console.warn(`Block ${block.id}: Re-calculated replace range invalid [${finalReplaceStartLine}-${finalReplaceEndLine}] vs doc lines ${editor.document.lineCount}. Skipping.`);
                        continue;
                    }
                    newReplaceRange = new vscode.Range(new vscode.Position(finalReplaceStartLine, 0), new vscode.Position(finalReplaceEndLine, editor.document.lineAt(finalReplaceEndLine)?.text.length ?? 0));
                }
                else {
                    // Handle empty replacement: Zero-length range after search end line
                    const positionAfterSearch = new vscode.Position(finalSearchEndLine + 1, 0);
                    if (positionAfterSearch.line >= editor.document.lineCount) {
                        // If search ended on the very last line, the position after is invalid
                        console.warn(`Block ${block.id}: Cannot create empty replace range after last line (${finalSearchEndLine}). Skipping.`);
                        continue;
                    }
                    newReplaceRange = new vscode.Range(positionAfterSearch, positionAfterSearch);
                    finalReplaceEndLine = finalSearchEndLine; // Effective end for hint is the search end
                }
                // --- Update Block State and Prepare Decorations ---
                console.log(`Block ${block.id}: Re-found at S:[${newSearchRange.start.line}-${newSearchRange.end.line}], R:[${newReplaceRange.start.line}-${newReplaceRange.end.line}]`);
                block.searchRange = newSearchRange; // Update the block object directly
                block.replaceRange = newReplaceRange; // Update the block object directly
                removeDecorations.push(newSearchRange); // Mark original (search) content for removal style
                addDecorations.push(newReplaceRange); // Mark replacement content for addition style
                blocksFoundSuccessfully.push(block); // Add to list for CodeLens
                // Update hint for the *next* search
                lastFoundEndLine = finalReplaceEndLine;
            }
            else {
                // Could not re-find the block's search content after the edit
                console.warn(`Block ${block.id}: Could not be re-found using findCodeSnippetRange after edit. It might have been modified or removed.`);
                // Optionally remove this block from remainingBlocks if desired
                // remainingBlocks.splice(i, 1);
                // i--; // Adjust index after splice
            }
        } // End loop through remainingBlocks
        // --- Apply Decorations ---
        console.log(`Applying ${addDecorations.length} add and ${removeDecorations.length} remove decorations.`);
        editor.setDecorations(this.addDecorationType, addDecorations);
        editor.setDecorations(this.removeDecorationType, removeDecorations);
        // --- Update CodeLenses ---
        if (this.codeLensProviderDisposable) {
            this.codeLensProviderDisposable.dispose();
            this.codeLensProviderDisposable = undefined; // Important to clear
        }
        if (blocksFoundSuccessfully.length > 0) {
            console.log(`Registering CodeLens provider for ${blocksFoundSuccessfully.length} blocks.`);
            this.codeLensProviderDisposable = vscode.languages.registerCodeLensProvider({ pattern: editor.document.uri.fsPath }, this.createCodeLensProvider(blocksFoundSuccessfully, editor) // Use the blocks we actually found and updated
            );
        }
        else {
            console.log("No blocks remain or found, CodeLens provider not registered.");
        }
        // --- Update Pending Modifications State ---
        // Filter the original list based on successful finds OR update the list in place if using splice above
        const fileFsPath = editor.document.uri.fsPath;
        const modificationData = this.pendingModifications.get(fileFsPath);
        if (modificationData) {
            // If you didn't splice inline, filter now:
            modificationData.blocks = blocksFoundSuccessfully; // Replace list with only successfully found/updated blocks
            if (modificationData.blocks.length === 0) {
                this.pendingModifications.delete(fileFsPath);
                console.log(`Removed pending modifications entry for ${fileFsPath} as no blocks remain after refresh.`);
            }
            else {
                this.pendingModifications.set(fileFsPath, modificationData); // Update map
                this.finalBlockCount = blocksFoundSuccessfully.length;
                this.webview?.postMessage({
                    'command': 'SHOW_FILE_MODIFICATION_TOOL_BAR',
                    'value': {
                        'currentIndex': 1,
                        'totalCount': this.finalBlockCount
                    }
                });
                this.scrollToBlock(editor, blocksFoundSuccessfully[0]);
            }
        }
    }
    // Update the accept/reject command handlers
    registerModificationCommands() {
        // Ensure registration happens only once
        if (ChatGPT4Provider.commandsRegistered) {
            return;
        }
        // --- Accept Command ---
        vscode.commands.registerCommand('sixthAI.acceptModification', async (fileUri, isNewFile, blockId) => {
            console.log(`Accept command triggered for file: ${fileUri.fsPath}, block: ${blockId}`);
            if (!blockId)
                return; // Need a blockId to proceed
            console.log("let me see the stupid pending modifications", this.pendingModifications);
            const modificationData = this.pendingModifications.get(fileUri.fsPath); // Use fsPath as key
            if (!modificationData) {
                console.warn(`[Accept] Modification data not found for ${fileUri.fsPath}`);
                return;
            }
            const editor = vscode.window.visibleTextEditors.find(e => e.document.uri.fsPath === fileUri.fsPath);
            if (!editor) {
                console.warn(`[Accept] Editor not found for ${fileUri.fsPath}`);
                return;
            }
            const blockIndex = modificationData.blocks.findIndex(b => b.id === blockId);
            if (blockIndex === -1) {
                console.warn(`[Accept] Block ID ${blockId} not found in pending modifications.`);
                return;
            }
            const blockToAccept = modificationData.blocks[blockIndex];
            if (!blockToAccept.searchRange || !blockToAccept.replaceRange) {
                console.error(`[Accept] Block ID ${blockId} is missing calculated ranges. Cannot apply edit.`);
                vscode.window.showErrorMessage(`Cannot accept change: block state is inconsistent. Please try applying modifications again.`);
                return;
            }
            try {
                this.isApplyingEdit = true; // Prevent interference
                const finalContent = blockToAccept.originalReplaceContent;
                const combinedRange = new vscode.Range(blockToAccept.searchRange.start, blockToAccept.replaceRange.end);
                // 1. Get the text BEFORE the start of the block
                const prefixRange = new vscode.Range(new vscode.Position(0, 0), blockToAccept.searchRange.start);
                const prefixText = editor.document.getText(prefixRange);
                // 2. Construct the new text for the entire section being replaced
                //    (Prefix + Accepted Content)
                const newSectionText = prefixText + finalContent;
                // 3. Define the large range for the replacement operation
                //    (From document start to the end of the diff block)
                const largeEditRange = new vscode.Range(new vscode.Position(0, 0), combinedRange.end);
                // 4. Perform the single large edit
                const success = await editor.edit(editBuilder => {
                    editBuilder.replace(largeEditRange, newSectionText);
                }, { undoStopBefore: false, undoStopAfter: false }); // Consider undo stops carefully
                if (!success) {
                    throw new Error("Editor edit operation failed for accept.");
                }
                modificationData.blocks.splice(blockIndex, 1); // Remove block in place
                if (modificationData.blocks.length === 0) {
                    console.log("show your stupid ass you bug two");
                    this.pendingModifications.delete(fileUri.fsPath);
                    if (this.codeLensProviderDisposable) {
                        this.codeLensProviderDisposable.dispose();
                        this.codeLensProviderDisposable = undefined;
                    }
                }
                else {
                    this.pendingModifications.set(fileUri.fsPath, modificationData); // Update map entry
                }
                await this.refreshDecorationsForRemainingBlocks(editor, modificationData.blocks);
                vscode.window.showInformationMessage(`Accepted changes.`);
            }
            catch (error) {
                (0, sentry_1.captureException)(error);
                console.error("[Accept] Error:", error);
                vscode.window.showErrorMessage(`Failed to accept modification: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            finally {
                this.isApplyingEdit = false;
            }
        });
        // --- Reject Command ---
        vscode.commands.registerCommand('sixthAI.rejectModification', async (fileUri, isNewFile, blockId) => {
            console.log(`Reject command triggered for file: ${fileUri.fsPath}, block: ${blockId}`);
            if (!blockId)
                return;
            console.log("let me see the stupid pending modifications", this.pendingModifications);
            const modificationData = this.pendingModifications.get(fileUri.fsPath); // Use fsPath key
            if (!modificationData) {
                console.warn(`[Reject] Modification data not found for ${fileUri.fsPath}`);
                return;
            }
            const editor = vscode.window.visibleTextEditors.find(e => e.document.uri.fsPath === fileUri.fsPath);
            if (!editor) {
                console.warn(`[Reject] Editor not found for ${fileUri.fsPath}`);
                return;
            }
            const blockIndex = modificationData.blocks.findIndex(b => b.id === blockId);
            if (blockIndex === -1) {
                console.warn(`[Reject] Block ID ${blockId} not found.`);
                return;
            }
            const blockToReject = modificationData.blocks[blockIndex];
            if (!blockToReject.searchRange || !blockToReject.replaceRange) {
                console.error(`[Reject] Block ID ${blockId} is missing calculated ranges.`);
                vscode.window.showErrorMessage(`Cannot reject change: block state is inconsistent.`);
                return;
            }
            try {
                this.isApplyingEdit = true;
                const originalContent = blockToReject.searchContent;
                const combinedRange = new vscode.Range(blockToReject.searchRange.start, blockToReject.replaceRange.end);
                // 1. Get the text BEFORE the start of the block
                const prefixRange = new vscode.Range(new vscode.Position(0, 0), blockToReject.searchRange.start);
                const prefixText = editor.document.getText(prefixRange);
                // 2. Construct the new text for the entire section being replaced
                //    (Prefix + Original Content)
                const newSectionText = prefixText + originalContent;
                // 3. Define the large range for the replacement operation
                //    (From document start to the end of the diff block)
                const largeEditRange = new vscode.Range(new vscode.Position(0, 0), combinedRange.end);
                // 4. Perform the single large edit
                const success = await editor.edit(editBuilder => {
                    editBuilder.replace(largeEditRange, newSectionText);
                }, { undoStopBefore: false, undoStopAfter: false }); // Consider undo stops carefully
                if (!success) {
                    throw new Error("Editor edit operation failed for reject.");
                }
                modificationData.blocks.splice(blockIndex, 1); // Remove block in place
                if (modificationData.blocks.length === 0) {
                    console.log("show your stupid ass you bug three");
                    this.pendingModifications.delete(fileUri.fsPath);
                    if (this.codeLensProviderDisposable) {
                        this.codeLensProviderDisposable.dispose();
                        this.codeLensProviderDisposable = undefined;
                    }
                }
                else {
                    this.pendingModifications.set(fileUri.fsPath, modificationData); // Update map entry
                }
                await this.refreshDecorationsForRemainingBlocks(editor, modificationData.blocks);
                vscode.window.showInformationMessage(`Rejected changes.`);
            }
            catch (error) {
                (0, sentry_1.captureException)(error);
                console.error("[Reject] Error:", error);
                vscode.window.showErrorMessage(`Failed to reject modification: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            finally {
                this.isApplyingEdit = false;
            }
        });
        ChatGPT4Provider.commandsRegistered = true;
    }
    // Inside your ChatGPT4Provider class
    /**
     * Applies or rejects all pending modifications currently displayed in the diff view for a file.
     * Calculates the final document state based on the chosen action
     * and applies a single edit operation. Operates on the ranges present IN THE DIFF VIEW.
     *
     * @param {'accept' | 'reject'} action Whether to accept or reject all blocks.
     * @param {vscode.Uri} fileUri The URI of the file to process.
     */
    async applyAllModifications(action, fileUri) {
        const actionVerb = action === 'accept' ? 'Accepting' : 'Rejecting';
        console.log(`${actionVerb} all modifications for file: ${fileUri.fsPath}`);
        // 1. Guards and Setup
        if (this.isApplyingEdit) {
            console.warn("applyAllModifications called while already applying an edit. Skipping.");
            vscode.window.showWarningMessage("Please wait for the previous action to complete.");
            return;
        }
        const modificationData = this.pendingModifications.get(fileUri.fsPath);
        if (!modificationData || modificationData.blocks.length === 0) {
            console.log(`No pending modifications found for ${fileUri.fsPath}. Nothing to do.`);
            vscode.window.showInformationMessage("No pending changes to apply.");
            this.clearModificationState(fileUri.fsPath);
            return;
        }
        const editor = vscode.window.visibleTextEditors.find(e => e.document.uri.fsPath === fileUri.fsPath);
        if (!editor) {
            console.warn(`[${actionVerb} All] Editor not found for ${fileUri.fsPath}. Cannot apply changes.`);
            vscode.window.showErrorMessage("Could not find the editor for the file. Please ensure it's open and visible.");
            return;
        }
        // *** CRUCIAL CORRECTED CHECK ***: Ensure searchRange and replaceRange exist.
        // These are calculated by updateDecorations/refreshDecorations and represent locations in the diff view.
        if (modificationData.blocks.some(b => !b.searchRange || !b.replaceRange)) {
            console.error(`[${actionVerb} All] Some blocks are missing 'searchRange' or 'replaceRange'. Cannot reliably process 'All'. State might be corrupted from diff generation.`);
            vscode.window.showErrorMessage("Cannot apply all changes: internal state is inconsistent. Please try reapplying the diff view.");
            return;
        }
        try {
            this.isApplyingEdit = true;
            const currentDiffViewText = editor.document.getText(); // Text we are transforming
            // Use a typed array now that we've checked the ranges exist
            const blocks = [...modificationData.blocks];
            // 2. Prepare Blocks (Sort by CURRENT start position in the diff view)
            blocks.sort((a, b) => {
                // Sort based on the start of the 'remove' decoration range
                if (a.searchRange.start.line !== b.searchRange.start.line) {
                    return a.searchRange.start.line - b.searchRange.start.line;
                }
                return a.searchRange.start.character - b.searchRange.start.character;
            });
            // 3. Construct Final Document Text (from the Diff View)
            let finalDocumentParts = [];
            // Track the end of the *last processed block's combined range* in the CURRENT diff view document
            let lastProcessedEndPosition = new vscode.Position(0, 0);
            for (const block of blocks) {
                // Get the text segment *before* the current block's searchRange starts,
                // relative to the end of the last processed block's combined range.
                const rangeBefore = new vscode.Range(lastProcessedEndPosition, block.searchRange.start);
                const textBefore = editor.document.getText(rangeBefore); // Read from the current diff view
                finalDocumentParts.push(textBefore);
                // Determine the content to keep for this block
                const contentToKeep = action === 'accept' ? block.originalReplaceContent : block.searchContent;
                // Note: We are pushing the *original* content here, not reading from the diff view ranges
                finalDocumentParts.push(contentToKeep);
                // Update the pointer to the end of this block's *replaceRange*
                // This marks the end point in the diff view that this block occupied.
                lastProcessedEndPosition = block.replaceRange.end;
            }
            // Append the remaining text *after* the last block's replaceRange ended
            const rangeAfterLast = new vscode.Range(lastProcessedEndPosition, editor.document.lineAt(editor.document.lineCount - 1).range.end);
            const textAfterLast = editor.document.getText(rangeAfterLast);
            finalDocumentParts.push(textAfterLast);
            const finalDocumentText = finalDocumentParts.join('');
            // 4. Apply Single Edit (if changed)
            // We generally assume 'Apply All' will change the text from the diff view state
            if (finalDocumentText !== currentDiffViewText) {
                console.log(`Applying ${action} all edit to ${fileUri.fsPath}`);
                const entireDocumentRange = new vscode.Range(new vscode.Position(0, 0), editor.document.lineAt(editor.document.lineCount - 1).range.end);
                const success = await editor.edit(editBuilder => {
                    editBuilder.replace(entireDocumentRange, finalDocumentText);
                }, { undoStopBefore: true, undoStopAfter: true });
                if (!success) {
                    throw new Error(`Editor edit operation failed for ${action} all.`);
                }
            }
            else {
                console.log(`No effective changes resulted from ${action} all.`);
                // Still proceed to cleanup state even if text is identical
            }
            // 5. Cleanup State
            this.clearModificationState(fileUri.fsPath, editor); // Use the existing helper
            vscode.window.showInformationMessage(`Successfully applied '${action} all' modifications.`);
        }
        catch (error) {
            (0, sentry_1.captureException)(error);
            console.error(`[${actionVerb} All] Error:`, error);
            vscode.window.showErrorMessage(`Failed to ${action} all modifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
            // Don't clear state on error
        }
        finally {
            this.isApplyingEdit = false;
        }
    }
    // The clearModificationState helper function remains the same.
    // The registerApplyAllCommands helper function remains the same.
    /**
     * Helper function to clear decorations, CodeLenses, and pending modifications state.
     * @param fileFsPath The file system path string for the map key.
     * @param editor Optional TextEditor to clear decorations from. If not provided, only map state is cleared.
     */
    clearModificationState(fileFsPath, editor) {
        console.log(`Clearing modification state for ${fileFsPath}`);
        // Clear decorations
        if (editor) {
            try {
                editor.setDecorations(this.addDecorationType, []);
                editor.setDecorations(this.removeDecorationType, []);
            }
            catch (e) {
                console.error("Failed to clear decorations during cleanup:", e);
            }
        }
        else {
            // Attempt to find editor if not provided, but don't fail if not found
            const foundEditor = vscode.window.visibleTextEditors.find(e => e.document.uri.fsPath === fileFsPath);
            if (foundEditor) {
                try {
                    foundEditor.setDecorations(this.addDecorationType, []);
                    foundEditor.setDecorations(this.removeDecorationType, []);
                }
                catch (e) {
                    console.error("Failed to clear decorations during cleanup (editor found later):", e);
                }
            }
        }
        // Dispose CodeLens provider
        if (this.codeLensProviderDisposable) {
            // Check if the disposable is for the specific file?
            // If the provider registration is global or shared, be careful.
            // Assuming it's specific to the last file processed or needs disposal anyway:
            try {
                this.codeLensProviderDisposable.dispose();
                this.codeLensProviderDisposable = undefined;
            }
            catch (e) {
                console.error("Failed to dispose CodeLens provider during cleanup:", e);
            }
        }
        // Remove entry from pending modifications map
        this.pendingModifications.delete(fileFsPath);
        console.log("which one 1");
        this.webview?.postMessage({
            'command': 'HIDE_FILE_MODIFICATION_TOOL_BAR'
        });
    }
    setUpDecorationListener() {
        // DISABLED: Original functionality removed to prevent infinite update loops
        // Original code kept for reference
        /*
        vscode.workspace.onDidChangeTextDocument(event => {
            if (this.isApplyingEdit) {
                return;
            }
            const {addDecorations, removeDecorations} = this.reCalculateDecorations(vscode.window.visibleTextEditors.find(e => e.document.uri.fsPath === this.currentWorkingFile)!, this.pendingModifications.get(this.currentWorkingFile)!.blocks);
            const editor = vscode.window.visibleTextEditors.find(e => e.document.uri.fsPath === this.currentWorkingFile)!;
            editor.setDecorations(this.addDecorationType, []);
            editor.setDecorations(this.removeDecorationType, []);
            editor.setDecorations(this.addDecorationType, addDecorations);
            editor.setDecorations(this.removeDecorationType, removeDecorations);
            this.updateCodeLensForRemainingBlocks(editor, this.pendingModifications.get(this.currentWorkingFile)!.blocks, "");
        });
        */
        // Temporarily disabled to prevent infinite loop issues
        console.log("Decoration listener disabled to prevent infinite update loops");
    }
    countLines(text) {
        // Handle empty or null string
        if (!text) {
            return 0;
        }
        // Count newlines and add 1 for the last line
        // This handles both \n and \r\n line endings
        return text.split('\n').length;
    }
    extractCommand(text) {
        // Remove code block markers
        text = text.replace(/```(?:bash|shell|\w+)?\n?/g, '').replace(/```/g, '');
        // Split into lines and filter out comments and empty lines
        const commands = text.split('\n')
            .map(line => line.trim())
            .filter(line => line &&
            !line.startsWith('#') &&
            !line.startsWith('//') &&
            !line.startsWith('$'));
        // Join all commands with && to chain them
        return commands.join(' && ');
    }
    async executeCommand(command) {
        try {
            const actualCommand = this.extractCommand(command);
            if (!actualCommand) {
                vscode.window.showErrorMessage('No valid command found');
                return;
            }
            const terminal = vscode.window.createTerminal('Sixth AI');
            terminal.show();
            terminal.sendText(actualCommand);
        }
        catch (error) {
            (0, sentry_1.captureException)(error);
            vscode.window.showErrorMessage(`Failed to execute command: ${error}`);
        }
    }
    async findFunctionLocation(filePath, functionName) {
        try {
            const document = await vscode.workspace.openTextDocument(filePath);
            const text = document.getText();
            // Simple regex to find function definitions
            const functionRegex = new RegExp(`(function|def|async function)\\s+${functionName}\\s*\\(`);
            const match = functionRegex.exec(text);
            if (match) {
                const position = document.positionAt(match.index);
                return new vscode.Location(vscode.Uri.file(filePath), position);
            }
        }
        catch (error) {
            (0, sentry_1.captureException)(error);
            vscode.window.showErrorMessage(`Failed to find function: ${error}`);
        }
        return undefined;
    }
    async findClassLocation(filePath, className) {
        try {
            const document = await vscode.workspace.openTextDocument(filePath);
            const text = document.getText();
            // Simple regex to find class definitions
            const classRegex = new RegExp(`class\\s+${className}\\s*[:{]`);
            const match = classRegex.exec(text);
            if (match) {
                const position = document.positionAt(match.index);
                return new vscode.Location(vscode.Uri.file(filePath), position);
            }
        }
        catch (error) {
            (0, sentry_1.captureException)(error);
            vscode.window.showErrorMessage(`Failed to find class: ${error}`);
        }
        return undefined;
    }
    async openLocation(location) {
        try {
            const document = await vscode.workspace.openTextDocument(location.uri);
            const editor = await vscode.window.showTextDocument(document);
            editor.revealRange(new vscode.Range(location.range.start, location.range.end), vscode.TextEditorRevealType.InCenter);
            editor.selection = new vscode.Selection(location.range.start, location.range.end);
        }
        catch (error) {
            (0, sentry_1.captureException)(error);
            vscode.window.showErrorMessage(`Failed to open location: ${error}`);
        }
    }
    async loadChat(chatId) {
        try {
            const chatThreads = await this.chatHistory.getChatThread(chatId);
            if (chatThreads && this.webview) {
                this.chatId = chatId;
                this.threadId = null;
                const themeColors = (0, colors_1.getThemeColors)();
                var html = fs.readFileSync(__dirname + "/chat.html", 'utf-8');
                html = (0, treeNode_1.fillTemplate)(html, JSON.stringify("standard"), "REPLACE_THIS");
                html = (0, treeNode_1.fillTemplate)(html, JSON.stringify("no"), "LOAD_THREAD");
                html = (0, treeNode_1.fillTemplate)(html, (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, "A")[0].toUpperCase(), "FIRST_LETTER");
                html = (0, treeNode_1.fillTemplate)(html, JSON.stringify(themeColors), "THEME_COLORS");
                this.webview.html = html;
                try {
                    this.threadId = chatThreads.messages.filter((msg) => msg.role === "assistant")[0].thread_id;
                }
                catch (error) {
                    console.log("Could not find thread id in chat history", error);
                    this.threadId = null;
                }
                // Restore event listeners and state
                this.setupFileListeners();
                this.initSocketConnection(this.subcriber);
                this.webview.postMessage({
                    command: "preload_histories",
                    value: chatThreads.messages
                });
            }
            else {
                vscode.window.showErrorMessage("Error retrieving chat from history");
            }
        }
        catch (error) {
            (0, sentry_1.captureException)(error);
        }
    }
    async showChatHistory() {
        const chatHistory = await this.chatHistory.getChatHistory();
        if (this.webview) {
            const themeColors = (0, colors_1.getThemeColors)();
            let html = (0, chatHistoryView_1.generateChatHistoryHtml)(chatHistory);
            html = (0, treeNode_1.fillTemplate)(html, JSON.stringify(themeColors), "THEME_COLORS_JSON");
            this.webview.html = html;
        }
    }
    setupHistoryListeners() {
        if (!this.webview)
            return;
        this.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'load_chat':
                    await this.loadChat(message.value);
                    break;
                case 'close_history':
                    // Return to chat view
                    this.provideChat();
                    break;
                case 'filter_chats':
                    const filteredChats = await this.chatHistory.searchChats(message.value);
                    var html = (0, chatHistoryView_1.generateChatHistoryHtml)(filteredChats);
                    const themeColors = (0, colors_1.getThemeColors)();
                    html = (0, treeNode_1.fillTemplate)(html, JSON.stringify(themeColors), "THEME_COLORS_JSON");
                    this.webview.html = html;
                    break;
            }
        });
    }
    // Add this method to the ChatGPT4Provider class
    extractReplaceBlocks(content) {
        const blocks = this.parseSearchReplaceBlocks(content);
        if (blocks.length === 0) {
            // If no blocks found, return the entire content
            return content;
        }
        // Concatenate all replace blocks
        return blocks.map(block => block.originalReplace).join('\n\n');
    }
    // Add this helper method to the class
    scrollToBlock(editor, block) {
        if (!block.searchRange) {
            console.warn(`Cannot scroll to block ${block.id}: searchRange is undefined`);
            return;
        }
        const range = new vscode.Range(block.searchRange.start, block.searchRange.end);
        editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
        editor.selection = new vscode.Selection(range.start, range.start);
    }
    // Add method to revert changes
    async revertChanges(questionId) {
        try {
            // Get all checkpoints for this thread
            const checkpoints = Array.from(this.checkpointManager['checkpoints'].values())
                .filter(checkpoint => checkpoint.question_id === questionId);
            if (checkpoints.length === 0) {
                vscode.window.showInformationMessage('No changes to revert.');
                return;
            }
            const choice = await vscode.window.showInformationMessage(`Are you sure you want to revert all changes for this thread?`, { modal: true }, 'Continue', 'Cancel');
            if (choice !== 'Continue') {
                return;
            }
            // Apply each checkpoint in reverse order
            for (const checkpoint of checkpoints.reverse()) {
                await this.checkpointManager.applyCheckpoint(checkpoint.id, checkpoint.thread_id);
            }
            vscode.window.showInformationMessage('Successfully reverted all changes.');
        }
        catch (error) {
            (0, sentry_1.captureException)(error);
            vscode.window.showErrorMessage(`Failed to revert changes: ${error}`);
        }
    }
    // Helper method to calculate offset
    getOffsetFromPosition(lines, position) {
        let offset = 0;
        for (let i = 0; i < position.line; i++) {
            offset += lines[i].length + 1; // +1 for newline
        }
        return offset + position.character;
    }
    // Add this method to the class
    createCodeLensProvider(blocks, editor) {
        return {
            provideCodeLenses: () => {
                const lenses = [];
                if (blocks.length > 0) {
                    blocks.forEach(block => {
                        if (!block.accepted && block.searchRange) {
                            const codeLensRange = new vscode.Range(block.searchRange.start, block.searchRange.start);
                            lenses.push(new ModificationCodeLens(codeLensRange, 'accept', editor.document.uri, false, block.id), new ModificationCodeLens(codeLensRange, 'reject', editor.document.uri, false, block.id));
                        }
                    });
                    return lenses;
                }
                else {
                    return [];
                }
            },
            resolveCodeLens: (codeLens) => {
                if (codeLens.action === 'accept') {
                    codeLens.command = {
                        title: '✓ Accept Change',
                        command: 'sixthAI.acceptModification',
                        arguments: [codeLens.fileUri, codeLens.isNewFile, codeLens.blockId]
                    };
                }
                else {
                    codeLens.command = {
                        title: '✗ Reject Change',
                        command: 'sixthAI.rejectModification',
                        arguments: [codeLens.fileUri, codeLens.isNewFile, codeLens.blockId]
                    };
                }
                return codeLens;
            }
        };
    }
    // This method is now simplified since updateDecorations handles CodeLens
    async updateCodeLensForRemainingBlocks(editor, blocks, removedBlockId) {
        // DISABLED: Original functionality removed to prevent infinite update loops
        // Original code kept for reference
        /*
        // Simply forward to updateDecorations which now handles both decorations and CodeLens
        await this.updateDecorations(editor, blocks, true);
        */
        // Temporarily disabled to prevent infinite loop issues
        console.log("CodeLens update disabled to prevent infinite update loops");
    }
    // Add to the class properties
    async openImagePicker() {
        try {
            const options = {
                canSelectMany: false,
                filters: {
                    'Images': ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']
                },
                title: 'Select Image'
            };
            const result = await vscode.window.showOpenDialog(options);
            return result || [];
        }
        catch (error) {
            (0, sentry_1.captureException)(error);
            return [];
        }
    }
    extractFileName(filePath) {
        var result = filePath.split(/[\\/]/).pop() || filePath;
        console.log("Payload issssss ", result);
        return result;
    }
    async handleMessage(message) {
        const transaction = Sentry.startTransaction({
            name: 'chat-message',
            op: 'handleMessage'
        });
        try {
            // ... existing message handling code ...
        }
        catch (error) {
            (0, sentry_1.captureException)(error, {
                messageType: message.type,
                messageData: JSON.stringify(message)
            });
            throw error;
        }
        finally {
            transaction.finish();
        }
    }
}
exports.ChatGPT4Provider = ChatGPT4Provider;
ChatGPT4Provider.commandsRegistered = false;
//# sourceMappingURL=chatGpt4Provider.js.map