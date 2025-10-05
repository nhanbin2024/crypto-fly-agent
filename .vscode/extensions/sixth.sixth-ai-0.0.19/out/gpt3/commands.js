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
exports.RUN_CODE = exports.GENERATE_DOC_STRING = exports.GENERATE_UNIT_TEST = exports.OPTIMIZE_CODE = exports.EXPLAIN_CODE = exports.DETECT_VULNERABILITY_V2 = exports.UPDATE_SIDEBAR_DIAGNOSTICS = void 0;
exports.logCodeLensUsage = logCodeLensUsage;
exports.registerGPTCommandInContext = registerGPTCommandInContext;
const vscode = __importStar(require("vscode"));
const stringUtils_1 = require("../utils/stringUtils");
const socketListener_1 = require("./socketListener");
const projectUtils_1 = require("../utils/projectUtils");
const extension_1 = require("../extension");
const extension_2 = require("../extension");
const sidebarUtils_1 = require("../utils/sidebarUtils");
const feedbackPanel_1 = require("../analytics/feedbackPanel");
const genUtils_1 = require("../utils/genUtils");
const authPanel_1 = require("../auth/authPanel");
const chatGpt4Provider_1 = require("../chatGPT4/chatGpt4Provider");
const mainMenuProvider_1 = require("../mainMenu/mainMenuProvider");
const codeLens_1 = require("./codeLens");
const sentry_1 = require("../utils/sentry");
const axiosInstance_1 = require("../utils/axiosInstance");
const UPDATE_PREV_DIAGNOSTICS = "UPDATE_PREV_DIAGNOSTICS";
exports.UPDATE_SIDEBAR_DIAGNOSTICS = "UPDATE_SIDEBAR_DIAGNOSTICS";
const FIX_MYSELF = "FIX_MYSELF";
exports.DETECT_VULNERABILITY_V2 = "DETECT_VULNERABILITY_V2";
exports.EXPLAIN_CODE = "EXPLAIN_CODE";
exports.OPTIMIZE_CODE = "OPTIMIZE_CODE";
exports.GENERATE_UNIT_TEST = "GENERATE_UNIT_TEST";
exports.GENERATE_DOC_STRING = "GENERATE_DOC_STRING";
exports.RUN_CODE = "RUN_CODE";
const api = (0, axiosInstance_1.createAxiosInstance)();
const updatePrevDiagnostics = vscode.commands.registerCommand(UPDATE_PREV_DIAGNOSTICS, async (args) => {
    const confirmation = await vscode.window.showInformationMessage('Oops, seems this code could be exploited by hackers, but worry not.. Sixth has you 😮‍💨', { modal: true }, 'Let Sixth fix this? 😤', "Nahh, i'd like to fix it myself");
    if (confirmation === 'Let Sixth fix this? 😤') {
        //console.log("is this working?");
        const workspaceEdit = new vscode.WorkspaceEdit();
        workspaceEdit.replace(args.document.uri, args.range, args.acutalFix + "\n", { needsConfirmation: true, label: " sixth" });
        vscode.workspace.applyEdit(workspaceEdit).then(success => {
        });
        if (args.gptDiagnostics.length >= 1) {
            fixGptCode(args.code, args.document.fileName, args.funcName);
        }
        try {
            const newDiags = args.gptDiagnostics.filter((diag) => diag.source !== args.code);
            var updatedLocDiags = [];
            const editor = vscode.window.activeTextEditor;
            var curDocument;
            // Get a reloaad of the new document
            if (editor) {
                curDocument = editor.document;
            }
            if (curDocument) {
                for (let i = 0; i <= newDiags.length - 1; i++) {
                    const curDiag = newDiags[i];
                    const location = (0, stringUtils_1.findMultilineSubstring)(curDocument, curDiag.source);
                    if (location !== null) {
                        const range = new vscode.Range(new vscode.Position(location.start, 0), new vscode.Position(location.end, 0));
                        updatedLocDiags.push({
                            code: "GPT3",
                            message: curDiag.message,
                            range: range,
                            severity: vscode.DiagnosticSeverity.Information,
                            source: curDocument.getText(range),
                            relatedInformation: [
                                new vscode.DiagnosticRelatedInformation(new vscode.Location(curDocument.uri, range), curDiag.fix_instruction)
                            ],
                            fix: curDiag.fix,
                            funcName: curDiag.funcName,
                            fileName: curDiag.filename
                        });
                    }
                }
                (0, socketListener_1.updateGptDiagnostics)(updatedLocDiags, args.collection, args.document.uri);
                function runAfterDelay() {
                    return new Promise(resolve => {
                        (0, genUtils_1.delay)(genUtils_1.ONE_MINUTE_DELAY).then(() => {
                            (0, feedbackPanel_1.handleRatingCodeFixPopUp)((0, extension_1.getExtensionContext)(), () => { });
                            resolve();
                        });
                    });
                }
                runAfterDelay();
            }
        }
        catch (e) {
        }
    }
    else {
        //show pop up for feed back
        (0, feedbackPanel_1.handleRatingPopUp)((0, extension_1.getExtensionContext)(), () => { });
        vscode.commands.executeCommand("FIX_MYSELF", args);
    }
});
const updateSideBarDiagnostics = vscode.commands.registerCommand(exports.UPDATE_SIDEBAR_DIAGNOSTICS, async (args) => {
    if (args.gptDiagnostics.length >= 1) {
        fixGptCode(args.code, args.document.fileName, args.funcName);
    }
    try {
        const newDiags = args.gptDiagnostics.filter((diag) => diag.source !== args.code);
        var updatedLocDiags = [];
        for (let i = 0; i <= newDiags.length - 1; i++) {
            const curDiag = newDiags[i];
            const location = (0, stringUtils_1.findMultilineSubstring)(args.document, curDiag.source);
            const filename = args.document.fileName;
            if (location !== null) {
                const range = new vscode.Range(new vscode.Position(location.start, 0), new vscode.Position(location.end, 0));
                updatedLocDiags.push({
                    code: "GPT3",
                    message: curDiag.message,
                    range: range,
                    severity: vscode.DiagnosticSeverity.Information,
                    source: args.document.getText(range),
                    relatedInformation: [
                        new vscode.DiagnosticRelatedInformation(new vscode.Location(args.document.uri, range), curDiag.fix_instruction)
                    ],
                    fix: curDiag.fix,
                    funcName: curDiag.funcName,
                    fileName: filename
                });
            }
        }
        (0, socketListener_1.updateGptDiagnostics)(updatedLocDiags, args.collection, args.document.uri);
        (0, extension_2.setSideBarDiag)((0, sidebarUtils_1.gptDiagnosticsToSideNav)(updatedLocDiags));
    }
    catch (e) {
    }
});
const ignoreFixCommand = vscode.commands.registerCommand(FIX_MYSELF, (args) => {
    if (args.gptDiagnostics.length >= 1) {
        //fixMyself(args.code, args.document.fileName, args.funcName);
    }
    try {
        const newDiags = args.gptDiagnostics.filter((diag) => diag.source !== args.code);
        var updatedLocDiags = [];
        const editor = vscode.window.activeTextEditor;
        var curDocument;
        // Get a reloaad of the new document
        if (editor) {
            curDocument = editor.document;
        }
        if (curDocument) {
            for (let i = 0; i <= newDiags.length - 1; i++) {
                const curDiag = newDiags[i];
                const location = (0, stringUtils_1.findMultilineSubstring)(curDocument, curDiag.source);
                if (location !== null) {
                    const range = new vscode.Range(new vscode.Position(location.start, 0), new vscode.Position(location.end, 0));
                    updatedLocDiags.push({
                        code: "GPT3",
                        message: curDiag.message,
                        range: range,
                        severity: vscode.DiagnosticSeverity.Information,
                        source: curDocument.getText(range),
                        relatedInformation: [
                            new vscode.DiagnosticRelatedInformation(new vscode.Location(curDocument.uri, range), curDiag.fix_instruction)
                        ],
                        fix: curDiag.fix,
                        funcName: curDiag.funcName,
                        fileName: curDiag.filename
                    });
                }
            }
            (0, socketListener_1.updateGptDiagnostics)(updatedLocDiags, args.collection, args.document.uri);
        }
    }
    catch (e) {
    }
});
const detectVulnenrabilityV2 = vscode.commands.registerCommand(exports.DETECT_VULNERABILITY_V2, async (args) => {
    try {
        const panel = (await (0, codeLens_1.ensureChatProvider)()).panel;
        if (!panel) {
            (0, sentry_1.captureMessage)('Chat panel not found', 'warning');
            return;
        }
        (0, extension_1.setCurrentWebviewTab)(panel);
        if (!extension_1.currentWebviewTab) {
            return;
        }
        extension_1.currentWebviewTab.webview.postMessage({
            "command": "DETECT_VULNERABILTY",
            value: {
                "display_question": `debug my function ${args.name}() and recommend fix to me`,
                "actual_prompt": `
do the following programming related tasks for me
-> Debug this piece of code in a way that makes it works, include all the necessary code required for it to work in the code
-> State the range of line of code that is causing the bug
-> Make sure your fix does not complicate the already existing code!, If it already works!, Leave it alone!
-> Misspellings a variable is not a bug If the code already works.
-> If there is no bug in the code, do not make any changes, only indicate that the code looks fine and do not regenerate the code
-> Always give the simplest and easiest to understand implementation that fixes the bug, 
-> Briefly explain what the bug and how you fixed it. 
This is the function name below
${args.name}()
and it is present in the currently opened file
                `,
                "filename": args.filename
            }
        });
        logCodeLensUsage(exports.DETECT_VULNERABILITY_V2);
    }
    catch (error) {
        (0, sentry_1.captureException)(error, {
            command: 'detectVulnenrabilityV2',
            args: JSON.stringify(args)
        });
        vscode.window.showErrorMessage('Failed to detect vulnerabilities');
    }
});
const runCode = vscode.commands.registerCommand(exports.RUN_CODE, async (args) => {
    if (extension_1.currentWebvieweTabDisposed) {
        const subscriber = true ? (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.ADDED_BILLING, "false") === "true" : false;
        if (mainMenuProvider_1.chatTwoGPT4Provider !== null && mainMenuProvider_1.chatTwoGPT4Provider !== undefined) {
            (0, extension_1.setCurrentWebviewTabDisposed)(false);
            var newPanel = mainMenuProvider_1.chatTwoGPT4Provider.getWebView();
            if (newPanel)
                (0, extension_1.setCurrentWebviewTab)(newPanel);
        }
        else {
            var newChat = new chatGpt4Provider_1.ChatGPT4Provider(subscriber, null);
            (0, mainMenuProvider_1.setNewChatGptProviderTwo)(newChat);
            newChat.provideChat();
        }
    }
    if (extension_1.currentWebvieweTabDisposed) {
        const subscriber = true ? (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.ADDED_BILLING, "false") === "true" : false;
        if (mainMenuProvider_1.chatTwoGPT4Provider !== null && mainMenuProvider_1.chatTwoGPT4Provider !== undefined) {
            mainMenuProvider_1.chatTwoGPT4Provider.dispose();
        }
        else {
            (0, mainMenuProvider_1.setNewChatGptProviderTwo)(new chatGpt4Provider_1.ChatGPT4Provider(subscriber, null));
        }
        mainMenuProvider_1.chatTwoGPT4Provider.provideChat();
    }
    var sub = (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.ADDED_BILLING, "");
    if (sub === "false" || sub === "") {
        showAddCardModal();
        logCodeLensUsage("OPTIMIZE_CODE_FREE_REQUEST");
    }
});
const explainCode = vscode.commands.registerCommand(exports.EXPLAIN_CODE, async (args) => {
    const panel = (await (0, codeLens_1.ensureChatProvider)()).panel;
    if (!panel) {
        return;
    }
    (0, extension_1.setCurrentWebviewTab)(panel);
    if (!extension_1.currentWebviewTab) {
        return;
    }
    extension_1.currentWebviewTab.webview.postMessage({
        "command": "EXPLAIN_CODE",
        value: {
            "display_question": `explain ${args.name}() to me and tell me what it does`,
            "actual_prompt": `do the following programming related tasks for me
-> Explain what the code below does generally
-> Generate two example usage for the function
This is the function name below
${args.name}()
and it is present in the currently opened file
            `
        }
    });
    logCodeLensUsage(exports.EXPLAIN_CODE);
});
const optimizeCode = vscode.commands.registerCommand(exports.OPTIMIZE_CODE, async (args) => {
    const panel = (await (0, codeLens_1.ensureChatProvider)()).panel;
    if (!panel) {
        return;
    }
    (0, extension_1.setCurrentWebviewTab)(panel);
    if (!extension_1.currentWebviewTab) {
        return;
    }
    var sub = (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.ADDED_BILLING, "");
    if (sub === "false" || sub === "") {
        showAddCardModal();
        logCodeLensUsage("OPTIMIZE_CODE_FREE_REQUEST");
    }
    else {
        extension_1.currentWebviewTab.webview.postMessage({
            "command": "OPTIMIZE_CODE",
            value: {
                "display_question": `optimize the function ${args.name}() making faster and consume less memory`,
                "actual_prompt": `
do the following programming related tasks for me
-> Decrease the time complexity of the code below if possible
-> Decrease the spack complexity of the code below if possible
-> provide the code fix for this
-> Brieflly explain what was done wrong before and what you did better, and give the runtime analysis of the current code and your suggested code in a file called analysis.txt
This is the function name below
${args.name}()
and it is present in the currently opened file
                `
            }
        });
        logCodeLensUsage(exports.OPTIMIZE_CODE);
    }
});
const generateUnitTest = vscode.commands.registerCommand(exports.GENERATE_UNIT_TEST, async (args) => {
    const panel = (await (0, codeLens_1.ensureChatProvider)()).panel;
    if (!panel) {
        return;
    }
    (0, extension_1.setCurrentWebviewTab)(panel);
    if (!extension_1.currentWebviewTab) {
        return;
    }
    var sub = (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.ADDED_BILLING, "");
    if (sub === "false" || sub === "") {
        showAddCardModal();
        logCodeLensUsage("GENERATE_UNIT_TEST_FREE_REQUEST");
    }
    else {
        extension_1.currentWebviewTab.webview.postMessage({
            "command": "GENERATE_UNIT_TEST",
            value: {
                "display_question": `Generate a comprehensive unit test for ${args.name}()`,
                "actual_prompt": `
do the following programming related tasks for me
-> Write a comprehensive set of unit tests for the below code. 
-> It should setup, run tests that check for correctness including important edge cases, and teardown. 
-> Ensure that the tests are complete and sophisticated.
This is the function name below
${args.name}()
and it is present in the currently opened file
                `
            }
        });
        logCodeLensUsage(exports.GENERATE_UNIT_TEST);
    }
});
const generateDocString = vscode.commands.registerCommand(exports.GENERATE_DOC_STRING, async (args) => {
    const panel = (await (0, codeLens_1.ensureChatProvider)()).panel;
    if (!panel) {
        return;
    }
    (0, extension_1.setCurrentWebviewTab)(panel);
    if (!extension_1.currentWebviewTab) {
        return;
    }
    var sub = (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.ADDED_BILLING, "");
    if (sub === "false" || sub === "") {
        showAddCardModal();
        logCodeLensUsage("GENERATE_DOC_STRING_FREE_REQUEST");
    }
    else {
        extension_1.currentWebviewTab.webview.postMessage({
            "command": "GENERATE_DOC_STRING",
            value: {
                "display_question": `Generate a docstring for ${args.name}()`,
                "actual_prompt": `
do the following programming related tasks for me
-> Generate Docstring for the code below. 
-> It should state the parameters and their possible types, if the data type is not known use the flag <DATA_TYPE_HERE> as the data type. 
This is the function name below
${args.name}()
and it is present in the currently opened file
                `
            }
        });
        logCodeLensUsage(exports.GENERATE_DOC_STRING);
    }
});
function showAddCardModal() {
    vscode.window.showInformationMessage("Oops you need to upgrade to a paid version to do that, Boost your productivity by over 250%!!, It's jst $9.99 per month, same price as a Big Mac 😅. You can cancel at anytime too 😊", { modal: true }, "Add billing info.").then(selection => {
        if (selection === "Add billing info.") {
            const panel = vscode.window.createWebviewPanel('centeredInput', 'Update your billing Info', vscode.ViewColumn.Active, // Show in the active editor column
            {
                enableScripts: true,
            });
            panel.webview.html = (0, authPanel_1.createBillingPanel)();
            panel.webview.onDidReceiveMessage((message) => {
                if (message.command == "show_info_message") {
                    vscode.window.showInformationMessage(message.value);
                }
                if (message.command === "billing_submit") {
                    vscode.window.showInformationMessage("Updating your billing info");
                    (0, authPanel_1.initPaymentForUser)((0, extension_1.getExtensionContext)(), message.value["id"], (message) => {
                        (0, projectUtils_1.saveDataToCache)((0, extension_1.getExtensionContext)(), projectUtils_1.ADDED_BILLING, "true");
                        panel.dispose();
                    }, (message) => {
                    });
                }
                if (message.command === "error") {
                    vscode.window.showInformationMessage(message.value);
                }
            });
        }
    });
}
function showAddCardUnitTestModal() {
    vscode.window.showInformationMessage(`Oops you need to upgrade to a paid version to do that! \n\nUnlock the full power of auto-generating unit tests for your projects!\n\nWith $15/month, you can:\n- Generate unit tests for a single function, a single file, or the entire project with ease by specifying a workflow.\n- Enjoy the convenience of auto-generation at any point in your Test-Driven Development (TDD) process.\n\nUpgrade now and supercharge your coding experience! 💡`, { modal: true }, "Add billing info.").then(selection => {
        if (selection === "Add billing info.") {
            const panel = vscode.window.createWebviewPanel('centeredInput', 'Update your billing Info', vscode.ViewColumn.Active, // Show in the active editor column
            {
                enableScripts: true,
            });
            panel.webview.html = (0, authPanel_1.createBillingPanel)();
            panel.webview.onDidReceiveMessage((message) => {
                if (message.command === "show_info_message") {
                    vscode.window.showInformationMessage(message.value);
                }
                if (message.command === "billing_submit") {
                    vscode.window.showInformationMessage("Updating your billing info");
                    (0, authPanel_1.initPaymentForUser)((0, extension_1.getExtensionContext)(), message.value["id"], (message) => {
                        (0, projectUtils_1.saveDataToCache)((0, extension_1.getExtensionContext)(), projectUtils_1.ADDED_BILLING, "true");
                        panel.dispose();
                    }, (message) => {
                    });
                }
                if (message.command === "error") {
                    vscode.window.showInformationMessage(message.value);
                }
            });
        }
    });
}
function fixGptCode(code, filename, funcRealName = "") {
    var funcName;
    var apiKey;
    const realApikey = (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, "");
    const tempApikey = (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.TEMP_APIKEY, "");
    if (realApikey) {
        apiKey = realApikey;
    }
    else {
        apiKey = tempApikey;
    }
    funcName = funcRealName;
    api.post("https://gptsocket.withsix.co/fix-gpt-code", {
        "filename": filename,
        "func_name": funcName,
        "apikey": apiKey
    }).then(response => {
        //console.log(response,"help me please inna");
    })
        .catch(error => {
        //console.log(error,"help me please");
    });
}
function logCodeLensUsage(logType) {
    const realApikey = (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, "");
    const email = (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, "");
    api.post("https://backend.withsix.co/vs-code/log_codelens", {
        "apikey": realApikey,
        "email": email,
        "log_type": logType
    }).then(response => {
    })
        .catch(error => {
    });
}
function registerGPTCommandInContext(context) {
    context.subscriptions.push(updatePrevDiagnostics);
    context.subscriptions.push(ignoreFixCommand);
    context.subscriptions.push(updateSideBarDiagnostics);
    context.subscriptions.push(detectVulnenrabilityV2);
    context.subscriptions.push(explainCode);
    context.subscriptions.push(optimizeCode);
    context.subscriptions.push(generateUnitTest);
    context.subscriptions.push(generateDocString);
}
//# sourceMappingURL=commands.js.map