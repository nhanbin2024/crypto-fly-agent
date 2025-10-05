'use strict';
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
exports.authPanel = exports.externalContextCurrentData = exports.customTerminal = exports.SeeTerminalProvider = exports.InlineChatProvider = exports.menuProvider = exports.chatGPT4Provider = exports.jiraProvider = exports.sideBarDiagnostics = exports.sixthDiagnostics = exports.globalSidebar = exports.currentWebvieweTabDisposed = exports.currentWebviewTab = void 0;
exports.inline_accepted = inline_accepted;
exports.setCurrentWebviewTab = setCurrentWebviewTab;
exports.setCurrentWebviewTabDisposed = setCurrentWebviewTabDisposed;
exports.setSideBarDiag = setSideBarDiag;
exports.setChatGPT4Provider = setChatGPT4Provider;
exports.setExternalContextCurrentData = setExternalContextCurrentData;
exports.setAuthPanel = setAuthPanel;
exports.activate = activate;
exports.getExtensionContext = getExtensionContext;
exports.setUp = setUp;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const authPanel_1 = require("./auth/authPanel");
const projectUtils_1 = require("./utils/projectUtils");
const commands_1 = require("./gpt3/commands");
const projectUtils_2 = require("./utils/projectUtils");
const treeNode_1 = require("./sidebars/treeNode");
const commands_2 = require("./analytics/commands");
const feedbackPanel_1 = require("./analytics/feedbackPanel");
const genUtils_1 = require("./utils/genUtils");
const codeLens_1 = require("./gpt3/codeLens");
const documentSync_1 = require("./documents/documentSync");
const uriHandler_1 = require("./utils/uriHandler");
const jiraProvider_1 = require("./jira/jiraProvider");
const chatGpt4Provider_1 = require("./chatGPT4/chatGpt4Provider");
const mainMenuProvider_1 = require("./mainMenu/mainMenuProvider");
const network_1 = require("./utils/network");
const inlineChat_1 = require("./topTabChats/inlineChat");
const fileUtils_1 = require("./utils/fileUtils");
const seeTerminal_1 = require("./topTabChats/seeTerminal");
const completionProvider = __importStar(require("./autocomplete/completionProvider"));
const interactiveDiff = __importStar(require("./autocomplete/interactiveDiff"));
const estate = __importStar(require("./autocomplete/estate"));
const fetchAPI = __importStar(require("./autocomplete/fetchAPI"));
const quickActions_1 = require("./gpt3/quickActions");
const quickActions_2 = require("./gpt3/quickActions");
const checkpointManager_1 = require("./database/checkpointManager");
const chatHistoryManager_1 = require("./database/chatHistoryManager");
const sentry_1 = require("./utils/sentry");
const glydeProvider_1 = require("./glyde/glydeProvider");
exports.sixthDiagnostics = vscode.languages.createDiagnosticCollection("apikey");
exports.sideBarDiagnostics = [];
let extensionContext;
exports.externalContextCurrentData = null;
const estate_1 = require("./autocomplete/estate");
async function pressed_escape() {
    completionProvider.on_esc_pressed();
    let editor = vscode.window.activeTextEditor;
    if (editor) {
        let state = estate.state_of_editor(editor, "pressed_escape");
        if (state) {
            state.diff_lens_pos = Number.MAX_SAFE_INTEGER;
            state.completion_lens_pos = Number.MAX_SAFE_INTEGER;
        }
        if (state && (state.get_mode() === estate_1.Mode.Diff || state.get_mode() === estate_1.Mode.DiffWait)) {
            if (state.get_mode() === estate_1.Mode.DiffWait) {
                await fetchAPI.cancel_all_requests_and_wait_until_finished();
            }
            if (state.highlight_json_backup !== undefined) {
                await estate.switch_mode(state, estate_1.Mode.Highlight);
            }
            else {
                await estate.switch_mode(state, estate_1.Mode.Normal);
            }
        }
        else if (state && state.get_mode() === estate_1.Mode.Highlight) {
            await estate.back_to_normal(state);
        }
        if (state && state.get_mode() === estate_1.Mode.Normal) {
            await vscode.commands.executeCommand('setContext', 'sixth.runEsc', false);
            await vscode.commands.executeCommand('editor.action.inlineSuggest.hide');
        }
    }
}
async function inline_accepted(this_completion_serial_number) {
    if (typeof this_completion_serial_number === "number") {
        await completionProvider.inline_accepted(this_completion_serial_number);
    }
    else {
    }
}
async function pressed_tab() {
    let editor = vscode.window.activeTextEditor;
    if (editor) {
        let state = estate.state_of_editor(editor, "pressed_tab");
        if (state && state.get_mode() === estate_1.Mode.Diff) {
            interactiveDiff.like_and_accept(editor);
        }
        else {
            vscode.commands.executeCommand("setContext", "sixth.runTab", false);
        }
    }
}
function setCurrentWebviewTab(webviewPanel) {
    exports.currentWebviewTab = webviewPanel;
}
function setCurrentWebviewTabDisposed(disposed) {
    exports.currentWebvieweTabDisposed = disposed;
}
function setSideBarDiag(diag) {
    exports.sideBarDiagnostics = diag;
}
function setChatGPT4Provider(provider) {
    if (provider)
        exports.chatGPT4Provider = provider;
}
function setExternalContextCurrentData(newData) {
    exports.externalContextCurrentData = newData;
}
function setAuthPanel(panel) {
    exports.authPanel = panel;
}
/**
 * Activate the extension.
 * @param context - The extension context.
 */
