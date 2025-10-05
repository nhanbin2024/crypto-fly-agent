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
exports.indexAllFiles = indexAllFiles;
exports.IndexWorkspaceFiles = IndexWorkspaceFiles;
exports.getProjectPath = getProjectPath;
exports.extractFileNameFromPath = extractFileNameFromPath;
exports.reverseNormalization = reverseNormalization;
exports.normalization = normalization;
const axios_1 = __importDefault(require("axios"));
const fileUtils_1 = require("./fileUtils");
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const projectUtils_1 = require("./projectUtils");
const extension_1 = require("../extension");
const genUtils_1 = require("./genUtils");
const mainMenuProvider_1 = require("../mainMenu/mainMenuProvider");
const axiosInstance_1 = require("../utils/axiosInstance");
const api = (0, axiosInstance_1.createAxiosInstance)();
const ignore_1 = __importDefault(require("ignore"));
const supportedFiles = [".c", ".cpp", ".css", ".csv", ".docx", ".html", ".java", ".js", ".json", ".md", ".pdf", ".php", ".png", ".pptx", ".py", ".rb", ".tex", ".ts", ".txt", ".xlsx", ".xml"];
let statusBarItem;
var fileChanged = false;
var indexDocument;
async function indexAllFiles() {
    //i need old users to be able index their projects again
    if (!(0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), "fileUploadV2", false)) {
        (0, projectUtils_1.saveDataToCache)((0, extension_1.getExtensionContext)(), getProjectPath(), false);
    }
    if (!(0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), getProjectPath(), false)) {
        mainMenuProvider_1.chatTwoGPT4Provider.setWorkingFile("true", true);
        const workspaceFolders = vscode.workspace.workspaceFolders;
        let allFiles = [];
        var final = [];
        var body = {
            user_id: (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, ""),
            files: [],
            project_path: getProjectPath()
        };
        if (workspaceFolders) {
            workspaceFolders.forEach(folder => {
                const folderPath = folder.uri.fsPath;
                allFiles = allFiles.concat(getAllFilesInDirectory(folderPath));
                final = allFiles;
            });
            const newLines = (0, fileUtils_1.readLinesFromFile)(__dirname + "/sixth_ignore.txt");
            final = filterOutSubstringItems(allFiles, newLines);
            var allfilesLinks = [];
            var batch = Math.floor(final.length / 10);
            var remainder = final.length % 10;
            for (let i = 0; i < batch; i++) {
                for (let j = 0; j < 10; j++) {
                    var index = (i * 10) + j;
                    var filepath = await (0, fileUtils_1.uploadLocalFileAndGetURLV2)(final[index], final[index], getProjectPath());
                    if (final[index] !== undefined) {
                        if (final[index] !== null) {
                            allfilesLinks.push({
                                file_link: filepath,
                                file_name: normalizePathForWindowsStyle(final[index])
                            });
                        }
                    }
                }
                uploadFileBatch(allfilesLinks);
                allfilesLinks = [];
            }
            if (remainder > 0) {
                var start = batch * 10;
                for (let i = start; i < final.length - 1; i++) {
                    var index = (i * 10) + i;
                    var filepath = await (0, fileUtils_1.uploadLocalFileAndGetURLV2)(final[index], final[index], getProjectPath());
                    //console.log("let's see the path sef",final[index]);
                    if (final[index] !== undefined) {
                        if (final[index] !== null) {
                            allfilesLinks.push({
                                file_link: filepath,
                                file_name: normalizePathForWindowsStyle(final[index])
                            });
                        }
                    }
                }
                uploadFileBatch(allfilesLinks);
            }
            (0, projectUtils_1.saveDataToCache)((0, extension_1.getExtensionContext)(), getProjectPath(), true);
            (0, projectUtils_1.saveDataToCache)((0, extension_1.getExtensionContext)(), "fileUploadV2", true);
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                const document = activeEditor.document.fileName;
                mainMenuProvider_1.chatTwoGPT4Provider.setWorkingFile(extractFileNameFromPath(document), false);
            }
        }
    }
    createIndexListener();
}
async function IndexWorkspaceFiles(workspaceName) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    let allFiles = [];
    let final = [];
    if (workspaceFolders) {
        const targetWorkspace = workspaceFolders.find(folder => folder.uri.fsPath === normalizePathForUnixStyle(workspaceName));
        if (targetWorkspace) {
            // First, collect all .gitignore patterns from workspace
            const gitignorePatterns = [];
            const findGitignores = (dir) => {
                const gitignorePath = path.join(dir, '.gitignore');
                if (fs.existsSync(gitignorePath)) {
                    const content = fs.readFileSync(gitignorePath, 'utf-8');
                    gitignorePatterns.push(...content
                        .split('\n')
                        .filter(line => line.trim() && !line.startsWith('#')));
                }
                // Check subdirectories
                fs.readdirSync(dir).forEach(item => {
                    const fullPath = path.join(dir, item);
                    if (fs.statSync(fullPath).isDirectory()) {
                        findGitignores(fullPath);
                    }
                });
            };
            // Find all .gitignore files
            findGitignores(targetWorkspace.uri.fsPath);
            // Create ignore instance
            const ig = (0, ignore_1.default)().add(gitignorePatterns);
            // Get all files and filter by gitignore
            allFiles = getAllFilesInDirectory(targetWorkspace.uri.fsPath);
            final = allFiles.filter(file => {
                const relativePath = path.relative(targetWorkspace.uri.fsPath, file);
                return !ig.ignores(relativePath);
            });
            console.log("final files after filtering", final);
            // Process files in batches
            let allFilesLinks = [];
            let batch = Math.floor(final.length / 10);
            let remainder = final.length % 10;
            // Process batches
            for (let i = 0; i < batch; i++) {
                for (let j = 0; j < 10; j++) {
                    const index = (i * 10) + j;
                    const filePath = await (0, fileUtils_1.uploadLocalFileAndGetURLV2)(final[index], final[index], getProjectPath());
                    if (final[index]) {
                        allFilesLinks.push({
                            file_link: filePath,
                            file_name: normalizePathForWindowsStyle(final[index])
                        });
                    }
                }
                uploadFileBatch(allFilesLinks, workspaceName, final.length);
                allFilesLinks = [];
            }
            // Handle remaining files
            if (remainder > 0) {
                const start = batch * 10;
                for (let i = start; i < final.length; i++) {
                    const filePath = await (0, fileUtils_1.uploadLocalFileAndGetURLV2)(final[i], final[i], getProjectPath());
                    if (final[i]) {
                        allFilesLinks.push({
                            file_link: filePath,
                            file_name: normalizePathForWindowsStyle(final[i])
                        });
                    }
                }
                uploadFileBatch(allFilesLinks, workspaceName, final.length);
            }
        }
    }
    try {
        createIndexListener();
    }
    catch (err) {
        console.log(`couldn't update current file's index:${err}`);
    }
}
function uploadFileBatch(files, projectPath = null, fullFileListLength = null) {
    console.log("index Workspace files APIII!!!!", files);
    axios_1.default.post(`${genUtils_1.httpBaseUrl}/index-v3`, {
        user_id: (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, ""),
        project_path: projectPath === null ? normalizePathForWindowsStyle(getProjectPath()) : projectPath,
        files: files,
        total_number_of_files: fullFileListLength === null ? 10 : fullFileListLength
    });
}
function createIndexListener() {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        const document = activeEditor.document.fileName;
        mainMenuProvider_1.chatTwoGPT4Provider.setWorkingFile(extractFileNameFromPath(document), false);
    }
    vscode.workspace.onDidChangeTextDocument((event) => {
        fileChanged = true;
        indexDocument = event.document;
    });
    vscode.workspace.onDidOpenTextDocument((event) => {
        console.log("This guy opened a new file which is ", event.fileName);
        mainMenuProvider_1.chatTwoGPT4Provider.setWorkingFile(extractFileNameFromPath(event.fileName), false);
    });
    //Index OpenAI's knowledge once every 30 seconds only if a file was changed
    setInterval(async () => {
        if (indexDocument !== undefined || indexDocument !== null) {
            if (fileChanged) {
                console.log("I Just upaded this guy");
                var file_link = await (0, fileUtils_1.uploadLocalFileAndGetURLV2)(indexDocument.fileName, indexDocument.fileName, getProjectPath());
                var file = {
                    "file_link": file_link,
                    "file_name": normalizePathForWindowsStyle(indexDocument.fileName)
                };
                console.log("FIle Json is ", {
                    "user_id": (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, ""),
                    "file": file,
                    "project_path": normalizePathForWindowsStyle(getProjectPath())
                });
                api.patch("/update_file_v2", {
                    "user_id": (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, ""),
                    "file": file,
                    "project_path": normalizePathForWindowsStyle(getProjectPath())
                }).then(response => {
                });
            }
        }
        fileChanged = false;
    }, 30000);
}
function getProjectPath() {
    try {
        if (vscode.workspace.workspaceFolders) {
            const projectUri = vscode.workspace.workspaceFolders[0].uri;
            // Convert URI to path
            const projectPath = projectUri.fsPath;
            return projectPath;
        }
    }
    catch (e) {
        return "not_found";
    }
    return "not_found";
}
function extractFileNameFromPath(filePath) {
    // Split the filePath by the directory separator (e.g., '/' on Unix-like systems)
    const pathSegments = filePath.split('/');
    // Get the last segment of the path, which represents the file name
    const fileNameWithExtension = pathSegments[pathSegments.length - 2] + "/" + pathSegments[pathSegments.length - 1];
    return fileNameWithExtension;
}
function filterOutSubstringItems(a, b) {
    const fileSizeLimit = 512000;
    // Create a set of all substrings present in array b
    const substringsSet = new Set();
    for (const item of b) {
        substringsSet.add(item);
    }
    // Filter array a to remove items that contain any substring from array b
    const filteredA = a.filter(itemA => {
        for (const substring of substringsSet) {
            if (itemA.trim().includes(substring.trim())) {
                return false; // Exclude itemA if it contains any substring from b
            }
        }
        for (const allowed of supportedFiles) {
            if (itemA.trim().endsWith(allowed.trim())) {
                var stats = fs.statSync(itemA);
                const fileSizeInBytes = stats.size;
                if (itemA.includes(".png")) {
                    return false;
                }
                if (fileSizeInBytes > fileSizeLimit) {
                    // Perform actions based on exceeding file size limit
                }
                else {
                    return true;
                    // Perform actions for acceptable file size
                }
                return true;
            }
        }
        return false; // Include itemA if it doesn't contain any substring from b
    });
    return filteredA;
}
function getAllFilesInDirectory(dirPath) {
    let files = [];
    // Read contents of the directory
    try {
        const entries = fs.readdirSync(dirPath);
        entries.forEach(entry => {
            const entryPath = path.join(dirPath, entry);
            const entryStat = fs.statSync(entryPath);
            if (entryStat.isDirectory()) {
                // Recursively get files in subdirectory
                try {
                    files = files.concat(getAllFilesInDirectory(entryPath));
                }
                catch (e) {
                }
            }
            else {
                // Add file path to the list
                files.push(entryPath);
            }
        });
    }
    catch (e) {
    }
    return files;
}
function normalizePathForWindowsStyle(path) {
    try {
        if (os.platform() === 'win32') {
            // Return the path as it is for Windows
            return path;
        }
        // For macOS and Linux, replace '/' with '\'
        return path.replace(/\//g, '\\');
    }
    catch (err) {
        console.log("error while formating file path", err);
        return path;
    }
}
function normalizePathForUnixStyle(path) {
    try {
        if (os.platform() === 'win32') {
            // For Windows, just return the path.
            return path;
        }
        // For macOS and Linux, replace backslashes with forward slashes because every path passed to this funtion were originally passed into normalizePathForWindowsStyle.
        return path.replace(/\\+/g, '/');
    }
    catch (err) {
        console.log("Error while formatting file path", err);
        return path;
    }
}
function reverseNormalization(path) {
    try {
        if (os.platform() === 'win32') {
            // For Windows, just return the path.
            return path;
        }
        // For macOS and Linux, replace backslashes with forward slashes because every path passed to this funtion were originally passed into normalizePathForWindowsStyle.
        return path.replace(/\\+/g, '/');
    }
    catch (err) {
        console.log("Error while formatting file path", err);
        return path;
    }
}
function normalization(path) {
    try {
        if (os.platform() === 'win32') {
            // Return the path as it is for Windows
            return path;
        }
        // For macOS and Linux, replace '/' with '\'
        return path.replace(/\//g, '\\');
    }
    catch (err) {
        console.log("error while formating file path", err);
        return path;
    }
}
//# sourceMappingURL=fileIndex.js.map