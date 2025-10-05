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
exports.mainMenuProvider = exports.chatTwoGPT4Provider = void 0;
exports.setNewChatGptProviderTwo = setNewChatGptProviderTwo;
const vscode = __importStar(require("vscode"));
const extension_1 = require("../extension");
const projectUtils_1 = require("../utils/projectUtils");
const fs = __importStar(require("fs"));
const treeNode_1 = require("../sidebars/treeNode");
const authPanel_1 = require("../auth/authPanel");
const genUtils_1 = require("../utils/genUtils");
const chatGpt4Provider_1 = require("../chatGPT4/chatGpt4Provider");
const fileIndex_1 = require("../utils/fileIndex");
const indexingProvider_1 = require("../indexing/indexingProvider");
const multiFileEditingProvider_1 = require("../multi_file_editing/multiFileEditingProvider");
const documentSync_1 = require("../documents/documentSync");
const network_1 = require("../utils/network");
const settingsProvider_1 = require("../settings/settingsProvider");
const path_1 = __importDefault(require("path"));
const colors_1 = require("../utils/colors");
const colors_2 = require("../utils/colors");
const glydeProvider_1 = require("../glyde/glydeProvider");
const axiosInstance_1 = require("../utils/axiosInstance");
const api = (0, axiosInstance_1.createAxiosInstance)();
function setNewChatGptProviderTwo(provider) {
    exports.chatTwoGPT4Provider = provider;
}
class mainMenuProvider {
    constructor(subscriber) {
        this.subscriber = false;
        this.subscriber = subscriber;
    }
    initWebview() {
        const iconPath = vscode.Uri.joinPath((0, extension_1.getExtensionContext)().extensionUri, 'resources/sixthLogo.png');
        this.panel = vscode.window.createWebviewPanel('centeredInput', 'Main Menu', vscode.ViewColumn.Active, // Show in the active editor column
        {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        this.webview = this.panel.webview;
        (0, extension_1.setCurrentWebviewTab)(this.panel);
        (0, extension_1.setCurrentWebviewTabDisposed)(false);
        this.panel.onDidDispose(() => {
            // Panel has been disposed
            (0, extension_1.setCurrentWebviewTabDisposed)(true);
        });
        this.panel.iconPath = iconPath;
        const themeColors = (0, colors_2.getThemeColors)();
        let html = fs.readFileSync(path_1.default.join((0, extension_1.getExtensionContext)().extensionPath, 'src', 'mainMenu', 'mainMenu.html'), 'utf8');
        const themeName = (0, colors_1.getThemeName)();
        if (themeName !== "Visual Studio Dark" && themeName !== "Default Dark Modern" && themeName !== "Default Dark+") {
            html = (0, treeNode_1.fillTemplate)(html, JSON.stringify(themeColors), "THEME_COLORS_JSON");
        }
        else {
        }
        this.webview.html = html;
        const logoPath = vscode.Uri.joinPath((0, extension_1.getExtensionContext)().extensionUri, 'resources', 'sixthLogo.png');
        if (this.webview) {
            const logoUri = this.webview.asWebviewUri(logoPath);
            this.webview?.postMessage({
                command: 'add_logo',
                value: logoUri.toString()
            });
        }
        this.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'clicked') {
                if (message.value === "user_guide") {
                    const readmePath = path_1.default.join((0, extension_1.getExtensionContext)().extensionPath, 'userGuide.md');
                    vscode.commands.executeCommand('markdown.showPreview', vscode.Uri.file(readmePath));
                }
                if (message.value === 'glyde') {
                    if ((0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), "GLYDE_APIKEY", undefined) === undefined || (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), "GLYDE_APIKEY", undefined) === null || (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), "GLYDE_APIKEY", undefined) === "") {
                        vscode.window.showInformationMessage("Loading Glyde into VS Code...");
                        (0, authPanel_1.demoAccountGlydeTester)((worked) => {
                            if (worked) {
                                const glydeProvider = new glydeProvider_1.GlydeProvider((0, extension_1.getExtensionContext)());
                                glydeProvider.provideGlydeView();
                            }
                            else {
                                vscode.window.showInformationMessage("Something went wrong");
                            }
                        });
                    }
                    else {
                        const glydeProvider = new glydeProvider_1.GlydeProvider((0, extension_1.getExtensionContext)());
                        glydeProvider.provideGlydeView();
                    }
                    this.panel?.dispose();
                    return;
                }
                var subscriber = (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.ADDED_BILLING, "");
                if (typeof subscriber === "string")
                    subscriber = subscriber.toLowerCase() === "true";
                console.log("NEWWW ADEDDE BILLINGNNG GG", subscriber, typeof subscriber);
                if (!subscriber) {
                    this.webview?.postMessage({
                        command: "bill_user",
                        value: ''
                    });
                }
                else {
                    console.log("BILL USERRRR WASNOT NOT NOT CALLEDDDDDD ", (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.ADDED_BILLING, ""));
                    switch (message.value) {
                        case 'chat':
                            exports.chatTwoGPT4Provider = new chatGpt4Provider_1.ChatGPT4Provider((0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.ADDED_BILLING, ""), null);
                            exports.chatTwoGPT4Provider.provideChat();
                            (0, documentSync_1.codeHighlightedListener)((0, extension_1.getExtensionContext)(), (code) => {
                                exports.chatTwoGPT4Provider.setHighlightedCode(code);
                            });
                            //indexAllFiles();
                            this.panel?.dispose();
                            break;
                        case 'multi_file_editing':
                            const multFileEditingProvider = new multiFileEditingProvider_1.MultiFileEditingProvider((0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.ADDED_BILLING, ""));
                            multFileEditingProvider.initiateWebview();
                            this.panel?.dispose();
                            break;
                        case 'code_indexing':
                            const projectPath = (0, fileIndex_1.reverseNormalization)((0, fileIndex_1.getProjectPath)());
                            const indexingProvider = new indexingProvider_1.IndexingProvider([], [], projectPath);
                            indexingProvider.initiateWebview();
                            indexingProvider.getIndexSummary();
                            this.panel?.dispose();
                            break;
                        case 'LOAD_SETTINGS':
                            console.log("running oh too");
                            const settingProvider = new settingsProvider_1.settingsProvider(this.subscriber ? true : false);
                            settingProvider.setUpSettings();
                            this.panel?.dispose();
                            break;
                    }
                }
            }
            if (message.command === 'upgrade') {
                this.createPaywallScreen();
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
            if (message.command === "check_sub_info") {
                vscode.window.showInformationMessage("Checking subscription info, please wait...");
                (0, network_1.getUserSubscriberInfo)((info) => {
                    (0, projectUtils_1.saveDataToCache)((0, extension_1.getExtensionContext)(), projectUtils_1.ADDED_BILLING, info);
                    if (info) {
                        if (this.webview)
                            this.webview.html = fs.readFileSync(__dirname + "/mainMenu.html", 'utf-8');
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
    dispose() {
        this.panel?.dispose();
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
                        api.post(`${genUtils_1.httpBaseUrl}/notiy_me_of_yearly_plan`, {
                            email: (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, ""),
                            user_id: (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, "")
                        }).then((response) => {
                            if (response.status === 200 || response.status === 201) {
                                this.subscriber = true;
                            }
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
    createPaywallScreen() {
        if (this.webview)
            this.webview.html = fs.readFileSync(__dirname + "/paywall.html", 'utf-8');
    }
}
exports.mainMenuProvider = mainMenuProvider;
//# sourceMappingURL=mainMenuProvider.js.map