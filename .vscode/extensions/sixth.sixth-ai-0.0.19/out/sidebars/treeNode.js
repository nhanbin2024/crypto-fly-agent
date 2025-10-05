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
exports.ContinueGUIWebviewViewProvider = exports.TreeViewExample = exports.TreeNode = void 0;
exports.fillTemplate = fillTemplate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const authPanel_1 = require("../auth/authPanel");
const extension_1 = require("../extension");
const socketListener_1 = require("../gpt3/socketListener");
const commands_1 = require("../gpt3/commands");
const authPanel_2 = require("../auth/authPanel");
const projectUtils_1 = require("../utils/projectUtils");
const chatGpt4Provider_1 = require("../chatGPT4/chatGpt4Provider");
const fileIndex_1 = require("../utils/fileIndex");
const indexingProvider_1 = require("../indexing/indexingProvider");
const multiFileEditingProvider_1 = require("../multi_file_editing/multiFileEditingProvider");
const settingsProvider_1 = require("../settings/settingsProvider");
const colors_1 = require("../utils/colors");
const feedbackPanel_1 = require("../analytics/feedbackPanel");
const axiosInstance_1 = require("../utils/axiosInstance");
const mainMenuProvider_1 = require("../mainMenu/mainMenuProvider");
const api = (0, axiosInstance_1.createAuthAxiosInstance)();
class TreeNode {
    constructor(label, htmlContent, children = [], collapsibleState = vscode.TreeItemCollapsibleState.Collapsed, 
    // Corrected iconPath type to match vscode.TreeItem.iconPath requirements
    iconPath, command) {
        this.label = label;
        this.htmlContent = htmlContent;
        this.children = children;
        this.collapsibleState = collapsibleState;
        this.iconPath = iconPath;
        this.command = command;
    }
    getTreeItem() {
        const treeItem = {
            label: this.label,
            collapsibleState: this.collapsibleState,
            command: this.command,
            iconPath: this.iconPath,
        };
        return treeItem;
    }
    getChildren() {
        return this.children;
    }
    getWebview() {
        if (this.htmlContent) {
            const webview = vscode.window.createWebviewPanel('htmlContent', this.label, // Title of the webview
            vscode.ViewColumn.One, {
                enableScripts: true,
            });
            webview.webview.html = this.htmlContent;
            return webview.webview;
        }
        return undefined;
    }
}
exports.TreeNode = TreeNode;
class TreeViewExample {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.rootNodes = [
            new TreeNode('Parent 1', '<b>HTML Content</b>', [
                new TreeNode('Child 1-1', undefined, [], vscode.TreeItemCollapsibleState.None, vscode.ThemeIcon.File),
                new TreeNode('Child 1-2', '<i>Italic HTML Content</i>', [new TreeNode('Grandchild 1-2-1')], vscode.TreeItemCollapsibleState.Collapsed, vscode.ThemeIcon.Folder),
            ]),
        ];
        // This method seems custom and not part of TreeDataProvider interface
        // resolveWebviewView(item: TreeNode): vscode.Webview | undefined {
        //   return item.getWebview();
        // }
    }
    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }
    getTreeItem(element) {
        return element.getTreeItem();
    }
    getChildren(element) {
        if (element) {
            return element.getChildren();
        }
        else {
            return this.rootNodes;
        }
    }
    // Corrected signature to match vscode.TreeDataProvider
    resolveTreeItem(item, element, token) {
        // 'item' is the TreeItem created by getTreeItem, 'element' is our TreeNode data object.
        // We typically enhance the 'item' here if needed, e.g., adding tooltips or commands
        // based on the 'element' data, especially for operations that might take time.
        // In this specific case, the command is already added in getTreeItem if htmlContent exists,
        // but let's replicate the logic here based on the 'element' for correctness.
        if (element.htmlContent) {
            item.command = {
                command: 'extension.openWebview',
                title: 'Open Webview',
                arguments: [element], // Pass the original TreeNode element as argument
            };
        }
        return item; // Return the potentially modified TreeItem
    }
}
exports.TreeViewExample = TreeViewExample;
class ContinueGUIWebviewViewProvider {
    constructor() {
        this.prevSideBar = "";
        this.prevSideBarDiag = [];
        this.newHtml = "";
    }
    resolveWebviewView(webviewView, _context, _token) {
        try {
            webviewView.webview.options = {
                ...webviewView.webview.options,
                enableScripts: true
            };
            this.sideBar = webviewView.webview;
            if ((0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, null) === null || (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, null) === undefined || (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, null) === "") {
                (0, authPanel_1.createOneTimeRegisterationPanel)((0, extension_1.getExtensionContext)(), () => {
                    const email = (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, null);
                    const password = (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.PASSWORD, null);
                    const userId = (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, null);
                    (0, authPanel_1.loginUser)(password, email, userId, (response) => {
                        (0, projectUtils_1.saveDataToCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, response["apikey"]);
                        (0, projectUtils_1.saveDataToCache)((0, extension_1.getExtensionContext)(), projectUtils_1.JWT, response["access_token"]["access_token"]);
                        (0, projectUtils_1.saveDataToCache)((0, extension_1.getExtensionContext)(), projectUtils_1.REGISTERED, `true`);
                        extension_1.jiraProvider.getCurrentOnboardingStep();
                        (0, extension_1.setUp)((0, extension_1.getExtensionContext)(), " Login paanel");
                        (0, feedbackPanel_1.handleSixthJoinCommunityModal)((0, extension_1.getExtensionContext)(), () => { });
                    }, (error) => {
                        (0, projectUtils_1.saveDataToCache)((0, extension_1.getExtensionContext)(), projectUtils_1.REGISTERED, `true`);
                        extension_1.jiraProvider.getCurrentOnboardingStep();
                        (0, extension_1.setUp)((0, extension_1.getExtensionContext)(), " Login paanel");
                        (0, feedbackPanel_1.handleSixthJoinCommunityModal)((0, extension_1.getExtensionContext)(), () => { });
                    });
                });
                return;
            }
            var firstHTMlSet = false;
            var onChatUi = false;
            let html = fs.readFileSync(__dirname + "/sidebar.html", 'utf-8');
            const themeColors = (0, colors_1.getThemeColors)();
            // Fill template with theme colors first
            html = fillTemplate(html, JSON.stringify(themeColors), "THEME_COLORS_JSON");
            // Then handle the subscription status
            const sub = (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.ADDED_BILLING, "");
            if (sub === "false" || sub === "") {
                html = fillTemplate(html, "Free-tier", "DAYS_LEFT");
            }
            else {
                html = fillTemplate(html, "Standard-tier", "DAYS_LEFT");
            }
            webviewView.webview.html = html;
            this.prevSideBar = html;
            firstHTMlSet = true;
            setInterval(() => {
                if (firstHTMlSet && !onChatUi) {
                    if (this.prevSideBarDiag !== extension_1.sideBarDiagnostics) {
                        this.newHtml = fillTemplate(this.prevSideBar, JSON.stringify(extension_1.sideBarDiagnostics), "REPLACE_THIS");
                        webviewView.webview.html = this.newHtml;
                        this.prevSideBarDiag = extension_1.sideBarDiagnostics;
                    }
                }
            }, 2000);
            webviewView.webview.onDidReceiveMessage(async (message) => {
                if (message.command === "log_event") {
                    console.log("log_event", message.value);
                }
                if (message.command === "chat_timeout") {
                    //vscode.window.showInformationMessage("Chat response timeout, please check your internet connection.");
                }
                if (message.command === "showUploadFileModal") {
                    if ((0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), "ADDED_BILLING", null)) {
                        vscode.window.showInformationMessage("This feature is about 70-80% done. Don't worry you won't be billed till when it done, and you will be the first to know when it is ready 😊", { modal: true });
                    }
                    else {
                        if (message.value === "JIRA") {
                            vscode.window.showInformationMessage("This is an enterprise level feature, Enterprise level features helps boost your company's productivity by over 250%!!, and it comes with tons of features important to make your business succesful and reduce running cost", { modal: true }, "Get started now.").then(async (selection) => {
                                if (selection === "Get started now.") {
                                    const panel = vscode.window.createWebviewPanel('centeredInput', 'Update your billing Info', vscode.ViewColumn.Active, // Show in the active editor column
                                    {
                                        enableScripts: true,
                                    });
                                    panel.webview.html = (0, authPanel_1.createJiraBillingPanel)();
                                    panel.webview.onDidReceiveMessage((message) => {
                                        if (message.command === "billing_submit") {
                                            vscode.window.showInformationMessage("Updating your billing info");
                                            (0, authPanel_1.initPaymentForUser)((0, extension_1.getExtensionContext)(), message.value["id"], (message) => {
                                                panel.dispose();
                                            }, (message) => {
                                            });
                                        }
                                        if (message.command === "error") {
                                            vscode.window.showInformationMessage(message.value);
                                        }
                                    });
                                    api.post("/log_user_requested_next_feature", {
                                        "email": (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, "anonymous"),
                                        "feature": "ENTERPRISE_JIRA_REQUEST"
                                    }).then(response => {
                                    });
                                }
                            });
                        }
                        else {
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
                        api.post("/log_user_requested_next_feature", {
                            "email": (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, "anonymous"),
                            "feature": message.value
                        }).then(response => {
                        });
                    }
                }
                if (message.command === "log_out") {
                    const apikey = (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, null);
                    if (apikey === null || apikey === undefined || apikey === "") {
                        vscode.window.showInformationMessage("You are already logged out, please restart your vscode extension to Login in back.", { modal: true });
                    }
                    else {
                        (0, projectUtils_1.clearAllCache)((0, extension_1.getExtensionContext)());
                        (0, projectUtils_1.saveDataToCache)((0, extension_1.getExtensionContext)(), projectUtils_1.JOIN_COMMUNITY, null);
                        //globalWss.close();
                        vscode.window.showInformationMessage("Log out sucessful. Restart your vscode extension to log in back.", { modal: true });
                    }
                }
                if (message.command === "comming_soon") {
                    vscode.window.showInformationMessage("This feature is about 70-80% done. Don't worry you'll be the first to know when it is ready 😊", { modal: true });
                    api.post("/log_user_requested_next_feature", {
                        "email": (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, "anonymous"),
                        "feature": message.value
                    }).then(response => {
                    });
                }
                if (message.command === "comming_soon_unit") {
                    //vscode.window.showInformationMessage("Upgrade to premium to enjoy", {modal:true});
                    vscode.window.showInformationMessage(`Oops you need to upgrade to a paid version to do that! \n\nUnlock the full power of auto-generating unit tests for your projects!\n\nWith $15/month, you can:\n- Generate unit tests for a single function, a single file, or the entire project with ease by specifying a workflow.\n- Enjoy the convenience of auto-generation at any point in your Test-Driven Development (TDD) process.\n\nUpgrade now and supercharge your coding experience! 💡`, { modal: true }, "Add billing info.").then(selection => {
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
                    api.post("/log_user_requested_next_feature", {
                        "email": (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, "anonymous"),
                        "feature": message.value
                    }).then(response => {
                    });
                }
                if (message.command === "open_chat") {
                    const subscriber = true ? (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.ADDED_BILLING, "false") === "true" : false;
                    if (mainMenuProvider_1.chatTwoGPT4Provider !== null && mainMenuProvider_1.chatTwoGPT4Provider !== undefined) {
                        mainMenuProvider_1.chatTwoGPT4Provider.dispose();
                    }
                    else {
                        (0, mainMenuProvider_1.setNewChatGptProviderTwo)(new chatGpt4Provider_1.ChatGPT4Provider(subscriber, null));
                    }
                    mainMenuProvider_1.chatTwoGPT4Provider.provideChat();
                    vscode.window.showInformationMessage("Do you know you can open as many chat tabs as you want? just click on the ChatGPT4 button");
                }
                if (message.command === "index_page") {
                    const projectPath = (0, fileIndex_1.reverseNormalization)((0, fileIndex_1.getProjectPath)());
                    const indexingProvider = new indexingProvider_1.IndexingProvider([], [], projectPath);
                    indexingProvider.initiateWebview();
                    indexingProvider.getIndexSummary();
                }
                if (message.command === "multi_file_editing") {
                    const subscriber = true ? (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.ADDED_BILLING, "false") === "true" : false;
                    const multFileEditingProvider = new multiFileEditingProvider_1.MultiFileEditingProvider(subscriber);
                    multFileEditingProvider.initiateWebview();
                }
                if (message.command === "settings") {
                    const subscriber = true ? (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.ADDED_BILLING, "false") === "true" : false;
                    const settingProvider = new settingsProvider_1.settingsProvider(subscriber);
                    settingProvider.setUpSettings();
                }
                if (message.command === "help") {
                    const readmePath = path.join((0, extension_1.getExtensionContext)().extensionPath, 'userGuide.md');
                    vscode.commands.executeCommand('markdown.showPreview', vscode.Uri.file(readmePath));
                }
                if (message.command === "go_to_menu") {
                    onChatUi = false;
                    webviewView.webview.html = this.newHtml;
                }
                if (message.command === "chat_with_user") {
                    //globalChatWss.send(JSON.stringify(message.value));
                    api.post("/log_chat_usuage", {
                        "log_type": (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, "anonymous"),
                        "apikey": (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, ""),
                        "question": JSON.stringify(message.value)
                    }).then(response => {
                    });
                }
                if (message.command === "fix_code") {
                    const workspaceEdit = new vscode.WorkspaceEdit();
                    const filePath = message.value["fileName"];
                    const clickedItem = message.value;
                    const uriFromFile = vscode.Uri.file(filePath);
                    const diag = socketListener_1.gptDiagnostics.filter(value => value["funcName"] === clickedItem["funcName"] && value["fileName"] === clickedItem["fileName"])[0];
                    workspaceEdit.replace(uriFromFile, diag.range, diag.fix + "\n", { needsConfirmation: true, label: " sixth" });
                    vscode.workspace.applyEdit(workspaceEdit).then(async (fixed) => { });
                    const document = await vscode.workspace.openTextDocument(uriFromFile);
                    vscode.commands.executeCommand(commands_1.UPDATE_SIDEBAR_DIAGNOSTICS, { gptDiagnostics: socketListener_1.gptDiagnostics, range: diag.range, document: document, collection: extension_1.sixthDiagnostics, code: document.getText(diag.range), acutalFix: diag.fix, funcName: diag.funcName });
                }
                if (message.command === 'choose_gpt_model') {
                    const panel = vscode.window.createWebviewPanel('centeredInput', 'Choose a model', vscode.ViewColumn.Active, // Show in the active editor column
                    {
                        enableScripts: true,
                    });
                    panel.webview.html = (0, authPanel_1.createGptChooserPanel)();
                    panel.webview.onDidReceiveMessage(message => {
                        vscode.window.showInformationMessage("Choosing GPT model...");
                        if (message.command === 'choose_model') {
                            (0, authPanel_2.registerPreferredGPTModel)((0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, ""), message.value["gpt"], (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.JWT, ""), () => {
                                vscode.window.showInformationMessage("Model was chosen");
                                panel.dispose();
                            }, () => {
                                vscode.window.showInformationMessage("Something went wrong");
                            });
                        }
                    });
                }
                else if (message.command === 'update_billing') {
                    // Create and show subscription management panel
                    const panel = vscode.window.createWebviewPanel('subscriptionManager', 'Manage Subscription', vscode.ViewColumn.Active, {
                        enableScripts: true,
                    });
                    // Read the HTML template
                    let html = fs.readFileSync(path.join(__dirname, '..', 'auth', 'subscriptionManager.html'), 'utf-8');
                    // Fill in dynamic values
                    const themeColors = (0, colors_1.getThemeColors)();
                    html = fillTemplate(html, JSON.stringify(themeColors), "THEME_COLORS_JSON");
                    html = fillTemplate(html, (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, "user@example.com"), "USER_EMAIL");
                    html = fillTemplate(html, (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, ""), "USER_API_KEY");
                    // Determine billing cycle - this is a placeholder, you would need to get this from your backend
                    const billingCycle = (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), "BILLING_CYCLE", "month");
                    html = fillTemplate(html, billingCycle, "BILLING_CYCLE");
                    panel.webview.html = html;
                    // Handle messages from the webview
                    panel.webview.onDidReceiveMessage(async (message) => {
                        if (message.command === 'back_to_sidebar') {
                            panel.dispose();
                        }
                        else if (message.command === 'update_payment_method') {
                            // Show billing panel to update payment method
                            const billingPanel = vscode.window.createWebviewPanel('centeredInput', 'Update your billing Info', vscode.ViewColumn.Active, {
                                enableScripts: true,
                            });
                            billingPanel.webview.html = (0, authPanel_1.createBillingPanel)();
                            // Handle billing panel messages
                            billingPanel.webview.onDidReceiveMessage((billingMessage) => {
                                // Existing billing panel message handling...
                            });
                        }
                        else if (message.command === 'change_plan') {
                            // Show plan selection options
                            const selection = await vscode.window.showQuickPick(['Monthly ($9.99/month)', 'Annual ($49.99/year, save 60%)'], {
                                placeHolder: 'Select your new billing plan'
                            });
                            if (selection) {
                                // Handle plan change
                                const plan = selection.startsWith('Monthly') ? 'month' : 'year';
                                vscode.window.showInformationMessage(`Changing to ${plan} plan...`);
                                // Add logic to update the plan
                            }
                        }
                        else if (message.command === 'cancel_subscription') {
                            // Open mailto link
                            vscode.env.openExternal(vscode.Uri.parse(message.value));
                        }
                        else if (message.command === 'open_mail_link') {
                            // Open mailto link
                            vscode.env.openExternal(vscode.Uri.parse(message.value));
                            // Show confirmation message after opening the mail link
                            vscode.window.showInformationMessage("Your message has been created. Once sent, you'll receive a response within 30 mins - 12 hours. Our team typically responds within 24 hours max.");
                        }
                    });
                }
            });
        }
        catch (err) {
            console.error("Error setting up sidebar:", err);
        }
    }
    sendMessage(message) {
        if (this.sideBar) {
            this.sideBar.postMessage(message);
        }
    }
}
exports.ContinueGUIWebviewViewProvider = ContinueGUIWebviewViewProvider;
ContinueGUIWebviewViewProvider.viewType = "nodeDependencies";
function fillTemplate(template, variables, toReplace) {
    // Use a regular expression to find and replace variables in the template
    return template.replace(toReplace, variables);
}
//# sourceMappingURL=treeNode.js.map