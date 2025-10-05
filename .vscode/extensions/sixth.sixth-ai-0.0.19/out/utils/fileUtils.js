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
exports.DiffCodeLensProvider = exports.codeLensRanges = void 0;
exports.createFileInDirectory = createFileInDirectory;
exports.uploadLocalFileAndGetURLV2 = uploadLocalFileAndGetURLV2;
exports.uploadLocalFileAndGetURLV2Image = uploadLocalFileAndGetURLV2Image;
exports.readLinesFromFile = readLinesFromFile;
exports.insertMultilineSnippet = insertMultilineSnippet;
exports.insertMultilineStringIntoFile = insertMultilineStringIntoFile;
exports.selectFolder = selectFolder;
exports.showInlineDiff = showInlineDiff;
exports.applyChanges = applyChanges;
exports.rejectChanges = rejectChanges;
exports.deleteFile = deleteFile;
exports.createFile = createFile;
exports.getFileContentSync = getFileContentSync;
exports.getRelativeFilePath = getRelativeFilePath;
exports.cleanCodeSnippet = cleanCodeSnippet;
exports.cleanCodeSnippetWithoutTrim = cleanCodeSnippetWithoutTrim;
exports.removeSubstringIfExists = removeSubstringIfExists;
exports.generateProjectTree = generateProjectTree;
exports.getCurrentWorkspaceName = getCurrentWorkspaceName;
exports.getRelativePathFromWorkspace = getRelativePathFromWorkspace;
exports.createFileInWorkspace = createFileInWorkspace;
exports.showInlineDiffForSelectedRange = showInlineDiffForSelectedRange;
exports.matchLine = matchLine;
exports.removeTrailingBackticks = removeTrailingBackticks;
exports.getFileIcon = getFileIcon;
const fs = __importStar(require("fs"));
const vscode = __importStar(require("vscode"));
const codeLens_1 = require("../gpt3/codeLens");
const diff_1 = require("diff");
//import { bucket, storage } from '../config/firebase';
const path = __importStar(require("path"));
const axios_1 = __importDefault(require("axios"));
const genUtils_1 = require("./genUtils");
const form_data_1 = __importDefault(require("form-data"));
const fastest_levenshtein_1 = require("fastest-levenshtein");
const axiosInstance_1 = require("../utils/axiosInstance");
const api = (0, axiosInstance_1.createAxiosInstance)();
// Update codeLensRanges to store both Range and oldCode
exports.codeLensRanges = new Map();
function linesMatchPerfectly(lineA, lineB) {
    return lineA === lineB && lineA !== "";
}
const END_BRACKETS = ["}", "});", "})"];
function linesMatch(lineA, lineB, linesBetween = 0) {
    // Require a perfect (without padding) match for these lines
    // Otherwise they are edit distance 1 from empty lines and other single char lines (e.g. each other)
    if (["}", "*", "});", "})"].includes(lineA.trim())) {
        return lineA.trim() === lineB.trim();
    }
    const d = (0, fastest_levenshtein_1.distance)(lineA, lineB);
    return (
    // Should be more unlikely for lines to fuzzy match if they are further away
    (d / Math.max(lineA.length, lineB.length) <=
        Math.max(0, 0.48 - linesBetween * 0.06) ||
        lineA.trim() === lineB.trim()) &&
        lineA.trim() !== "");
}
function checkFileExists(filePath) {
    try {
        fs.promises.access(filePath);
    }
    catch (error) {
    }
}
function createFileInDirectory(directory, fileName, fileContent) {
    const baseDirectory = './'; // Use the base directory as the current working directory
    try {
        const filePath = `${directory}/${fileName}`;
        fs.promises.writeFile(filePath, fileContent);
    }
    catch (error) {
    }
}
/*export async function uploadLocalFileAndGetURL(localFilePath: string, destination: string): Promise<string> {
    try {
      const options = {
        destination, // The path where the file will be uploaded in the Firebase Storage bucket
        resumable: false, // For simplicity, disable resumable uploads
      };
  
      // Upload the file
      await bucket.upload(localFilePath, options);
    
      // Get the download URL
      const file = bucket.file(destination);
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-09-2500', // Set an expiration date far in the future
      });
  
      return url;
    } catch (error) {
        console.log("Error is ", error)
      return ""
    }
  }*/
