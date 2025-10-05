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
exports.settingsProvider = void 0;
const vscode = __importStar(require("vscode"));
const extension_1 = require("../extension");
const projectUtils_1 = require("../utils/projectUtils");
const fs = __importStar(require("fs"));
const genUtils_1 = require("../utils/genUtils");
const fileIndex_1 = require("../utils/fileIndex");
const indexingProvider_1 = require("../indexing/indexingProvider");
const axiosInstance_1 = require("../utils/axiosInstance");
const api = (0, axiosInstance_1.createAxiosInstance)();
const path_1 = __importDefault(require("path"));
var html = '';
class settingsProvider {
    constructor(subscriber) {
        this.subscriber = false;
        this.subscriber = subscriber;
    }
    setNewWebview(command) {
        switch (command) {
            case 'general':
                html = fs.readFileSync(__dirname + "/general.html", 'utf-8');
                break;
            case 'features':
                html = fs.readFileSync(__dirname + "/features/features.html", 'utf-8');
                break;
            case 'codebase_indexing':
                const projectPath = (0, fileIndex_1.reverseNormalization)((0, fileIndex_1.getProjectPath)());
                const indexingProvider = new indexingProvider_1.IndexingProvider([], [], projectPath);
                indexingProvider.initiateWebview();
                indexingProvider.getIndexSummary();
                this.panel?.dispose();
                break;
            case 'chat':
                html = fs.readFileSync(__dirname + "/features/chat.html", 'utf-8');
                break;
            case 'back':
                html = fs.readFileSync(__dirname + "/index.html", 'utf-8');
                break;
            case 'help_guide':
                const readmePath = path_1.default.join((0, extension_1.getExtensionContext)().extensionPath, 'userGuide.md');
                vscode.commands.executeCommand('markdown.showPreview', vscode.Uri.file(readmePath));
        }
        if (this.webview !== undefined) {
            this.webview.html = html;
            this.webview.postMessage({
                command: 'LOAD_EMAIL',
                value: (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, '')
            });
            this.webview.postMessage({
                command: 'LOAD_SUBSCRIBER',
                value: this.subscriber
            });
            this.webview.postMessage({
                command: 'LOAD_AUTO_OPEN_MAIN_MENU',
                value: (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.AUTO_OPEN_MAIN_MENU, true)
            });
            if (command === 'chat') {
                api.get(`/get_full_context?user_id=${(0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, '')}`)
                    .then(response => {
                    this.webview?.postMessage({
                        command: 'CONTEXT_OPTIONS',
                        value: response.data
                    });
                    (0, extension_1.setExternalContextCurrentData)(response.data);
                    const defaultContextOption = (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.DEFAULT_CONTEXT, null);
                    if (defaultContextOption !== null) {
                        this.webview?.postMessage({
                            command: 'LOAD_DEFAULT_OPTION',
                            value: defaultContextOption
                        });
                    }
                })
                    .catch(error => {
                    console.error('Error fetching full context:', error);
                });
            }
        }
    }
    setUpSettings() {
        this.panel = vscode.window.createWebviewPanel('centeredInput', 'Settings', vscode.ViewColumn.Beside, // Show in the active editor column
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
        html = fs.readFileSync(__dirname + "/index.html", 'utf-8');
        this.webview.html = html;
        this.webview.postMessage({
            command: 'LOAD_EMAIL',
            value: (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, '')
        });
        this.webview.postMessage({
            command: 'LOAD_SUBSCRIBER',
            value: this.subscriber
        });
        this.webview.postMessage({
            command: 'LOAD_AUTO_OPEN_MAIN_MENU',
            value: (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.AUTO_OPEN_MAIN_MENU, true)
        });
        this.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'UpdateHTML') {
                this.setNewWebview(message.value);
            }
            if (message.command === 'upgrade') {
                this.createPaywallScreen();
            }
            if (message.command === 'setMainMenuOnLoad') {
                (0, projectUtils_1.saveDataToCache)((0, extension_1.getExtensionContext)(), projectUtils_1.AUTO_OPEN_MAIN_MENU, message.value);
                console.log(`main menu auto open was changed to ${message.value}`);
            }
            if (message.command === 'SEND_PROFILE_EDIT_DATA') {
                const email = message.value.email;
                try {
                    const response = await api.patch('https://backend.withsix.co/auth/update_user_email', {
                        "new_email": email,
                        "old_email": (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, '')
                    });
                    (0, projectUtils_1.saveDataToCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, email);
                    vscode.window.showInformationMessage('Email updated successfully!');
                }
                catch (error) {
                    console.log(`${error}email:${email}`);
                    vscode.window.showErrorMessage('Failed to update email. Please try again.');
                }
            }
            if (message.command === 'SEND_NEW_CONTEXT') {
                const userId = (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, '');
                const baseHttpUrl = genUtils_1.httpBaseUrl;
                if (message.value.type === 'doc') {
                    const { prefix: docPrefix, name: docName } = message.value;
                    try {
                        await api.post(`${baseHttpUrl}/index_web_content`, {
                            user_id: userId,
                            base_url: docPrefix,
                            name: docName
                        });
                        vscode.window.showInformationMessage('Indexing the document context. This process may take some time to complete. Please be patient.');
                    }
                    catch (error) {
                        console.error(`Failed to index document context: ${error}`);
                        vscode.window.showErrorMessage('Failed to index document context. Please try again.');
                    }
                }
                else if (message.value.type === 'github') {
                    const { github_url: github_url, branch: branch } = message.value;
                    try {
                        await api.post(`${baseHttpUrl}/index_github_content`, {
                            github_url: github_url,
                            branch: branch,
                            user_id: userId
                        });
                        vscode.window.showInformationMessage('Indexing the Github context. This process may take some time to complete. Please be patient.');
                    }
                    catch (error) {
                        console.error(`Failed to index GitHub context: ${error}`);
                        vscode.window.showErrorMessage('Failed to index GitHub context. Please try again.');
                    }
                }
            }
            if (message.command === 'EDIT_CONTEXT') {
                const contextData = message.value;
                if (contextData.type === 'doc') {
                    let postData = { 'user_id': (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, ''), 'newName': contextData.name, 'name': contextData.originalDocName, 'updated_data': { 'link': contextData.prefix } };
                    console.log('Edit Doc Context:', postData);
                    try {
                        await api.patch(`/update_context`, postData);
                        const newResponse = await api.get(`/get_full_context?user_id=${(0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, '')}`);
                        vscode.window.showInformationMessage('Doc context edited successfully!');
                        this.webview?.postMessage({
                            command: 'CONTEXT_OPTIONS',
                            value: newResponse.data
                        });
                    }
                    catch (error) {
                        console.error(`Failed to edit docs context: ${error}`);
                        vscode.window.showErrorMessage('Failed to update doc context. Please try again.');
                    }
                    // ... do something with the edited doc context ...
                }
                else if (contextData.type === 'github') {
                    console.log('Edit Github Context:', contextData.repo, contextData.account);
                    // ... do something with the edited github context ...
                }
            }
            if (message.command === 'DELETE_CONTEXT') {
                const key = message.value.key;
                const contextData = message.value.data;
                console.log("Delete context", key, contextData);
                try {
                    await api.delete(`/delete_context?user_id=${(0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, '')}&name=${key}`);
                    vscode.window.showInformationMessage('External context deleted successfully!');
                }
                catch (error) {
                    console.error(`Failed to delete docs context: ${error}`);
                    vscode.window.showErrorMessage('Failed to deleted external context. Please try again.');
                }
            }
            if (message.command === 'SELECT_CONTEXT_OPTION') {
                const defaultContextData = message.value;
                console.log("let's see default bro", defaultContextData);
                (0, projectUtils_1.saveDataToCache)((0, extension_1.getExtensionContext)(), projectUtils_1.DEFAULT_CONTEXT, defaultContextData.key);
                (0, projectUtils_1.saveDataToCache)((0, extension_1.getExtensionContext)(), projectUtils_1.DEFAULT_VECTOR_STORE_ID, defaultContextData.vector_store_id);
            }
        });
    }
    createPaywallScreen() {
        if (this.webview)
            this.webview.html = fs.readFileSync(__dirname + "/paywall.html", 'utf-8');
    }
}
exports.settingsProvider = settingsProvider;
//# sourceMappingURL=settingsProvider.js.map