async function activate(context) {
    extensionContext = context;
    // Initialize Sentry - but only for manual error capturing
    (0, sentry_1.initializeSentry)();
    try {
        // Note: Sentry will no longer automatically capture exceptions.
        // Use try/catch blocks and call captureException manually where needed.
        try {
            extensionContext = context;
            global.global_context = context;
            global.enable_longthink_completion = false;
            global.last_positive_result = 0;
            global.chat_models = [];
            global.have_caps = false;
            global.chat_default_model = "";
            const userLoggedIn = (0, projectUtils_1.getDataFromCache)(context, projectUtils_1.REGISTERED, null) === "false" || (0, projectUtils_1.getDataFromCache)(context, projectUtils_1.REGISTERED, null);
            exports.jiraProvider = new jiraProvider_1.JiraViewProvider(context);
            (0, network_1.getUserSubscriberInfo)(() => {
            });
            registerVSCodeJiraDynammicLLink(context);
            vscode.window.registerWebviewViewProvider(jiraProvider_1.JiraViewProvider.viewType, exports.jiraProvider, {
                webviewOptions: {
                    retainContextWhenHidden: true,
                }
            });
            const editors = vscode.window.visibleTextEditors;
            if (editors.length > 0) {
                // Access the document associated with the active editor
                editors.forEach((editor, index) => {
                    (0, codeLens_1.setCurDocument)(editor.document);
                });
            }
            vscode.workspace.onDidOpenTextDocument(documentSync_1.handleDocumentOpened);
            (0, documentSync_1.monitorChanges)();
            console.log("Activating extension Passed 2");
            if ((0, projectUtils_1.getDataFromCache)(context, projectUtils_1.APIKEY, null)) {
                if (userLoggedIn) {
                    const rememberMe = (0, projectUtils_1.getDataFromCache)(context, projectUtils_1.REMEMBERME, null);
                    if (rememberMe) {
                        //autoLogin
                        const email = (0, projectUtils_1.getDataFromCache)(context, projectUtils_1.EMAIL, null);
                        const password = (0, projectUtils_1.getDataFromCache)(context, projectUtils_1.PASSWORD, null);
                        const userId = (0, projectUtils_1.getDataFromCache)(context, projectUtils_1.APIKEY, null);
                        (0, authPanel_1.loginUser)(password, email, userId, (response) => {
                            (0, projectUtils_2.saveDataToCache)(context, projectUtils_1.APIKEY, response["apikey"]);
                            console.log("User id is ", userId, response["access_token"]["access_token"]);
                            (0, projectUtils_2.saveDataToCache)(context, projectUtils_1.JWT, response["access_token"]["access_token"]);
                            setUp(context, " Login panel");
                        }, (error) => {
                            const error_type = error.response.data["detail"];
                            if (error_type["required_action"] === "ADD_CARD") {
                                const panel = vscode.window.createWebviewPanel('centeredInput', 'Register yourself', vscode.ViewColumn.Active, // Show in the active editor column
                                {
                                    enableScripts: true,
                                });
                                exports.authPanel = panel;
                                panel.webview.html = (0, authPanel_1.createBillingPanel)();
                                panel.webview.onDidReceiveMessage((message) => {
                                    if (message.command == "show_info_message") {
                                        vscode.window.showInformationMessage(message.value);
                                    }
                                    if (message.command === "billing_submit") {
                                        (0, authPanel_1.initPaymentForUser)(context, message.value["id"], (message) => {
                                            onSuccess();
                                            if (panel)
                                                panel.dispose();
                                        }, (message) => {
                                        });
                                    }
                                    if (message.command === "error") {
                                        vscode.window.showInformationMessage(message.value);
                                    }
                                    if (message.command === 'showLoginPanel') {
                                        if (panel)
                                            panel.dispose();
                                        (0, authPanel_1.createLoginPanel)(context, () => {
                                            onSuccess();
                                        });
                                    }
                                });
                                (0, feedbackPanel_1.createFeedBackPopUp)(context, () => { });
                            }
                            else {
                                (0, authPanel_1.createOneTimeRegisterationPanel)(context, () => {
                                    (0, projectUtils_2.saveDataToCache)(context, projectUtils_1.REGISTERED, `true`);
                                    exports.jiraProvider.getCurrentOnboardingStep();
                                    setUp(context, " Login paanel");
                                    (0, feedbackPanel_1.handleSixthJoinCommunityModal)(context, () => { });
                                });
                            }
                        });
                    }
                    else {
                        (0, authPanel_1.createOneTimeRegisterationPanel)(context, () => {
                            const email = (0, projectUtils_1.getDataFromCache)(context, projectUtils_1.EMAIL, null);
                            const password = (0, projectUtils_1.getDataFromCache)(context, projectUtils_1.PASSWORD, null);
                            const userId = (0, projectUtils_1.getDataFromCache)(context, projectUtils_1.APIKEY, null);
                            (0, authPanel_1.loginUser)(password, email, userId, (response) => {
                                (0, projectUtils_2.saveDataToCache)(context, projectUtils_1.APIKEY, response["apikey"]);
                                (0, projectUtils_2.saveDataToCache)(context, projectUtils_1.JWT, response["access_token"]["access_token"]);
                                (0, projectUtils_2.saveDataToCache)(context, projectUtils_1.REGISTERED, `true`);
                                exports.jiraProvider.getCurrentOnboardingStep();
                                setUp(context, " Login paanel");
                                (0, feedbackPanel_1.handleSixthJoinCommunityModal)(context, () => { });
                            }, (error) => {
                                (0, projectUtils_2.saveDataToCache)(context, projectUtils_1.REGISTERED, `true`);
                                exports.jiraProvider.getCurrentOnboardingStep();
                                setUp(context, " Login paanel");
                                (0, feedbackPanel_1.handleSixthJoinCommunityModal)(context, () => { });
                            });
                        });
                    }
                }
                else {
                    (0, authPanel_1.createOneTimeRegisterationPanel)(context, () => {
                        const email = (0, projectUtils_1.getDataFromCache)(context, projectUtils_1.EMAIL, null);
                        const password = (0, projectUtils_1.getDataFromCache)(context, projectUtils_1.PASSWORD, null);
                        const userId = (0, projectUtils_1.getDataFromCache)(context, projectUtils_1.APIKEY, null);
                        (0, authPanel_1.loginUser)(password, email, userId, (response) => {
                            (0, projectUtils_2.saveDataToCache)(context, projectUtils_1.APIKEY, response["apikey"]);
                            (0, projectUtils_2.saveDataToCache)(context, projectUtils_1.JWT, response["access_token"]["access_token"]);
                            (0, projectUtils_2.saveDataToCache)(context, projectUtils_1.REGISTERED, `true`);
                            exports.jiraProvider.getCurrentOnboardingStep();
                            setUp(context, " Login paanel");
                            (0, feedbackPanel_1.handleSixthJoinCommunityModal)(context, () => { });
                        }, (error) => {
                            (0, projectUtils_2.saveDataToCache)(context, projectUtils_1.REGISTERED, `true`);
                            exports.jiraProvider.getCurrentOnboardingStep();
                            setUp(context, " Login paanel");
                            (0, feedbackPanel_1.handleSixthJoinCommunityModal)(context, () => { });
                        });
                    });
                }
                (0, feedbackPanel_1.getUserRatingStatus)(context);
                //getUserSurveyStatus(context);
                (0, feedbackPanel_1.handleFeedbackPopUP)(context, () => { });
                const intervalInMilliseconds = genUtils_1.FOUR_HOURS_DELAY; // 4 hours in milliseconds
                setInterval(() => {
                    (0, feedbackPanel_1.handleFeedbackPopUP)(context, () => { });
                }, intervalInMilliseconds);
                (0, feedbackPanel_1.handleSixthJoinCommunityModal)(context, () => { });
                (0, feedbackPanel_1.handleInAppPopUP)(context, () => { });
            }
            else {
                (0, authPanel_1.createOneTimeRegisterationPanel)(context, () => {
                    const email = (0, projectUtils_1.getDataFromCache)(context, projectUtils_1.EMAIL, null);
                    const password = (0, projectUtils_1.getDataFromCache)(context, projectUtils_1.PASSWORD, null);
                    const userId = (0, projectUtils_1.getDataFromCache)(context, projectUtils_1.APIKEY, null);
                    (0, authPanel_1.loginUser)(password, email, userId, (response) => {
                        (0, projectUtils_2.saveDataToCache)(context, projectUtils_1.APIKEY, response["apikey"]);
                        (0, projectUtils_2.saveDataToCache)(context, projectUtils_1.JWT, response["access_token"]["access_token"]);
                        (0, projectUtils_2.saveDataToCache)(context, projectUtils_1.REGISTERED, `true`);
                        exports.jiraProvider.getCurrentOnboardingStep();
                        setUp(context, " Login paanel");
                        (0, feedbackPanel_1.handleSixthJoinCommunityModal)(context, () => { });
                    }, (error) => {
                        (0, projectUtils_2.saveDataToCache)(context, projectUtils_1.REGISTERED, `true`);
                        exports.jiraProvider.getCurrentOnboardingStep();
                        setUp(context, " Login paanel");
                        (0, feedbackPanel_1.handleSixthJoinCommunityModal)(context, () => { });
                    });
                });
            }
            // Register error quick fix provider
            context.subscriptions.push(vscode.languages.registerCodeActionsProvider('*', new quickActions_1.ErrorQuickFixProvider(), {
                providedCodeActionKinds: quickActions_1.ErrorQuickFixProvider.providedCodeActionKinds
            }));
            // Register the command
            (0, quickActions_2.registerErrorQuickFixCommand)(context);
            // Initialize managers
            try {
                await chatHistoryManager_1.ChatHistoryManager.getInstance();
                checkpointManager_1.CheckpointManager.getInstance(context);
            }
            catch (error) {
                console.error('Failed to initialize managers:', error);
                (0, sentry_1.captureException)(error, { activationPhase: 'chat_history_manager' });
            }
        }
        finally {
        }
    }
    catch (error) {
        // Manually capture outer errors - no longer automatic
        (0, sentry_1.captureException)(error, { activationPhase: 'main' });
        console.log("Error in outer activation: ", error);
    }
}
function getExtensionContext() {
    if (!extensionContext) {
    }
    return extensionContext;
}
function onSuccess() {
    setUp(extensionContext, "");
}
async function setUp(context, who) {
    const subscriber = true ? (0, projectUtils_1.getDataFromCache)(getExtensionContext(), projectUtils_1.ADDED_BILLING, "false") === "true" : false;
    context.subscriptions.push(exports.sixthDiagnostics);
    (0, commands_1.registerGPTCommandInContext)(context);
    const provider = new treeNode_1.ContinueGUIWebviewViewProvider();
    exports.globalSidebar = provider;
    // set up sidebar webview
    vscode.window.registerWebviewViewProvider("nodeDependencies", provider, {
        webviewOptions: { retainContextWhenHidden: true },
    });
    context.subscriptions.push(vscode.commands.registerCommand('codelens-sample.command', (uri) => {
        vscode.window.showInformationMessage('Command triggered for document: ' + uri.toString());
    }));
    (0, commands_2.registerAnalytics)();
    const auto_open_menu = (0, projectUtils_1.getDataFromCache)(context, projectUtils_1.AUTO_OPEN_MAIN_MENU, true);
    if (auto_open_menu) {
        exports.menuProvider = new mainMenuProvider_1.mainMenuProvider(subscriber);
        exports.menuProvider.initWebview();
    }
    global.completionProvider = new completionProvider.MyInlineCompletionProvider();
    vscode.languages.registerInlineCompletionItemProvider({ pattern: "**" }, global.completionProvider);
    let disposable4 = vscode.commands.registerCommand('sixth.esc', pressed_escape);
    let disposable5 = vscode.commands.registerCommand('sixth.tab', pressed_tab);
    let disposable1 = vscode.commands.registerCommand('sixth.inlineAccepted', inline_accepted);
    let disposable2 = vscode.commands.registerCommand('sixth.inlineRejected', completionProvider.inline_rejected);
    let disposable13 = vscode.commands.registerCommand('sixth.completionManual', async () => {
        await vscode.commands.executeCommand('editor.action.inlineSuggest.hide');
        await vscode.commands.executeCommand('editor.action.inlineSuggest.trigger');
    });
    context.subscriptions.push(disposable1);
    context.subscriptions.push(disposable4);
    context.subscriptions.push(disposable5);
    context.subscriptions.push(disposable13);
    context.subscriptions.push(disposable2);
    context.subscriptions.push(vscode.commands.registerCommand('extension.inlineChat', () => {
        const quickPick = vscode.window.createQuickPick();
        quickPick.title = "Inline Chat";
        quickPick.placeholder = "type in your prompt...";
        //quickPick.items = [{ label: "Submit" }];
        quickPick.ignoreFocusOut = true;
        quickPick.onDidAccept(() => {
            const userInput = quickPick.value; // Get user-typed input
            let editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found.');
            }
            else {
                if (!editor.selection || editor.selection.isEmpty) {
                    vscode.window.showErrorMessage('Please highlight a range to diff.');
                }
                else {
                    const selectedRange = editor.selection;
                    const document = editor.document;
                    const originalText = document.getText(selectedRange);
                    exports.InlineChatProvider = new inlineChat_1.inlineChatProvider(subscriber, selectedRange.start.line);
                    exports.InlineChatProvider.startEdit(originalText, '', userInput, selectedRange);
                }
            }
            quickPick.hide();
        });
        // Handle hiding the Quick Input
        quickPick.onDidHide(() => {
            quickPick.dispose();
        });
        quickPick.show();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('extension.terminalCommand', async () => {
        const quickPick = vscode.window.createQuickPick();
        quickPick.title = "Terminal Command";
        quickPick.placeholder = "type in your prompt...";
        //quickPick.items = [{ label: "Submit" }];
        quickPick.ignoreFocusOut = true;
        // Optionally focus the terminal if it's already open
        await vscode.commands.executeCommand('workbench.action.terminal.focus');
        quickPick.onDidAccept(async () => {
            const userInput = quickPick.value; // Get user-typed input
            if (exports.SeeTerminalProvider === null || exports.SeeTerminalProvider === undefined) {
                exports.SeeTerminalProvider = new seeTerminal_1.seeTerminalProvider(subscriber);
            }
            vscode.window.showInformationMessage("Generating terminal command...");
            const terminalCommand = await exports.SeeTerminalProvider.getTerminalCommand(userInput, false);
            let userTerminal = vscode.window.activeTerminal;
            if (!userTerminal) {
                userTerminal = vscode.window.createTerminal('My Extension Terminal');
                userTerminal.show();
            }
            if (terminalCommand !== null && terminalCommand !== undefined) {
                userTerminal.sendText(terminalCommand, false);
                vscode.window.showInformationMessage("Terminal command generated!");
            }
            quickPick.hide();
        });
        // Handle hiding the Quick Input
        quickPick.onDidHide(() => {
            quickPick.dispose();
        });
        quickPick.show();
    }));
    let chat_disposable = vscode.commands.registerCommand('extension.openChat', () => {
        // Create new instance of ChatGPT4Provider and show chat
        const chatProvider = new chatGpt4Provider_1.ChatGPT4Provider(true, null);
        chatProvider.provideChat();
    });
    context.subscriptions.push(chat_disposable);
    let glyde_disposable = vscode.commands.registerCommand('extension.openGlyde', () => {
        const glydeProvider = new glydeProvider_1.GlydeProvider(context);
        glydeProvider.provideGlydeView();
    });
    context.subscriptions.push(glyde_disposable);
    try {
        RegsiterCodeLens(context);
    }
    catch (e) {
        (0, sentry_1.captureException)(e, { activationPhase: 'setUp', caller: who });
    }
    exports.externalContextCurrentData = await (0, genUtils_1.getFullContext)((0, projectUtils_1.getDataFromCache)(context, projectUtils_1.APIKEY, null));
}
function RegsiterCodeLens(context) {
    const codelensProvider = new codeLens_1.CodelensProvider();
    vscode.languages.registerCodeLensProvider("*", codelensProvider);
    vscode.commands.registerCommand("codelens-sample.enableCodeLens", () => {
        vscode.workspace.getConfiguration("codelens-sample").update("enableCodeLens", true, true);
    });
    vscode.commands.registerCommand("codelens-sample.disableCodeLens", () => {
        vscode.workspace.getConfiguration("codelens-sample").update("enableCodeLens", false, true);
    });
    vscode.commands.registerCommand('extension.acceptDiff', async (uri, range) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.uri.toString() !== uri.toString()) {
            return;
        }
        const edit = new vscode.WorkspaceEdit();
        const originalText = editor.document.getText(range);
        if (exports.InlineChatProvider !== null && exports.InlineChatProvider !== undefined) {
            edit.replace(uri, range, exports.InlineChatProvider.lastUpdatedCode); // Accept changes (no-op for simplicity)
            vscode.workspace.applyEdit(edit);
            editor.setDecorations(exports.InlineChatProvider.addedDecoratorType, []);
            editor.setDecorations(exports.InlineChatProvider.removedDecorationType, []);
        }
        // Remove CodeLens for this range by updating codeLensRanges
        const codeLensData = fileUtils_1.codeLensRanges.get(uri.toString());
        if (codeLensData) {
            const updatedData = codeLensData.filter(item => !item.range.isEqual(range));
            fileUtils_1.codeLensRanges.set(uri.toString(), updatedData);
        }
        vscode.window.showInformationMessage('Changes accepted.');
        if (exports.InlineChatProvider !== null) {
            exports.InlineChatProvider = null;
        }
    });
    vscode.commands.registerCommand('extension.rejectDiff', async (uri, range) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.uri.toString() !== uri.toString()) {
            return;
        }
        const edit = new vscode.WorkspaceEdit();
        // Get the range and oldCode from the map
        const codeLensData = fileUtils_1.codeLensRanges.get(uri.toString());
        if (codeLensData) {
            const data = codeLensData.find(item => item.range.isEqual(range));
            if (data) {
                const { oldCode } = data;
                if (exports.InlineChatProvider !== null && exports.InlineChatProvider !== undefined) {
                    edit.replace(uri, range, oldCode); // Accept changes (no-op for simplicity)
                    vscode.workspace.applyEdit(edit);
                    editor.setDecorations(exports.InlineChatProvider.addedDecoratorType, []);
                    editor.setDecorations(exports.InlineChatProvider.removedDecorationType, []);
                }
                // Remove CodeLens for this range by updating codeLensRanges
                const updatedData = codeLensData.filter(item => !item.range.isEqual(range));
                fileUtils_1.codeLensRanges.set(uri.toString(), updatedData);
                // Refresh CodeLens after rejecting
                //vscode.languages.getCodeLens(editor.document, {});
                vscode.window.showInformationMessage('Changes rejected.');
                if (exports.InlineChatProvider !== null) {
                    exports.InlineChatProvider = null;
                }
            }
        }
    });
    vscode.languages.registerCodeLensProvider({ scheme: 'file' }, new fileUtils_1.DiffCodeLensProvider());
    vscode.commands.registerCommand("codelens-sample.codelensAction", (args) => {
        vscode.window.showInformationMessage(`CodeLens action clicked with args=${args.start_line}`);
    });
}
async function registerVSCodeJiraDynammicLLink(context) {
    const uriHandler = new uriHandler_1.SixthUriHandler();
    // And register it with VS Code. You can only register a single UriHandler for your extension.
    context.subscriptions.push(vscode.window.registerUriHandler(uriHandler));
    // You don't have to get the Uri from the `vscode.env.asExternalUri` API but it will add a query
    // parameter (ex: "windowId%3D14") that will help VS Code decide which window to redirect to.
    // If this query parameter isn't specified, VS Code will pick the last windows that was focused.
    const uri = await vscode.env.asExternalUri(vscode.Uri.parse(`${vscode.env.uriScheme}://Sixth.sixth`));
}
/*async function somePotentiallyRiskyAsyncSetup() {
    // Simulate some operation that might throw
    console.log("Running risky setup...");
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async work
    if (Math.random() < 0.1) { // Simulate an intermittent error
        throw new Error("Failed during the risky setup phase!");
    }
    console.log("Risky setup finished.");
}*/
function deactivate() {
}
//# sourceMappingURL=extension.js.map