async function uploadLocalFileAndGetURLV2(localFilePath, destination, rootFolder) {
    console.log("Uploading file from:", localFilePath);
    try {
        const formData = new form_data_1.default();
        // Read the local file into a buffer and append it to FormData
        const fileStream = fs.createReadStream(localFilePath);
        const relativeDestination = path.relative(rootFolder, destination);
        const posixRelativePath = process.platform === 'win32' ? path.posix.normalize(relativeDestination) : relativeDestination;
        const fileName = path.basename(localFilePath);
        formData.append('file', fileStream, fileName);
        formData.append('destination', posixRelativePath); // Optional: Set the destination path in Firebase Storage
        // Send the file to your FastAPI endpoint
        const response = await axios_1.default.post(`${genUtils_1.httpBaseUrl}/upload-file/?destination=${posixRelativePath}`, formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });
        // Assuming the response contains the signed URL
        const signedUrl = response.data.signed_url;
        return signedUrl;
    }
    catch (error) {
        console.log("Error uploading fileFirebaseeeFile:", error);
        return "";
    }
}
async function uploadLocalFileAndGetURLV2Image(localFilePath, destination, rootFolder) {
    console.log("Uploading file from:", localFilePath);
    try {
        const formData = new form_data_1.default();
        // Read the local file into a buffer and append it to FormData
        const fileStream = fs.createReadStream(localFilePath);
        const relativeDestination = path.relative(rootFolder, destination);
        const posixRelativePath = process.platform === 'win32' ? path.posix.normalize(relativeDestination) : relativeDestination;
        const fileName = path.basename(localFilePath);
        formData.append('file', fileStream, fileName);
        formData.append('destination', posixRelativePath); // Optional: Set the destination path in Firebase Storage
        // Get project path for proper file destination
        const projectPath = (vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '') + "/" + destination;
        const normalizedPath = process.platform === 'win32' ? projectPath.replace(/\\/g, '/') : projectPath;
        console.log("Normalized path is ", normalizedPath);
        console.log("Url is ", `/upload-file/?destination=${normalizedPath.replace("/", "%2F")}`);
        // Send the file to your FastAPI endpoint
        const response = await axios_1.default.post(`${genUtils_1.httpBaseUrl}/upload-file/?destination=${normalizedPath.replace("/", "%2F")}`, formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });
        // Assuming the response contains the signed URL
        const signedUrl = response.data.signed_url;
        return signedUrl;
    }
    catch (error) {
        console.log("Error uploading fileFirebaseeeFile:", error);
        return "";
    }
}
function readLinesFromFile(filePath) {
    try {
        // Read the entire file as a string
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        // Split the file content into an array of lines
        const lines = fileContent.split('\n');
        // Filter out any empty lines (optional)
        const nonEmptyLines = lines.filter(line => line.trim() !== '');
        console.log(`readLinesFromFile ${nonEmptyLines.length}`);
        return nonEmptyLines;
    }
    catch (error) {
        return [];
    }
}
// E
function insertMultilineSnippet(snippetText, line, needsConfirmation = false) {
    if (codeLens_1.curDocument) {
        // Define the start position
        const startPosition = new vscode.Position(line - 1, 0);
        let endPosition = startPosition;
        // Retrieve the current content from the document within the range
        if (codeLens_1.curDocument.lineCount >= line) {
            endPosition = new vscode.Position(codeLens_1.curDocument.lineCount - 1, codeLens_1.curDocument.lineAt(codeLens_1.curDocument.lineCount - 1).text.length);
        }
        else {
            endPosition = startPosition;
        }
        const preexistingText = codeLens_1.curDocument.getText(new vscode.Range(startPosition, endPosition));
        // Concatenate the snippet text with preexisting content
        console.log(preexistingText, startPosition.line, endPosition.line, "pretext");
        const finalSnippet = snippetText + '\n' + preexistingText;
        // Define the range where the snippet should be inserted (line 10 in this example)
        const range = new vscode.Range(startPosition, new vscode.Position(line + countLines(finalSnippet) - 1, 0));
        // Create a TextEdit object
        const edit = new vscode.TextEdit(range, finalSnippet);
        // Apply the TextEdit to the document
        var editBuilder = new vscode.WorkspaceEdit();
        if (codeLens_1.curDocument.fileName.endsWith(".git")) {
            const doc = getDocumentByFilename(codeLens_1.curDocument.fileName.replace(".git", ""));
            if (doc !== undefined) {
                editBuilder.replace(doc.uri, range, finalSnippet, { needsConfirmation: needsConfirmation, label: " sixth" });
                vscode.workspace.applyEdit(editBuilder).then(success => {
                    if (success) {
                    }
                    else {
                    }
                });
            }
        }
        else {
            editBuilder.replace(codeLens_1.curDocument.uri, range, finalSnippet, { needsConfirmation: needsConfirmation, label: " sixth" });
            vscode.workspace.applyEdit(editBuilder).then(success => {
                if (success) {
                }
                else {
                }
            });
        }
    }
}
function insertMultilineStringIntoFile(multilineString, lineNumber) {
    const filePath = codeLens_1.curDocument.fileName.replace(".git", "");
    // Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    // Split the content into an array of lines
    const lines = fileContent.split('\n');
    // Split the multiline string into an array of lines
    const newLines = multilineString.split('\n');
    // Insert the new lines at the specified line number
    lines.splice(lineNumber - 1, 0, ...newLines);
    // Join the lines back into a single string
    const updatedContent = lines.join('\n');
    // Write the updated content back to the file
    fs.writeFileSync(filePath, updatedContent, 'utf-8');
}
async function selectFolder() {
    // Show folder selection dialog
    const uri = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Select Destination Folder'
    });
    // Check if a folder was selected
    if (uri && uri.length > 0) {
        // Return the path of the selected folder
        return uri[0].fsPath;
    }
    else {
        return undefined; // Return undefined if no folder was selected
    }
}
function countLines(multilineString) {
    // Split the string by newline characters
    const lines = multilineString.split('\n');
    // Count the number of lines
    const lineCount = lines.length;
    return lineCount;
}
// Example
function getDocumentByFilename(filename) {
    // Iterate through all open documents
    for (const document of vscode.workspace.textDocuments) {
        // Check if the filename matches
        if (document.fileName === filename) {
            return document;
        }
    }
    return undefined; // If no matching document is found
}
async function showInlineDiff(fileUri, newCode) {
    // Read the original file content
    const currentFileContent = await vscode.workspace.fs.readFile(fileUri);
    const originalText = Buffer.from(currentFileContent).toString('utf-8');
    // Normalize line endings
    const normalizedOriginalText = originalText.replace(/\r\n/g, '\n');
    const normalizedNewCode = newCode.replace(/\r\n/g, '\n');
    const diffs = (0, diff_1.diffLines)(normalizedOriginalText, normalizedNewCode);
    // Create the updated content for the temporary file by directly adding parts
    let updatedContent = '';
    diffs.forEach((part) => {
        if (part.added) {
            console.log("let's see green parts!!!", part.value);
            updatedContent += part.value; // Add new lines (without splitting into individual lines)
        }
        else if (part.removed) {
            updatedContent += part.value; // Add removed lines as they are
        }
        else {
            updatedContent += part.value; // Add unchanged lines as they are
        }
    });
    const edit = new vscode.WorkspaceEdit();
    const document = await vscode.workspace.openTextDocument(fileUri);
    const fullRange = new vscode.Range(new vscode.Position(0, 0), document.lineAt(document.lineCount - 1).range.end);
    // Apply the new content to the document
    edit.replace(fileUri, fullRange, updatedContent);
    await vscode.workspace.applyEdit(edit);
    // Open the document and apply decorations
    const editor = await vscode.window.showTextDocument(document);
    // Decorations for added and removed lines
    const addedDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(0,255,0,0.3)', // Green for added
        isWholeLine: true,
    });
    const removedDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255,0,0,0.3)', // Red for removed
        isWholeLine: true,
    });
    const addedRanges = [];
    const removedRanges = [];
    let lineNumber = 0;
    for (const part of diffs) {
        const lines = part.value.split('\n');
        if (part.added) {
            lines.forEach((line, i) => {
                if (line.trim() !== '') {
                    addedRanges.push(new vscode.Range(lineNumber + i, 0, lineNumber + i, line.length));
                }
            });
        }
        else if (part.removed) {
            lines.forEach((line, i) => {
                if (line.trim() !== '') {
                    removedRanges.push(new vscode.Range(lineNumber + i, 0, lineNumber + i, line.length));
                }
            });
        }
        lineNumber += lines.length - 1;
    }
    // Apply decorations to the temporary file
    editor.setDecorations(addedDecorationType, addedRanges);
    editor.setDecorations(removedDecorationType, removedRanges);
    vscode.window.showInformationMessage('Differences have been highlighted in a temporary file.');
}
// Helper function to map file extensions to language identifiers
function getLanguageForExtension(fileExtension) {
    const languageMap = {
        '.js': 'javascript',
        '.ts': 'typescript',
        '.html': 'html',
        '.css': 'css',
        '.py': 'python',
        '.java': 'java',
        '.c': 'c',
        '.cpp': 'cpp',
        '.json': 'json',
        '.md': 'markdown',
        '.txt': 'plaintext', // Default
        // Add more file extensions and their respective languages here
    };
    return languageMap[fileExtension] || 'plaintext'; // Default to 'plaintext' if no match
}
async function applyChanges(fileUri, newCode) {
    try {
        const edit = new vscode.WorkspaceEdit();
        const document = await vscode.workspace.openTextDocument(fileUri);
        const fullRange = new vscode.Range(new vscode.Position(0, 0), document.lineAt(document.lineCount - 1).range.end);
        // Replace the content with newCode
        edit.replace(fileUri, fullRange, newCode);
        await vscode.workspace.applyEdit(edit);
        // Clear decorations by resetting them to empty arrays
        const editor = vscode.window.visibleTextEditors.find((e) => e.document.uri.toString() === fileUri.toString());
        if (editor) {
            editor.setDecorations(vscode.window.createTextEditorDecorationType({}), [] // Clear all decorations
            );
        }
        vscode.window.showInformationMessage('Changes applied successfully!');
    }
    catch (error) {
        vscode.window.showErrorMessage('Failed to apply changes.');
    }
}
async function rejectChanges(fileUri, originalCode) {
    try {
        const edit = new vscode.WorkspaceEdit();
        const document = await vscode.workspace.openTextDocument(fileUri);
        const fullRange = new vscode.Range(new vscode.Position(0, 0), document.lineAt(document.lineCount - 1).range.end);
        // Replace the content with the original code
        edit.replace(fileUri, fullRange, originalCode);
        await vscode.workspace.applyEdit(edit);
        // Clear decorations by resetting them to empty arrays
        const editor = vscode.window.visibleTextEditors.find((e) => e.document.uri.toString() === fileUri.toString());
        if (editor) {
            editor.setDecorations(vscode.window.createTextEditorDecorationType({}), [] // Clear all decorations
            );
        }
        vscode.window.showInformationMessage('Changes rejected and original content restored!');
    }
    catch (error) {
        vscode.window.showErrorMessage('Failed to reject changes.');
    }
}
async function deleteFile(filePath) {
    try {
        // Convert the file path string to a vscode.Uri
        const fileUri = vscode.Uri.file(filePath);
        // Delete the file
        await vscode.workspace.fs.delete(fileUri);
        vscode.window.showInformationMessage(`File deleted successfully: ${filePath}`);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to delete the file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
async function createFile(fileName, fileContent, filePath) {
    try {
        let directoryUri;
        if (filePath) {
            // Use the provided file path
            directoryUri = vscode.Uri.file(filePath);
        }
        else {
            // Get the active editor's file directory
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                const activeFileUri = activeEditor.document.uri;
                directoryUri = vscode.Uri.joinPath(activeFileUri, '..'); // Parent directory of the active file
            }
            else {
                // Default to the root of the first workspace folder
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (workspaceFolders && workspaceFolders.length > 0) {
                    directoryUri = workspaceFolders[0].uri; // Root of the workspace
                }
            }
        }
        if (!directoryUri) {
            vscode.window.showErrorMessage('No workspace folder is open. Cannot create file.');
            return;
        }
        // Create the file URI
        const fileUri = vscode.Uri.joinPath(directoryUri, fileName);
        // Write the content to the file
        await vscode.workspace.fs.writeFile(fileUri, Buffer.from(fileContent, 'utf-8'));
        vscode.window.showInformationMessage(`File "${fileName}" created successfully at ${fileUri.fsPath}`);
    }
    catch (error) {
        if (error instanceof Error) {
            vscode.window.showErrorMessage(`Failed to create file: ${error.message}`);
        }
        else {
            vscode.window.showErrorMessage('An unknown error occurred while creating the file.');
        }
    }
}
async function getFileContentSync(fileUri) {
    let result = '';
    // Create a promise that resolves after reading the file
    const fileContent = await vscode.workspace.fs.readFile(fileUri);
    result = Buffer.from(fileContent).toString('utf-8');
    // Return the result (this won't work as expected because of async nature)
    return result;
}
function getRelativeFilePath(filePath) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        // Assume the file is in the first workspace folder
        const workspacePath = workspaceFolders[0].uri.fsPath;
        // Calculate the relative path
        return path.relative(workspacePath, filePath);
    }
    else {
        vscode.window.showErrorMessage('No workspace folder is open.');
        return undefined;
    }
}
function cleanCodeSnippet(snippet) {
    // Remove the starting ```python or similar
    let cleanedSnippet = snippet.replace(/^```[a-zA-Z]*\n/, '');
    // Remove the ending ```
    cleanedSnippet = cleanedSnippet.replace(/\n```$/, '');
    // Remove the ##FILE:<FILE_PATH>: line, including paths with `/` or `\`
    cleanedSnippet = cleanedSnippet.replace(/^##FILE:[^:\n]+:\n/, '');
    return cleanedSnippet.trim(); // Trim extra spaces or newlines
}
function cleanCodeSnippetWithoutTrim(snippet) {
    // Remove the starting ```python or similar
    let cleanedSnippet = snippet.replace(/^```[a-zA-Z]*\n/, '');
    // Remove the ending ```
    cleanedSnippet = cleanedSnippet.replace(/\n```$/, '');
    // Remove the ##FILE:<FILE_PATH>: line, including paths with `/` or `\`
    cleanedSnippet = cleanedSnippet.replace(/^##FILE:[^:\n]+:\n/, '');
    return cleanedSnippet;
}
function removeSubstringIfExists(fullPath, substring) {
    // Check if the substring is in the full path
    if (fullPath.includes(substring)) {
        // Replace the substring with an empty string
        let updatedPath = fullPath.replace(substring, '').trim();
        // Remove any trailing '/' or '\' from the updated path
        updatedPath = updatedPath.replace(/[\\/]+$/, '');
        return updatedPath;
    }
    return fullPath; // Return the original path if the substring doesn't exist
}
function generateProjectTree(dirPath, indent = 0, ignoreDirs = ['node_modules', 'venv', 'ENV', '.git', '__pycache__', 'staticfiles']) {
    let structure = '';
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const isDirectory = fs.statSync(fullPath).isDirectory();
        // Skip ignored directories
        if (isDirectory && ignoreDirs.includes(file)) {
            continue;
        }
        structure += `${' '.repeat(indent)}├── ${file}\n`;
        if (isDirectory) {
            structure += generateProjectTree(fullPath, indent + 4, ignoreDirs);
        }
    }
    return structure;
}
function getCurrentWorkspaceName() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        // Get the name of the first workspace folder
        const workspacePath = workspaceFolders[0].uri.fsPath;
        const workspaceName = workspacePath.split(/[\\/]/).pop();
        return workspaceName || null;
    }
    // Return null if no workspace is open
    return null;
}
function getRelativePathFromWorkspace(fullFilePath) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceFolder = workspaceFolders[0].uri.fsPath;
        if (fullFilePath.startsWith(workspaceFolder)) {
            // Remove the workspace folder part and prepend the workspace name
            const relativePath = fullFilePath.slice(workspaceFolder.length + 1); // +1 to remove the leading separator
            const workspaceName = workspaceFolder.split(/[\\/]/).pop();
            return workspaceName ? `${workspaceName}/${relativePath}` : null;
        }
    }
    return null; // Return null if the file path doesn't belong to the workspace
}
async function createFileInWorkspace(relativePath, content) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace is currently open.');
        return null;
    }
    const workspaceFolder = workspaceFolders[0].uri.fsPath;
    // Construct the full file path using the workspace folder
    const fullFilePath = path.join(workspaceFolder, relativePath);
    // Ensure the directory exists
    const dirPath = path.dirname(fullFilePath);
    fs.mkdirSync(dirPath, { recursive: true });
    // Write content to the file
    fs.writeFileSync(fullFilePath, content, 'utf8');
    vscode.window.showInformationMessage(`File created at: ${fullFilePath}`);
    return fullFilePath; // Return the full file path
}
async function showInlineDiffForSelectedRange(newCode, oldCode, oldRange, addedDecorationType, removedDecorationType, loadCodeLens = false) {
    try {
        if (newCode.length === 0) {
            return;
        }
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found.');
            return;
        }
        if (!editor.selection || editor.selection.isEmpty) {
            vscode.window.showErrorMessage('Please highlight a range to diff.');
            return;
        }
        const selectedRange = editor.selection;
        const document = editor.document;
        const edit = new vscode.WorkspaceEdit();
        console.log("BEFORE STUFFS CHANGED:", selectedRange.start.line, selectedRange.end.line);
        const reformedNewCode = removeTrailingBackticks(newCode);
        // Normalize line endings for consistent diffing
        const normalizedOriginalText = oldCode.replace(/\r\n/g, '\n');
        const normalizedNewCode = reformedNewCode.replace(/\r\n/g, '\n');
        // Compute differences
        const diffs = (0, diff_1.diffLines)(normalizedOriginalText, normalizedNewCode);
        const addedRanges = [];
        const removedRanges = [];
        let updatedContent = '';
        // Process diffs and generate updated content
        let diffLineSum = 0;
        let lineOffset = selectedRange.start.line;
        for (const part of diffs) {
            const lines = part.value.split('\n');
            diffLineSum += lines.length;
            if (part.added) {
                updatedContent += part.value; // Append added text
                lines.forEach((line, i) => {
                    if (line.trim() !== '') {
                        addedRanges.push(new vscode.Range(lineOffset + i, 0, lineOffset + i, line.length));
                    }
                });
            }
            else if (part.removed) {
                updatedContent += part.value; // Append removed text
                lines.forEach((line, i) => {
                    if (line.trim() !== '') {
                        removedRanges.push(new vscode.Range(lineOffset + i, 0, lineOffset + i, line.length));
                    }
                });
            }
            else {
                updatedContent += part.value; // Append unchanged text
            }
            // Adjust line offset
            lineOffset += lines.length - 1;
        }
        // Replace the selected portion with the diffed content
        edit.replace(document.uri, selectedRange, updatedContent);
        await vscode.workspace.applyEdit(edit);
        console.log("let me see how line offset behaves", lineOffset, editor.selection.start.line, editor.selection.end.line, diffLineSum, newCode, updatedContent);
        //Reset text decorationa
        editor.setDecorations(addedDecorationType, []);
        editor.setDecorations(removedDecorationType, []);
        // Apply decorations only within the selected range
        editor.setDecorations(addedDecorationType, addedRanges);
        editor.setDecorations(removedDecorationType, removedRanges);
        if (loadCodeLens) {
            exports.codeLensRanges.set(document.uri.toString(), [
                {
                    range: new vscode.Range(selectedRange.start, selectedRange.end),
                    oldCode: oldCode // Store the original text that was diffed
                }
            ]);
        }
    }
    catch (error) {
        console.log("something went wrong with streamed diffing", error);
    }
}
/*export function matchLine(newLine:string,oldCodeCopy:string[],permissiveAboutIndentation = false):MatchLineResult{

    if(newLine.trim()==="" && oldCodeCopy[0]?.trim() === ""){
        return {
            matchIndex: 0,
            isPerfectMatch: true,
            newDiffedLine: newLine.trim(),
          };
    }

    const isEndBracket = END_BRACKETS.includes(newLine.trim());
    for (let i = 0; i < oldCodeCopy.length; i++) {
        if (i > 4 && isEndBracket) {
            return { matchIndex: -1, isPerfectMatch: false, newDiffedLine: newLine };
          }

          if (linesMatchPerfectly(newLine, oldCodeCopy[i])) {
            return { matchIndex: i, isPerfectMatch: true, newDiffedLine: newLine };
          }
          if (linesMatch(newLine, oldCodeCopy[i], i)) {
            if (
                newLine.trimStart() === oldCodeCopy[i].trimStart() &&
                (permissiveAboutIndentation || newLine.trim().length > 8)
              ) {
                return {
                  matchIndex: i,
                  isPerfectMatch: true,
                  newDiffedLine: oldCodeCopy[i],
                };
              }
            return { matchIndex: i, isPerfectMatch: false, newDiffedLine: newLine };
          }
    }
    return { matchIndex: -1, isPerfectMatch: false, newDiffedLine: newLine };
}*/
function matchLine(newLine, oldCodeCopy, permissiveAboutIndentation = false) {
    if (newLine.trim() === "" && oldCodeCopy[0]?.trim() === "") {
        return {
            matchIndex: 0,
            isPerfectMatch: true,
            newDiffedLine: newLine.trim(),
        };
    }
    const isEndBracket = END_BRACKETS.includes(newLine.trim());
    for (let i = 0; i < oldCodeCopy.length; i++) {
        if (i > 4 && isEndBracket) {
            return { matchIndex: -1, isPerfectMatch: false, newDiffedLine: newLine };
        }
        if (linesMatchPerfectly(newLine, oldCodeCopy[i])) {
            return { matchIndex: i, isPerfectMatch: true, newDiffedLine: newLine };
        }
        if (linesMatch(newLine, oldCodeCopy[i], i)) {
            // More permissive indentation handling
            const newTrimmed = newLine.trim();
            const oldTrimmed = oldCodeCopy[i].trim();
            if (newTrimmed === oldTrimmed ||
                (permissiveAboutIndentation &&
                    newTrimmed.length > 0 && // Don't change indentation of empty lines
                    (newLine.length - newTrimmed.length) - (oldCodeCopy[i].length - oldTrimmed.length) <= 2) // Allow indentation difference of up to 2 spaces
            ) {
                return {
                    matchIndex: i,
                    isPerfectMatch: true,
                    newDiffedLine: oldCodeCopy[i], // Use the original line's indentation
                };
            }
            return { matchIndex: i, isPerfectMatch: false, newDiffedLine: newLine };
        }
    }
    return { matchIndex: -1, isPerfectMatch: false, newDiffedLine: newLine };
}
function removeTrailingBackticks(input) {
    if (input.endsWith('```')) {
        return input.slice(0, -3); // Remove the last 3 characters
    }
    return input; // Return the original string if it doesn't end with ```
}
// CodeLens provider
class DiffCodeLensProvider {
    provideCodeLenses(document, token) {
        const codelenses = [];
        const ranges = exports.codeLensRanges.get(document.uri.toString());
        if (ranges) {
            ranges.forEach((range) => {
                // Extract the start position of the range for codeLens placement
                let codeLensStart = range.range.start.line;
                // Optionally adjust the start to avoid overlap (e.g., move it down by 1)
                if (codeLensStart > 0) {
                    codeLensStart -= 1; // Adjust to place the codeLens just before the diff
                }
                // Create a new range for CodeLens positioning
                const codeLensRange = new vscode.Range(codeLensStart, range.range.start.character, range.range.end.line, range.range.end.character);
                codelenses.push(new vscode.CodeLens(codeLensRange, {
                    title: 'Accept Changes',
                    command: 'extension.acceptDiff',
                    arguments: [document.uri, range.range], // Using the original `range` for the edit
                }), new vscode.CodeLens(codeLensRange, {
                    title: 'Reject Changes',
                    command: 'extension.rejectDiff',
                    arguments: [document.uri, range.range], // Using the original `range` for the edit
                }));
            });
        }
        return codelenses;
    }
}
exports.DiffCodeLensProvider = DiffCodeLensProvider;
function getFileIcon(fileName) {
    // Handle cases with line numbers or ranges
    const fileNameParts = fileName.split(' ');
    const actualFileName = fileNameParts[0]; // Get just the file name part
    // Get the file extension
    const ext = actualFileName.split('.').pop()?.toLowerCase() || '';
    // Map of file extensions to Font Awesome icons
    const iconMap = {
        // Programming Languages
        'js': '<i class="fab fa-js-square"></i>',
        'ts': '<i class="fab fa-js-square" style="color: #007acc;"></i>',
        'py': '<i class="fab fa-python"></i>',
        'java': '<i class="fab fa-java"></i>',
        'cpp': '<i class="fas fa-file-code"></i>',
        'c': '<i class="fas fa-file-code"></i>',
        'cs': '<i class="fas fa-file-code"></i>',
        'go': '<i class="fas fa-file-code"></i>',
        'rs': '<i class="fas fa-file-code"></i>',
        'swift': '<i class="fab fa-swift"></i>',
        'kt': '<i class="fas fa-file-code"></i>',
        'rb': '<i class="fas fa-gem"></i>',
        'php': '<i class="fab fa-php"></i>',
        // Web Technologies
        'html': '<i class="fab fa-html5"></i>',
        'css': '<i class="fab fa-css3-alt"></i>',
        'scss': '<i class="fab fa-sass"></i>',
        'jsx': '<i class="fab fa-react"></i>',
        'tsx': '<i class="fab fa-react"></i>',
        'vue': '<i class="fab fa-vuejs"></i>',
        'svelte': '<i class="fas fa-file-code"></i>',
        // Data Formats
        'json': '<i class="fas fa-brackets-curly"></i>',
        'xml': '<i class="fas fa-file-code"></i>',
        'yaml': '<i class="fas fa-file-code"></i>',
        'yml': '<i class="fas fa-file-code"></i>',
        'toml': '<i class="fas fa-file-code"></i>',
        // Documentation
        'md': '<i class="fab fa-markdown"></i>',
        'txt': '<i class="fas fa-file-alt"></i>',
        'pdf': '<i class="fas fa-file-pdf"></i>',
        'doc': '<i class="fas fa-file-word"></i>',
        'docx': '<i class="fas fa-file-word"></i>',
        // Configuration Files
        'env': '<i class="fas fa-cog"></i>',
        'config': '<i class="fas fa-cog"></i>',
        'ini': '<i class="fas fa-cog"></i>',
        'dockerfile': '<i class="fab fa-docker"></i>',
        // Shell Scripts
        'sh': '<i class="fas fa-terminal"></i>',
        'bash': '<i class="fas fa-terminal"></i>',
        'zsh': '<i class="fas fa-terminal"></i>',
        'fish': '<i class="fas fa-terminal"></i>',
        'ps1': '<i class="fas fa-terminal"></i>',
        // Version Control
        'git': '<i class="fab fa-git-alt"></i>',
        'gitignore': '<i class="fab fa-git-alt"></i>',
        // Package Management
        'package.json': '<i class="fab fa-npm"></i>',
        'composer.json': '<i class="fab fa-php"></i>',
        'requirements.txt': '<i class="fab fa-python"></i>',
        'gemfile': '<i class="fas fa-gem"></i>',
        // Images
        'png': '<i class="fas fa-file-image"></i>',
        'jpg': '<i class="fas fa-file-image"></i>',
        'jpeg': '<i class="fas fa-file-image"></i>',
        'gif': '<i class="fas fa-file-image"></i>',
        'svg': '<i class="fas fa-file-image"></i>',
        'ico': '<i class="fas fa-file-image"></i>',
        // Archives
        'zip': '<i class="fas fa-file-archive"></i>',
        'tar': '<i class="fas fa-file-archive"></i>',
        'gz': '<i class="fas fa-file-archive"></i>',
        'rar': '<i class="fas fa-file-archive"></i>',
        '7z': '<i class="fas fa-file-archive"></i>',
    };
    // Special cases for specific filenames
    const specialFiles = {
        'package.json': '<i class="fab fa-npm"></i>',
        'composer.json': '<i class="fab fa-php"></i>',
        'dockerfile': '<i class="fab fa-docker"></i>',
        'docker-compose.yml': '<i class="fab fa-docker"></i>',
        'makefile': '<i class="fas fa-cogs"></i>',
        '.gitignore': '<i class="fab fa-git-alt"></i>',
        '.env': '<i class="fas fa-cog"></i>',
    };
    // Check for special filenames first (case insensitive)
    const lowercaseFileName = actualFileName.toLowerCase();
    for (const [specialFile, icon] of Object.entries(specialFiles)) {
        if (lowercaseFileName === specialFile.toLowerCase()) {
            return icon;
        }
    }
    // If not a special file, use the extension map
    return iconMap[ext] || '<i class="fas fa-file"></i>';
}
//# sourceMappingURL=fileUtils.js.map