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
exports.MultiFileEditingProvider = void 0;
const vscode = __importStar(require("vscode"));
const extension_1 = require("../extension");
const projectUtils_1 = require("../utils/projectUtils");
const fs = __importStar(require("fs"));
const genUtils_1 = require("../utils/genUtils");
const fileIndex_1 = require("../utils/fileIndex");
const socket_1 = require("../utils/socket");
const fileUtils_1 = require("../utils/fileUtils");
const authPanel_1 = require("../auth/authPanel");
const axiosInstance_1 = require("../utils/axiosInstance");
const api = (0, axiosInstance_1.createAxiosInstance)();
class MultiFileEditingProvider {
    constructor(subscriber) {
        this.uploadedFiles = [];
        this.newFilePaths = {};
        this.fileContents = {};
        this.subcriber = false;
        this.lockFileUpdate = false;
        this.currentPath = "";
        this.subcriber = subscriber;
        this.initSocketConnection(subscriber);
    }
    initSocketConnection(subscriber) {
        if (subscriber) {
            this.wss = new socket_1.WebSocketClient(`${genUtils_1.socketBaseUrl}/multi_file_editing`, (connected) => {
                this.webview?.postMessage({
                    command: "onNetworkChanged",
                    value: connected
                });
            });
            this.updateFilesListener();
            this.wss.setMessageCallback((json) => {
                this.lockFileUpdate = true;
                if (json["session_id"] && json["session_id"] !== null && json["session_id"] !== undefined) {
                    this.threadId = json["session_id"];
                }
                if (json['info'] !== null && json['info'] !== undefined) {
                    //console.log(json['info'],"how far nah?");
                    vscode.window.showInformationMessage('The multi-file editing feature is available with the premium plan for just $4.99. Upgrade now to unlock this feature and more!', { modal: true }, // Makes the popup modal
                    'Upgrade' // Option 1
                    ).then(selection => {
                        if (selection === 'Upgrade') {
                            this.showAddCardModal();
                        }
                    });
                }
                if (json["type"] !== null) {
                    // Assign json["file_name"] to a variable
                    let fileName = json["file_name"];
                    // Check if the OS is Windows
                    if (process.platform === "win32") {
                        // If the fileName uses Unix-style paths, normalize it to Windows-style
                        if (fileName.includes("/")) {
                            fileName = fileName.replace(/\//g, "\\");
                        }
                    }
                    if (json["state"] === "COMPLETED" && fileName !== null) {
                        if (this.newFilePaths[fileName] && json["type"] === "UPDATE") {
                            const fileUri = vscode.Uri.file(this.newFilePaths[fileName]);
                            console.log("koyemi mo oh", (0, fileUtils_1.getFileContentSync)(fileUri));
                            (0, fileUtils_1.getFileContentSync)(fileUri).then((result) => {
                                this.fileContents[this.newFilePaths[fileName]] = {
                                    newContent: json["content"],
                                    originalContent: result,
                                    fileType: json["type"]
                                };
                            });
                            (0, fileUtils_1.showInlineDiff)(fileUri, (0, fileUtils_1.cleanCodeSnippet)(json["content"])).then(() => {
                                console.log("diffed oh!");
                            });
                        }
                        else if (this.newFilePaths[fileName] && json["type"] === "WRITE") {
                            console.log("tbh i'm exhausted", this.newFilePaths[fileName], fileName);
                            this.fileContents[this.newFilePaths[fileName]] = {
                                newContent: json["content"],
                                originalContent: null,
                                fileType: json["type"]
                            };
                            (0, fileUtils_1.createFile)(fileName, (0, fileUtils_1.cleanCodeSnippet)(json["content"]), (0, fileUtils_1.removeSubstringIfExists)(this.newFilePaths[fileName], fileName));
                        }
                        else {
                            console.log("tbh i'm famished!", fileName);
                            if (this.newFilePaths[fileName] === null || this.newFilePaths[fileName] === undefined) {
                                console.log("tbh i'm famished!", fileName);
                                (0, fileUtils_1.createFileInWorkspace)(fileName, (0, fileUtils_1.cleanCodeSnippet)(json["content"])).then((filePath) => {
                                    if (filePath !== null) {
                                        console.log("tbh i'm famished again!!!!", filePath);
                                        this.newFilePaths[fileName] = filePath;
                                        console.log("tbh i'm exhausted too", this.newFilePaths[fileName], fileName);
                                        this.fileContents[this.newFilePaths[fileName]] = {
                                            newContent: json["content"],
                                            originalContent: null,
                                            fileType: "WRITE"
                                        };
                                    }
                                    else {
                                        console.error(`couldn't create ${fileName}`);
                                    }
                                });
                                //createFile(fileName, cleanCodeSnippet(json["content"]),removeSubstringIfExists(this.newFilePaths[fileName],fileName));       
                            }
                        }
                    }
                }
                if (json['type'] === 'FILE_UPLOAD_LOG') {
                }
                else {
                    this.webview?.postMessage({
                        command: "fill_text",
                        value: json
                    });
                }
            });
        }
        else {
        }
    }
    dispose() {
        this.panel?.dispose();
    }
    uploadNewContextFile() {
        const fileCount = Object.keys(this.newFilePaths).length - 1;
        console.log("how?", fileCount);
        if (fileCount > 6) {
            vscode.window.showWarningMessage(`You have exceeded the file upload limit. A maximum of 6 files can be uploaded.`);
            return;
        }
        // Open the file selection dialog
        vscode.window.showOpenDialog({
            canSelectFiles: true, // Allow selecting files
            canSelectFolders: false, // Don't allow selecting folders
            canSelectMany: true, // Allow selecting multiple files
        }).then((fileUris) => {
            if (fileUris && fileUris.length > 0) {
                // Handle the selected files
                fileUris.forEach(fileUri => {
                    console.log(`Selected file: ${fileUri.fsPath}`);
                    // Assuming uploadLocalFileAndGetURL returns a promise
                    (0, fileUtils_1.uploadLocalFileAndGetURLV2)(fileUri.fsPath, fileUri.fsPath, (0, fileIndex_1.getProjectPath)()).then((result) => {
                        const fileName = (0, fileUtils_1.getRelativePathFromWorkspace)(fileUri.fsPath); // Get file name from fsPath
                        const apikey = (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, "");
                        const email = (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, "");
                        // Store the uploaded file data
                        this.uploadedFiles.push({ 'url': result, 'file_name': fileName });
                        let fileUploadRequest = { 'file': { 'url': result, 'file_name': fileName }, 'action': 'UPLOAD', 'email': email, 'apikey': apikey };
                        this.wss.sendMessage(JSON.stringify(fileUploadRequest));
                        if (fileName !== undefined && fileName !== null) {
                            this.newFilePaths[fileName] = fileUri.fsPath;
                        }
                        else {
                            vscode.window.showErrorMessage('Error uploading the file has file name is undefined.');
                        }
                        // Post message to webview
                        this.webview?.postMessage({
                            command: "attach_uploaded_file",
                            value: fileName
                        });
                    }).catch((error) => {
                        vscode.window.showErrorMessage(`Error uploading file: ${error.message}`);
                    });
                });
            }
            else {
                vscode.window.showInformationMessage('No files were selected.');
            }
        });
    }
    updateFilesListener() {
        vscode.workspace.onDidChangeTextDocument((event) => {
            const fileName = event.document.fileName;
            const actualFileName = (0, fileUtils_1.getRelativePathFromWorkspace)(fileName);
            console.log(`File changed: ${actualFileName}`);
            if (actualFileName !== null && this.lockFileUpdate === false) {
                console.log("welp");
                if (this.newFilePaths[actualFileName] !== null && this.newFilePaths[actualFileName] !== undefined) {
                    const document = event.document;
                    const updatedContent = document.getText();
                    //console.log("welp welp",this.fileContents[this.newFilePaths[actualFileName]].newContent);
                    const newContent = (0, fileUtils_1.cleanCodeSnippet)(this.fileContents[this.newFilePaths[actualFileName]].newContent);
                    //console.log("let's see the two files",newContent,updatedContent);
                    if (updatedContent.trim() !== newContent.trim()) {
                        //console.log("welp welp welp")
                        this.wss.sendMessage(JSON.stringify({ 'action': 'UPDATE_FILE', 'file_name': actualFileName, 'content': updatedContent }));
                    }
                }
            }
        });
    }
    getLastPartOfPath(path) {
        if (typeof path !== "string") {
            throw new Error("Invalid path. Expected a string.");
        }
        // Split the path by the "/" character and get the last segment
        const parts = path.split('/');
        return parts[parts.length - 1] || '';
    }
    async setNewFilePath() {
        const folderUri = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            openLabel: 'Select Folder',
        });
        // If the user cancels the folder selection, return an empty object
        if (!folderUri || folderUri.length === 0) {
            vscode.window.showErrorMessage('No folder selected.');
            return;
        }
        const selectedFolder = folderUri[0].fsPath;
        this.currentPath = selectedFolder;
        this.webview?.postMessage({
            command: 'reflect_upload',
            value: this.getLastPartOfPath(folderUri[0].fsPath)
        });
    }
    mapFilenameToFilePath(fileName) {
        this.newFilePaths[fileName] = this.currentPath;
    }
    updateWebsocketToStandard() {
        try {
            this.webview?.postMessage({
                command: "update_tier",
                value: "standard"
            });
            this.wss = new socket_1.WebSocketClient(`${genUtils_1.socketBaseUrl}/multi_file_editing`, (connected) => {
                this.webview?.postMessage({
                    command: "onNetworkChanged",
                    value: connected
                });
            });
            this.wss.setMessageCallback((json) => {
                if (json["session_id"] && json["session_id"] !== null && json["session_id"] !== undefined) {
                    this.threadId = json["session_id"];
                }
                if (json["type"] !== null) {
                    // Assign json["file_name"] to a variable
                    let fileName = json["file_name"];
                    // Check if the OS is Windows
                    if (process.platform === "win32") {
                        // If the fileName uses Unix-style paths, normalize it to Windows-style
                        if (fileName.includes("/")) {
                            fileName = fileName.replace(/\//g, "\\");
                        }
                    }
                    if (json["state"] === "COMPLETED" && fileName !== null) {
                        if (this.newFilePaths[fileName] && json["type"] === "UPDATE") {
                            const fileUri = vscode.Uri.file(this.newFilePaths[fileName]);
                            console.log("koyemi mo oh", (0, fileUtils_1.getFileContentSync)(fileUri));
                            (0, fileUtils_1.getFileContentSync)(fileUri).then((result) => {
                                this.fileContents[this.newFilePaths[fileName]] = {
                                    newContent: json["content"],
                                    originalContent: result,
                                    fileType: json["type"]
                                };
                            });
                            (0, fileUtils_1.showInlineDiff)(fileUri, (0, fileUtils_1.cleanCodeSnippet)(json["content"])).then(() => {
                                console.log("diffed oh!");
                            });
                        }
                        else if (this.newFilePaths[fileName] && json["type"] === "WRITE") {
                            console.log("tbh i'm exhausted", this.newFilePaths[fileName], fileName);
                            this.fileContents[this.newFilePaths[fileName]] = {
                                newContent: json["content"],
                                originalContent: null,
                                fileType: json["type"]
                            };
                            console.log(`let's see the possible issue:${(0, fileUtils_1.removeSubstringIfExists)(this.newFilePaths[fileName], fileName)},${fileName}`);
                            (0, fileUtils_1.createFile)(fileName, (0, fileUtils_1.cleanCodeSnippet)(json["content"]), (0, fileUtils_1.removeSubstringIfExists)(this.newFilePaths[fileName], fileName));
                        }
                        else {
                            if (this.newFilePaths[fileName] === null) {
                                (0, fileUtils_1.createFileInWorkspace)(fileName, (0, fileUtils_1.cleanCodeSnippet)(json["content"])).then((filePath) => {
                                    if (filePath !== null) {
                                        this.newFilePaths[fileName] = filePath;
                                        console.log("tbh i'm exhausted too", this.newFilePaths[fileName], fileName);
                                        this.fileContents[this.newFilePaths[fileName]] = {
                                            newContent: json["content"],
                                            originalContent: null,
                                            fileType: "WRITE"
                                        };
                                    }
                                    else {
                                        console.error(`couldn't create ${fileName}`);
                                    }
                                });
                                //createFile(fileName, cleanCodeSnippet(json["content"]),removeSubstringIfExists(this.newFilePaths[fileName],fileName));       
                            }
                        }
                    }
                }
                this.webview?.postMessage({
                    command: "fill_text",
                    value: json
                });
            });
        }
        catch (e) {
        }
    }
    initiateWebview() {
        this.panel = vscode.window.createWebviewPanel('centeredInput', 'Multi File Editing', vscode.ViewColumn.Beside, // Show in the active editor column
        {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        this.webview = this.panel.webview;
        (0, extension_1.setCurrentWebviewTab)(this.panel);
        (0, extension_1.setCurrentWebviewTabDisposed)(false);
        this.panel.onDidDispose(() => {
            // Panel has been disposed
            console.log("hope MLE is disposed?");
            (0, extension_1.setCurrentWebviewTabDisposed)(true);
            this.wss.forceClose();
        });
        var html = fs.readFileSync(__dirname + "/multi_file_editing.html", 'utf-8');
        //html = fillTemplate(html, this.workspace ? this.workspace : 'empty' , "REPLACE_THIS");
        this.webview.html = html;
        this.webview.onDidReceiveMessage(async (message) => {
            if (message.command === "log_event") {
                console.log("log_event called ", message.value);
            }
            if (message.command === "upload_file") {
                this.uploadNewContextFile();
            }
            if (message.command === "remove_file") {
                delete this.newFilePaths[message.value];
            }
            if (message.command === "select_folder") {
                this.setNewFilePath();
            }
            if (message.command === "update_new_file") {
                console.log("fucking updated!", message.value);
                this.mapFilenameToFilePath(message.value);
            }
            if (message.command === "send_message") {
                let directoryUri;
                let projectTree = '';
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (workspaceFolders && workspaceFolders.length > 0) {
                    directoryUri = workspaceFolders[0].uri; // Root of the workspace
                }
                if (directoryUri !== undefined) {
                    projectTree = (0, fileUtils_1.generateProjectTree)(directoryUri.fsPath);
                }
                else {
                    projectTree = '';
                }
                let ContextString = `
                    project structure: ${projectTree}
                    existing files: 
                    ${Object.keys(this.newFilePaths).join('\n')}
                `;
                var data = message.value;
                data["apikey"] = (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, "");
                data["email"] = (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, "");
                data["attachments"] = this.uploadedFiles;
                //data["user_prompt"]=data["user_prompt"];
                data['context_string'] = ContextString;
                this.wss.sendMessage(JSON.stringify(data));
            }
            if (message.command === 'show_file') {
                let data = message.value;
                if (data["type"] === 'UPDATE') {
                    const filePath = this.newFilePaths[data['file_name']];
                    if (filePath === null) {
                        vscode.window.showErrorMessage(`file ${data['file_name']} doesn't exist`);
                    }
                    else {
                        const fileUri = vscode.Uri.file(filePath);
                        try {
                            (0, fileUtils_1.showInlineDiff)(fileUri, (0, fileUtils_1.cleanCodeSnippet)(this.fileContents[filePath].newContent));
                            /*vscode.workspace.openTextDocument(fileUri).then((document)=>{
                                vscode.window.showTextDocument(document);
                            });*/
                        }
                        catch (error) {
                            if (error instanceof Error) {
                                vscode.window.showErrorMessage(`Failed to open the file: ${error.message}`);
                            }
                            else {
                                vscode.window.showErrorMessage('An unknown error occurred while trying to open the file.');
                            }
                        }
                    }
                }
                else if (data["type"] === 'WRITE') {
                    const filePath = this.newFilePaths[data['file_name']];
                    try {
                        console.log(filePath);
                        const fileUri = vscode.Uri.file(filePath);
                        vscode.workspace.openTextDocument(fileUri).then((document) => {
                            vscode.window.showTextDocument(document);
                        });
                    }
                    catch (error) {
                        if (error instanceof Error) {
                            vscode.window.showErrorMessage(`Failed to open the file: ${error.message}`);
                        }
                        else {
                            vscode.window.showErrorMessage('An unknown error occurred while trying to open the file.');
                        }
                    }
                }
            }
            if (message.command === 'accept_all') {
                for (const key in this.newFilePaths) {
                    if (this.newFilePaths.hasOwnProperty(key)) { // Ensure the key is not from the prototype chain
                        try {
                            const value = this.newFilePaths[key];
                            const fileUri = vscode.Uri.file(value);
                            console.log("let's expose the werey file", this.fileContents[value].newContent);
                            if (this.fileContents[value].newContent.length > 0) {
                                (0, fileUtils_1.applyChanges)(fileUri, (0, fileUtils_1.cleanCodeSnippet)(this.fileContents[value].newContent));
                            }
                            this.fileContents[value].newContent = '';
                        }
                        catch (error) {
                            if (error instanceof Error) {
                                console.error("File that refused to accept changes:", error.message);
                            }
                            else {
                                console.log('An unknown error occurred while trying to apply changes to the file.');
                            }
                        }
                    }
                }
                this.lockFileUpdate = false;
            }
            if (message.command === 'reject_all') {
                for (const key in this.newFilePaths) {
                    if (this.newFilePaths.hasOwnProperty(key)) { // Ensure the key is not from the prototype chain
                        try {
                            const value = this.newFilePaths[key];
                            const fileUri = vscode.Uri.file(value);
                            if (this.fileContents[value].originalContent === null) {
                                if (this.fileContents[value].fileType === 'WRITE') {
                                    (0, fileUtils_1.deleteFile)(value);
                                }
                            }
                            else {
                                (0, fileUtils_1.rejectChanges)(fileUri, this.fileContents[value].originalContent);
                                this.fileContents[value].newContent = '';
                            }
                        }
                        catch (error) {
                            console.error("File that refused to reject changes:", this.fileContents);
                            if (error instanceof Error) {
                                vscode.window.showErrorMessage(`Failed to reject changes for the file: ${error.message}`);
                            }
                            else {
                                vscode.window.showErrorMessage('An unknown error occurred while trying to reject changes for the file.');
                            }
                        }
                    }
                }
                this.lockFileUpdate = false;
            }
        });
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
                                this.subcriber = true;
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
}
exports.MultiFileEditingProvider = MultiFileEditingProvider;
//# sourceMappingURL=multiFileEditingProvider.js.map