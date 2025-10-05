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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyInlineCompletionProvider = void 0;
exports.inline_accepted = inline_accepted;
exports.inline_rejected = inline_rejected;
exports.on_cursor_moved = on_cursor_moved;
exports.on_text_edited = on_text_edited;
exports.on_esc_pressed = on_esc_pressed;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = __importStar(require("vscode"));
const estate = __importStar(require("./estate"));
const fetchAPI = __importStar(require("./fetchAPI"));
const extension_1 = require("../extension");
const fs = __importStar(require("fs"));
const authPanel_1 = require("../auth/authPanel");
const network_1 = require("../utils/network");
const projectUtils_1 = require("../utils/projectUtils");
const axiosInstance_1 = require("../utils/axiosInstance");
var api = (0, axiosInstance_1.createAutoCompleteAxiosInstance)();
function removeOverlappingPrefix(currentText, prediction) {
    // Handle edge cases
    if (!currentText)
        return prediction;
    if (!prediction)
        return "";
    // Quick check: If prediction is exactly the same as current text, return empty
    if (currentText === prediction)
        return "";
    // Quick check: If prediction is completely contained in current text, return empty
    if (currentText.includes(prediction))
        return "";
    // Quick check: If current text ends with prediction, return empty
    if (currentText.endsWith(prediction))
        return "";
    // Quick check: If no overlap at all
    if (!prediction.startsWith(currentText.charAt(currentText.length - 1))) {
        return prediction;
    }
    // Limit the search to the minimum length of the two strings
    const maxPossibleOverlap = Math.min(currentText.length, prediction.length);
    // Start from the maximum possible overlap and work backwards
    // This is more efficient for typical code completion scenarios where
    // the overlap is often large
    for (let overlapSize = maxPossibleOverlap; overlapSize > 0; overlapSize--) {
        const endOfCurrent = currentText.slice(-overlapSize);
        const startOfPrediction = prediction.slice(0, overlapSize);
        if (endOfCurrent === startOfPrediction) {
            return prediction.slice(overlapSize);
        }
    }
    // No overlap found
    return prediction;
}
class MyInlineCompletionProvider {
    constructor() {
        this.prevCompletion = "";
        this.fullCompletion = "";
        this.this_completion_serial_number = 6000;
        this.called_manually_count = 0;
        this.currentRequest = false; // Track the current request
        this.action = "";
        this.paywallShown = false;
    }
    async provideInlineCompletionItems(document, position, context, cancelToken) {
        if (document.uri.scheme === "comment") {
            return [];
        }
        let state = estate.state_of_document(document);
        if (state) {
            if (state.get_mode() !== estate.Mode.Normal && state.get_mode() !== estate.Mode.Highlight) {
                return [];
            }
        }
        let file_name = document.fileName; // to test canonical path in rust add .toUpperCase();
        let current_line = document.lineAt(position.line);
        let left_of_cursor = current_line.text.substring(0, position.character);
        let right_of_cursor = current_line.text.substring(position.character);
        console.log("FUll completion is ", this.fullCompletion);
        if (this.fullCompletion.startsWith(left_of_cursor)) {
            let multiline = left_of_cursor.replace(/\s/g, "").length === 0;
            let replace_range0 = new vscode.Position(position.line, position.character);
            let replace_range1 = new vscode.Position(position.line, current_line.text.length);
            if (multiline) {
                replace_range0 = new vscode.Position(position.line + 1, position.character);
            }
            let command = {
                command: "sixth.inlineAccepted",
                title: "inlineAccepted",
                arguments: [this.this_completion_serial_number],
            };
            current_line = document.lineAt(position.line);
            var actualCompletion = removeOverlappingPrefix(current_line.text, this.prevCompletion);
            let completionItem = new vscode.InlineCompletionItem(actualCompletion, new vscode.Range(replace_range0, replace_range1), command);
            this.prevCompletion = actualCompletion;
            return [completionItem];
        }
        let multiline = left_of_cursor.replace(/\s/g, "").length === 0;
        let whole_doc = document.getText();
        if (whole_doc.length > 180 * 1024) { // Too big (180k is ~0.2% of all files on our dataset) everything becomes heavy: network traffic, cache, cpu
            return [];
        }
        // let debounce_if_not_cached = context.triggerKind === vscode.InlineCompletionTriggerKind.Automatic;
        let called_manually = context.triggerKind === vscode.InlineCompletionTriggerKind.Invoke;
        let completion = "";
        let corrected_cursor_character = 0;
        let reason = "";
        let action = "";
        if (!multiline) {
            // VS Code uses UCS-2 or some older encoding internally, so emojis, Chinese characters, are more than one char
            // according to string.length
            let replace_emoji_with_one_char = left_of_cursor.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, " ");
            corrected_cursor_character = position.character;
            corrected_cursor_character -= left_of_cursor.length - replace_emoji_with_one_char.length;
        }
        [completion, this.this_completion_serial_number, reason, action] = await this.cached_request(cancelToken, file_name, whole_doc, position.line, corrected_cursor_character, multiline, called_manually);
        this.action = action;
        if (this.action == "UPGRADE" && this.paywallShown) {
            return [];
        }
        if (reason === "blocking") {
            let multiline = left_of_cursor.replace(/\s/g, "").length === 0;
            let replace_range0 = new vscode.Position(position.line, position.character);
            let replace_range1 = new vscode.Position(position.line, current_line.text.length);
            if (multiline) {
                replace_range0 = new vscode.Position(position.line + 1, position.character);
            }
            let command = {
                command: "sixth.inlineAccepted",
                title: "inlineAccepted",
                arguments: [this.this_completion_serial_number],
            };
            current_line = document.lineAt(position.line);
            var actualCompletion = removeOverlappingPrefix(current_line.text, this.prevCompletion);
            let completionItem = new vscode.InlineCompletionItem(actualCompletion, new vscode.Range(replace_range0, replace_range1), command);
            this.prevCompletion = actualCompletion;
            return [completionItem];
        }
        let replace_range0 = new vscode.Position(position.line, position.character);
        let replace_range1 = new vscode.Position(position.line, current_line.text.length);
        if (multiline) {
            replace_range0 = new vscode.Position(position.line, position.character);
        }
        let command = {
            command: "sixth.inlineAccepted",
            title: "inlineAccepted",
            arguments: [this.this_completion_serial_number],
        };
        current_line = document.lineAt(position.line);
        var actualCompletion = removeOverlappingPrefix(current_line.text, completion);
        let completionItem = new vscode.InlineCompletionItem(actualCompletion, new vscode.Range(replace_range0, replace_range1), command);
        this.prevCompletion = actualCompletion;
        this.fullCompletion = left_of_cursor + actualCompletion + right_of_cursor;
        return [completionItem];
    }
    async cached_request(cancelToken, file_name, whole_doc, cursor_line, cursor_character, multiline, called_manually) {
        if (cancelToken.isCancellationRequested) {
            return ["", -1, "cancellation", "NORMAL"];
        }
        // Check if a request is already in progress
        if (this.currentRequest) {
            return ["", -1, "blocking", "NORMAL"]; // Discard the new request immediately
        }
        // Store the new request
        let max_tokens_ = 8192;
        let max_tokens;
        if (!max_tokens_ || typeof max_tokens_ !== "number") {
            max_tokens = 8192;
        }
        else {
            max_tokens = max_tokens_;
        }
        let sources = {};
        sources[file_name] = whole_doc;
        let no_cache = called_manually;
        if (called_manually) {
            this.called_manually_count++;
        }
        else {
            this.called_manually_count = 0;
        }
        let temperature = 0.2;
        if (this.called_manually_count > 1) {
            temperature = 0.6;
        }
        let model_name = vscode.workspace.getConfiguration().get("sixth.codeCompletionModel") || "";
        let client_version = "vscode-1.0.0";
        var json = {
            "model": model_name,
            "inputs": {
                "sources": sources,
                "cursor": {
                    "file": file_name,
                    "line": cursor_line,
                    "character": cursor_character,
                },
                "multiline": multiline,
            },
            "parameters": {
                "temperature": temperature,
                "max_new_tokens": 50,
            },
            "no_cache": no_cache,
            "use_ast": "true",
            "client": `vscode-${client_version}`,
        };
        var result = await fetchAPI.getAutocomplete(json);
        return result;
    }
}
exports.MyInlineCompletionProvider = MyInlineCompletionProvider;
async function inline_accepted(serial_number) {
    if (global.completionProvider.action === "UPGRADE") {
        createPaywallScreen();
        global.completionProvider.paywallShown = true;
    }
    api.post("/notiy_me_of_auto_complete_usage", {
        "user_id": (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, ""),
        "email": (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, ""),
        "subscriber": (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.ADDED_BILLING, "")
    }).then((response) => {
    });
    global.completionProvider.fullCompletion = "";
    global.completionProvider.prevCompletion = "";
}
function createPaywallScreen() {
    const panel = vscode.window.createWebviewPanel('centeredInput', 'One time user Registeration', vscode.ViewColumn.Active, // Show in the active editor column
    {
        enableScripts: true,
    });
    panel.webview.html = fs.readFileSync(__dirname + "/paywall.html", 'utf-8');
    panel.webview.onDidReceiveMessage(async (message) => {
        if (message.command === "redirect_to_payment") {
            vscode.window.showInformationMessage("Loading payment details, please wait...");
            (0, authPanel_1.createPaymentCheckout)(message.value, () => {
                if (panel.webview) {
                    panel.webview.postMessage({
                        command: "onDone",
                        value: "onDone"
                    });
                }
                ;
            });
        }
        if (message.command === "redirect_link") {
            vscode.env.openExternal(vscode.Uri.parse(authPanel_1.generalCheckoutUrl));
        }
        if (message.command === "check_sub_info") {
            vscode.window.showInformationMessage("Checking subscription info, please wait...");
            (0, network_1.getUserSubscriberInfo)((info) => {
                (0, projectUtils_1.saveDataToCache)((0, extension_1.getExtensionContext)(), projectUtils_1.ADDED_BILLING, info);
                if (info) {
                    if (panel.webview)
                        panel.webview.html = fs.readFileSync(__dirname + "/mainMenu.html", 'utf-8');
                    vscode.window.showInformationMessage("Welcome to Sixth!! Sorry for hold up, you can now access all the features of Sixth!");
                }
                else {
                    vscode.window.showInformationMessage("Sorry 🥲, Could not find any subscription info linked to your account", {
                        modal: true
                    });
                }
            });
        }
    });
}
function inline_rejected(reason) {
    global.completionProvider.fullCompletion = "";
    global.completionProvider.prevCompletion = "";
}
function on_cursor_moved() {
    setTimeout(() => {
        inline_rejected("moveaway");
    }, 50);
}
function on_text_edited() {
    setTimeout(() => {
        inline_rejected("moveaway");
    }, 50);
}
function on_esc_pressed() {
    inline_rejected("esc");
}
//# sourceMappingURL=completionProvider.js.map