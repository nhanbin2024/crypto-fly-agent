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
exports.countSpecialCharacters = countSpecialCharacters;
exports.countWords = countWords;
exports.craftFilePrompts = craftFilePrompts;
exports.updateFilePrompts = updateFilePrompts;
exports.getRootWorkspaceFolder = getRootWorkspaceFolder;
exports.currentWorkingFilePromptsFromPath = currentWorkingFilePromptsFromPath;
exports.findSubstringIndices = findSubstringIndices;
exports.removeSpecialCharacters = removeSpecialCharacters;
exports.countAndRemoveSpecialCharactersApartFromEqualsto = countAndRemoveSpecialCharactersApartFromEqualsto;
exports.findOriginalMatch = findOriginalMatch;
exports.getVariableNamefromLine = getVariableNamefromLine;
exports.readFromFileSync = readFromFileSync;
exports.removeWhitespaces = removeWhitespaces;
exports.findCodeSubstringLocation = findCodeSubstringLocation;
exports.findMultilineSubstring = findMultilineSubstring;
exports.extractJavascriptFunctionName = extractJavascriptFunctionName;
exports.extractPythonFunctionName = extractPythonFunctionName;
exports.extractGoFunctionName = extractGoFunctionName;
exports.isCodeSnippetContained = isCodeSnippetContained;
exports.findCodeSnippetLocation = findCodeSnippetLocation;
exports.findCodeSnippetRange = findCodeSnippetRange;
exports.findCodeRangeWithAlignment = findCodeRangeWithAlignment;
const fs = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const tiktoken_1 = require("@dqbd/tiktoken");
const constant_1 = require("./constant");
const Diff = __importStar(require("diff"));
const fastest_levenshtein_1 = require("fastest-levenshtein");
function countSpecialCharacters(inputString) {
    // Define a regular expression to match non-alphanumeric characters
    const specialCharRegex = /[^a-zA-Z0-9]/g;
    // Use the regex to find and count the special characters
    const specialChars = inputString.match(specialCharRegex);
    // Remove all special characters from the string
    const stringWithoutSpecialChars = inputString.replace(specialCharRegex, '');
    return specialChars ? specialChars.length : 0;
}
function countWords(str) {
    const words = str.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
}
function craftFilePrompts(fileNames) {
    var files = [];
    var head = " When giving a reply, i want you to use these files as a context when giving a reply. Take them into account, these are the files:";
    fileNames.forEach(file => {
        console.log("File is sssisisisi", file.fsPath);
        var content = fs.readFileSync(file.fsPath, 'utf-8');
        head += `



        FILE_PATH: ${file.fsPath}
        REAL_FILE_NAME: ${path_1.default.basename(file.fsPath)}
        CONTENT: ${content}
        `;
    });
    console.log("Chossen head isssss ", head);
    return head;
}
function truncateStringIfNeeded(inputString) {
    const maxTokens = 4000;
    // Token estimation: splits on spaces and considers punctuation
    const tokens = inputString.split(/\s+/);
    let currentTokens = 0;
    let truncatedString = "";
    for (const word of tokens) {
        const wordTokens = Math.ceil(word.length / 4);
        if (currentTokens + wordTokens > maxTokens) {
            break; // Stop if adding the word exceeds the limit
        }
        truncatedString += (truncatedString ? " " : "") + word; // Add space between words
        currentTokens += wordTokens;
    }
    return truncatedString;
}
function updateFilePrompts(fileNames) {
    var files = [];
    var head = `Update all these file content and now use this as the new content:`;
    fileNames.forEach(file => {
        var content = fs.readFileSync(file.fsPath, 'utf-8');
        head += `



        FILE_PATH: ${file}
        REAL_FILE_NAME: ${path_1.default.basename(file.fsPath)}
        CONTENT: ${truncateStringIfNeeded(content)}


        `;
    });
    return head;
}
// Helper function to check if file is text-based
function isTextFile(filename) {
    const textExtensions = new Set([
        // Common web development
        '.txt', '.js', '.ts', '.jsx', '.tsx', '.html', '.htm', '.css', '.scss', '.sass', '.less',
        '.json', '.xml', '.svg', '.vue', '.astro', '.svelte',
        // Backend languages
        '.py', '.java', '.c', '.cpp', '.cs', '.go', '.rs', '.rb', '.php', '.pl', '.pm',
        '.scala', '.kt', '.ktx', '.gradle', '.groovy', '.dart', '.lua', '.r', '.swift',
        // Shell and config
        '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.cmd',
        '.yaml', '.yml', '.toml', '.ini', '.conf', '.env',
        // Documentation and markup
        '.md', '.mdx', '.rst', '.tex', '.wiki', '.adoc', '.textile', '.pod',
        // Database and query
        '.sql', '.graphql', '.prisma', '.hql', '.pks', '.pkb',
        // Headers and definitions
        '.h', '.hpp', '.hxx', '.hh', '.inl', '.ipp', '.m', '.mm', '.pch',
        // Templates and views
        '.ejs', '.pug', '.jade', '.haml', '.liquid', '.twig', '.mustache', '.handlebars', '.hbs',
        // Other programming languages
        '.erl', '.ex', '.exs', '.elm', '.fs', '.fsx', '.fsi',
        '.ml', '.mli', '.hs', '.lhs', '.clj', '.cljs', '.cljc',
        '.coffee', '.litcoffee', '.nim', '.nims', '.v', '.vh',
        // Config and build files
        '.babelrc', '.eslintrc', '.prettierrc', '.stylelintrc',
        '.dockerignore', '.gitignore', '.npmignore',
        'Dockerfile', 'Makefile', 'Rakefile', 'Gemfile',
        // Misc development files
        '.proto', '.cmake', '.mak', '.gyp', '.gypi', '.pde', '.sol',
        '.ino', '.nix', '.dhall', '.tf', '.tfvars', '.vcxproj',
        '.wasm', '.wat', '.zig'
    ]);
    return textExtensions.has(path_1.default.extname(filename).toLowerCase()) ||
        textExtensions.has(path_1.default.basename(filename).toLowerCase());
}
// Helper function to extract line range from filename
function extractLineRange(filename) {
    const parts = filename.split(' ');
    const file = parts.slice(0, parts.length).join(' ');
    console.log("File is ", file);
    if (parts.length === 1)
        return { file };
    const range = parts[1];
    if (range.includes('-')) {
        const [start, end] = range.split('-').map(Number);
        return { file, start, end };
    }
    else {
        const lineNum = Number(range);
        return { file, start: lineNum, end: lineNum };
    }
}
// Helper function to get content based on line range
function getContentWithLineRange(filePath, start, end) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (!start)
            return content;
        const lines = content.split('\n');
        if (end) {
            return lines.slice(start - 1, end).join('\n');
        }
        return lines[start - 1];
    }
    catch (error) {
        return '';
    }
}
function getRootWorkspaceFolder() {
    // Get the first workspace folder (root folder)
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    console.log("Workspace folder isssss ", workspaceFolder?.uri.fsPath);
    // Return the filesystem path or empty string if not available
    return workspaceFolder?.uri.fsPath || '';
}
function currentWorkingFilePromptsFromPath(fileNames) {
    console.log("Files names are ", fileNames);
    // Initialize tiktoken encoder
    const encoder = (0, tiktoken_1.encoding_for_model)('gpt-3.5-turbo');
    let head = (0, constant_1.buildSystemPrompt)();
    head += `


    --- Workspace Folder: ${getRootWorkspaceFolder()} ---


        
    `;
    // Helper function to truncate content by tokens while preserving format
    function truncateByTokens(content, maxTokens) {
        const tokens = encoder.encode(content);
        if (tokens.length <= maxTokens) {
            return content;
        }
        // Convert Uint8Array to string before splitting
        const truncatedText = Buffer.from(encoder.decode(tokens.slice(0, maxTokens))).toString();
        const lines = truncatedText.split('\n');
        if (!content.includes(lines[lines.length - 1])) {
            lines.pop();
        }
        var processed = lines.join('\n');
        console.log("Processed is ", processed);
        return processed;
    }
    // Filter and process files
    const processedFiles = fileNames
        .filter(file => isTextFile(file))
        .slice(0, fileNames.length)
        .map(filename => {
        const { file, start, end } = extractLineRange(filename);
        let content = getContentWithLineRange(file, start, end);
        // Truncate to 1000 tokens while preserving format
        content = truncateByTokens(content, Math.floor(120000 / fileNames.length));
        return {
            path: file,
            name: path_1.default.basename(file),
            content: content
        };
    });
    // Build the prompt
    processedFiles.forEach(file => {
        head += `
        --- File Path: ${file.path} ---
        --- File Name: ${file.name} ---
        --- File Content: ---
${file.content}
        --- TOTAL_LINES: ${file.content.split('\n').length} ---



        `;
    });
    // Clean up encoder
    encoder.free();
    head += `
    User Prompt:
`;
    console.log("Head isssss ", head);
    return head;
}
function findSubstringIndices(mainString, substring) {
    const startIndex = mainString.indexOf(substring);
    if (startIndex !== -1) {
        const endIndex = startIndex + substring.length - 1;
        return [startIndex, endIndex];
    }
    else {
        return null; // Substring not found
    }
}
function removeSpecialCharacters(inputString) {
    // Define a regular expression to match non-alphanumeric characters
    const specialCharRegex = /[^a-zA-Z0-9]/g;
    // Use the regex to replace all special characters with an empty string
    const stringWithoutSpecialChars = inputString.replace(specialCharRegex, '');
    return stringWithoutSpecialChars;
}
function countAndRemoveSpecialCharactersApartFromEqualsto(inputString) {
    // Define a regular expression to match special characters apart from =
    const specialCharRegex = /[!@#$%^&*()_+{}\[\]:;"'<>,.?/|\\-]/g;
    // Use the regex to find and count the special characters
    const specialChars = inputString.match(specialCharRegex);
    // Use the regex to replace all special characters (apart from =) with an empty string
    const cleanedString = inputString.replace(specialCharRegex, '');
    return {
        count: specialChars ? specialChars.length : 0,
        cleanedString,
    };
}
function replaceSpecialCharactersWithWhiteSpaces(inputString) {
    const specialCharRegex = /[!@#$%^&*()_+{}\[\]:;"'<>,.?/|\\-]/g;
    // Use the regex to replace all special characters (apart from =) with an empty string
    const cleanedString = inputString.replace(specialCharRegex, ' ');
    return cleanedString;
}
function findOriginalMatch(original, query) {
    const wordsArray = original.split(/\s+/);
    for (const word of wordsArray) {
        if (countAndRemoveSpecialCharactersApartFromEqualsto(word).cleanedString === query) {
            return replaceSpecialCharactersWithWhiteSpaces(word);
        }
    }
    return "";
}
function getVariableNamefromLine(line, apiKey) {
    const wordsArray = line.replace(/[`'"]/g, "").split(/\s+/);
    const indexOfApiKey = wordsArray.indexOf(apiKey);
    if (indexOfApiKey >= 2) {
        return wordsArray[indexOfApiKey - 2].toUpperCase();
    }
    else {
        const charBeforeApiKey = getCharacterBeforeSubstring(line.replace(/[\s`'"]/g, ''), apiKey);
        if (charBeforeApiKey === "=") {
            if (getWordBeforeEquals(line).length >= 1) {
                return getWordBeforeEquals(line).toUpperCase();
            }
            else {
                return apiKey.substring(0, 7).toUpperCase();
            }
        }
    }
    return apiKey.substring(0, 7).toUpperCase();
}
function getWordBeforeEquals(inputString) {
    const regex = /(\w+)\s*=/; // Matches a word followed by an equals sign
    const match = regex.exec(inputString);
    if (match) {
        // The word before the equals sign is captured in the first group
        return match[1];
    }
    else {
        return ""; // Equals sign not found or no word before it
    }
}
function getCharacterBeforeSubstring(inputString, substring) {
    const index = inputString.indexOf(substring);
    if (index === -1) {
        return null; // Substring not found in the input string
    }
    if (index > 0) {
        // Make sure we're not at the beginning of the string
        return inputString[index - 1];
    }
    return null; // Substring is at the beginning of the input string
}
function readFromFileSync(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        return fileContent;
    }
    catch (err) {
        return ''; // Handle the error and return an appropriate value
    }
}
function removeWhitespaces(inputString) {
    // Use a regular expression to replace all whitespace characters with an empty string
    return inputString.replace(/\s/g, '');
}
function findCodeSubstringLocation(codeBase, targetSubstring) {
    const lines = codeBase.split('\n');
    let startLine = -1;
    let endLine = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(targetSubstring.split('\n')[0]) && startLine === -1) {
            startLine = i + 1;
            let foundMultiline = true;
            for (let j = 1; j < targetSubstring.split('\n').length; j++) {
                if (!lines[i + j].includes(targetSubstring.split('\n')[j])) {
                    foundMultiline = false;
                    break;
                }
            }
            if (foundMultiline) {
                endLine = i + targetSubstring.split('\n').length;
                break;
            }
        }
    }
    if (startLine !== -1 && endLine !== -1) {
        return { startLine, endLine };
    }
    else {
        return null;
    }
}
function findMultilineSubstring(document, substring) {
    const index = document.getText().indexOf(substring);
    if (index !== -1) {
        const startPos = document.positionAt(index);
        const endPos = document.positionAt(index + substring.length);
        const range = new vscode.Range(startPos, endPos);
        return { start: startPos.line, end: endPos.line };
    }
    return null;
}
function extractJavascriptFunctionName(codeString) {
    const firstLine = codeString.split('\n')[0];
    const arrowFunctionRegex = /const\s*([\w$]+)\s*=\s*(?:async\s*)?\(.*\)\s*=>\s*{/;
    //const arrowFnctionNoAsyncRegex = /const\s*([\w$]+)\s*=\s*async\s*\(.*\)\s*=>\s*{/;
    // Regular expression for traditional function declarations
    const functionDeclarationRegex = /function\s*([\w$]+)\s*\(/;
    // Test for arrow function
    const arrowFunctionMatch = codeString.match(arrowFunctionRegex);
    if (arrowFunctionMatch && arrowFunctionMatch[1]) {
        return arrowFunctionMatch[1];
    }
    // Test for traditional function declaration
    const functionDeclarationMatch = codeString.match(functionDeclarationRegex);
    if (functionDeclarationMatch && functionDeclarationMatch[1]) {
        return functionDeclarationMatch[1];
    }
    // If no match is found, return null
    return "";
}
function extractPythonFunctionName(code) {
    // Define a regular expression to match Python function definitions
    const regex = /def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/;
    // Use the regular expression to find matches in the code
    const match = code.match(regex);
    // Check if a match was found
    if (match && match[1]) {
        // Extracted function name is in match[1]
        return match[1];
    }
    else {
        // No match found
        return "";
    }
}
function extractGoFunctionName(code) {
    // Define a regular expression to match Python function definitions
    const regex = /def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/;
    // Use the regular expression to find matches in the code
    const match = code.match(regex);
    // Check if a match was found
    if (match && match[1]) {
        // Extracted function name is in match[1]
        return match[1];
    }
    else {
        // No match found
        return "";
    }
}
function isCodeSnippetContained(snippet, codebase) {
    // Helper function to normalize code
    function normalizeCode(code) {
        return code
            // Remove comments
            .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
            // Remove all whitespace including tabs and newlines
            .replace(/\s+/g, '')
            // Remove empty lines
            .split('\n')
            .filter(line => line.trim())
            .join('');
    }
    // Normalize both snippet and codebase
    const normalizedSnippet = normalizeCode(snippet);
    const normalizedCodebase = normalizeCode(codebase);
    // Edge cases
    if (!normalizedSnippet || !normalizedCodebase)
        return false;
    if (normalizedSnippet === normalizedCodebase)
        return true;
    return normalizedCodebase.includes(normalizedSnippet);
}
// Helper function to find the location of the snippet
// export function findCodeSnippetLocation(snippet: string, codebase: string): { 
//     found: boolean;
//     startLine: number;
//     endLine: number;
// } {
//     console.log("Snippet is ", snippet, " and codebase is ", codebase);
//     // Helper function to normalize code
//     function normalizeCode(text: string): string {
//         return text
//             .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') // Remove comments
//             .replace(/\*/g, '')  // Remove asterisks used for formatting
//             .replace(/\s+/g, '') // Remove all whitespace
//     }
//     const normalizedSnippet = normalizeCode(snippet);
//     const normalizedCodebase = normalizeCode(codebase);
//     const lines = codebase.split('\n');
//     var snippeetLineOCount= snippet.split('\n').length;
//     // First find if snippet exists in codebase
//     const snippetIndex = normalizedCodebase.indexOf(normalizedSnippet);
//     console.log("Snippet index issssneo ", snippetIndex);
//     // if (snippetIndex === -1) {
//     //     return { found: false, startLine: -1, endLine: -1 };
//     // }
//     // Work backwards from end line to find start line
//     let normalizedSoFar = '';
//     let endLine = -1;
//     let startLine = -1;
//     // Find end line first
//     for (let i = 0; i < lines.length; i++) {
//         normalizedSoFar += normalizeCode(lines[i]);
//         if (normalizedSoFar.includes(normalizedSnippet)) {
//             endLine = i;
//             break;
//         }
//     }
//     // Now work backwards from end line to find start line
//     if (endLine !== -1) {
//         for (let i = endLine; i >= 0; i--) {
//             const section = lines.slice(i, endLine + 1).join('\n');
//             const normalizedSection = normalizeCode(section);
//             if (normalizedSection.includes(normalizedSnippet)) {
//                 startLine = i;
//             } else if (startLine !== -1) {
//                 // We've found the first line where the snippet is not included
//                 // So the actual start line is the next line
//                 break;
//             }
//         }
//     }
//     console.log("Start line is ", startLine, " End line is ", endLine);
//     if (startLine !== -1 && endLine !== -1) {
//         var fakeStartLine = endLine-snippeetLineOCount;
//         var snippeetList = snippet.split('\n')
//         //We backtrack to try and find the exact start line
//         for (let i=0; i < (2*snippeetLineOCount); i++){
//             var realIndex = Math.max(0, endLine-i); 
//             var normalizedSnippetss = snippeetList[0];
//             var normalizedLiness = lines[realIndex];
//             try{
//                 normalizedSnippetss = snippeetList[0].replace(/[ \t]/g, '');
//                 normalizedLiness = lines[realIndex].replace(/[ \t]/g, '');
//             }catch(e){
//                 console.log("Error in findCodeSnippetLocation", e);
//             }
//             if (normalizedSnippetss=== normalizedLiness){
//                 //We check if the snippet is the same as the snippet in the codebase
//                 if (lines.slice(endLine-i, endLine).join('\n') === snippet){
//                     console.log("FindcodeippetI am giving you this guy as From First", endLine-realIndex, " and ", endLine);
//                     return { found: true, startLine: endLine-realIndex, endLine: endLine };
//                 }else{
//                     continue;
//                 }
//             }
//         }
//         console.log("FindcodeippetI am giving you this guy as From Second", (snippeetLineOCount-1), endLine, { found: true, startLine: endLine-snippeetLineOCount, endLine: endLine });
//         return { found: true, startLine: endLine-(snippeetLineOCount-1), endLine: endLine };
//     }
//     console.log("FindcodeippetI am giving you this guy as From Third", { found: false, startLine: -1, endLine: -1 });
//     return { found: false, startLine: -1, endLine: -1 };
// }
// Helper function to find the location of the snippet
function findCodeSnippetLocation(snippet, codebase) {
    console.log("Snippet is ", snippet);
    // Helper function to normalize code
    function normalizeCode(text) {
        return text
            .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') // Remove comments
            .replace(/\*/g, '') // Remove asterisks used for formatting
            .replace(/\s+/g, ''); // Remove all whitespace
    }
    const normalizedSnippet = normalizeCode(snippet);
    const normalizedCodebase = normalizeCode(codebase);
    const lines = codebase.split('\n');
    var snippeetLineOCount = snippet.split('\n').length;
    // First find if snippet exists in codebase
    const snippetIndex = normalizedCodebase.indexOf(normalizedSnippet);
    if (snippetIndex === -1) {
        return { found: false, startLine: -1, endLine: -1 };
    }
    // Work backwards from end line to find start line
    let normalizedSoFar = '';
    let endLine = -1;
    let startLine = -1;
    // Find end line first
    for (let i = 0; i < lines.length; i++) {
        normalizedSoFar += normalizeCode(lines[i]);
        if (normalizedSoFar.includes(normalizedSnippet)) {
            endLine = i;
            break;
        }
    }
    // Now work backwards from end line to find start line
    if (endLine !== -1) {
        for (let i = endLine; i >= 0; i--) {
            const section = lines.slice(i, endLine + 1).join('\n');
            const normalizedSection = normalizeCode(section);
            if (normalizedSection.includes(normalizedSnippet)) {
                startLine = i;
            }
            else if (startLine !== -1) {
                // We've found the first line where the snippet is not included
                // So the actual start line is the next line
                break;
            }
        }
    }
    console.log("Start line is ", startLine, " End line is ", endLine);
    if (startLine !== -1 && endLine !== -1) {
        var fakeStartLine = endLine - snippeetLineOCount;
        var snippeetList = snippet.split('\n');
        //We backtrack to try and find the exact start line
        for (let i = 0; i < (2 * snippeetLineOCount); i++) {
            var realIndex = Math.max(0, endLine - i);
            var normalizedSnippetss = snippeetList[0];
            var normalizedLiness = lines[realIndex];
            try {
                normalizedSnippetss = snippeetList[0].replace(/[ \t]/g, '');
                normalizedLiness = lines[realIndex].replace(/[ \t]/g, '');
            }
            catch (e) {
                console.log("Error in findCodeSnippetLocation", e);
            }
            if (normalizedSnippetss === normalizedLiness) {
                //We check if the snippet is the same as the snippet in the codebase
                if (lines.slice(endLine - i, endLine).join('\n') === snippet) {
                    console.log("FindcodeippetI am giving you this guy as From First", endLine - realIndex, " and ", endLine);
                    return { found: true, startLine: endLine - realIndex, endLine: endLine };
                }
                else {
                    continue;
                }
            }
        }
        console.log("FindcodeippetI am giving you this guy as From Second", (snippeetLineOCount - 1), endLine, { found: true, startLine: endLine - snippeetLineOCount, endLine: endLine });
        return { found: true, startLine: endLine - (snippeetLineOCount - 1), endLine: endLine };
    }
    console.log("FindcodeippetI am giving you this guy as From Third", { found: false, startLine: -1, endLine: -1 });
    return { found: false, startLine: -1, endLine: -1 };
}
/**
 * Finds the best matching range for a code snippet within a codebase using fuzzy line comparison.
 *
 * @param {string} snippet The multi-line code snippet to search for.
 * @param {string} codebase The multi-line codebase string to search within.
 * @param {number} [threshold=0.9] The minimum similarity ratio (0.0 to 1.0) required to consider a match valid. Defaults to 0.9.
 * @returns {{ found: boolean; startLine: number; endLine: number; similarity?: number }} Object indicating if found, the 0-based start/end lines, and the similarity score.
 */
function findCodeSnippetRange(snippet, codebase, threshold = 0.9) {
    // Helper function: normalizeLine
    function normalizeLine(line) {
        // Remove leading and trailing whitespace
        let normalized = line.trim();
        // Replace sequences of internal whitespace with a single space
        normalized = normalized.replace(/\s+/g, ' ');
        return normalized;
    }
    // Prepare Target Snippet
    const snippetLines = snippet.split('\n');
    let targetNormalizedLines = snippetLines.map(normalizeLine);
    // Filter out any lines that are empty strings after normalization
    targetNormalizedLines = targetNormalizedLines.filter(line => line !== '');
    const targetLength = targetNormalizedLines.length;
    // Edge Case: If targetLength is 0 (empty snippet), return not found
    if (targetLength === 0) {
        return { found: false, startLine: -1, endLine: -1 };
    }
    // Prepare Source Codebase
    const codebaseLines = codebase.split('\n');
    // Edge Case: If codebaseLines.length is less than targetLength, it's impossible to find a match
    if (codebaseLines.length < targetLength) {
        return { found: false, startLine: -1, endLine: -1 };
    }
    // Initialize State
    const bestMatch = { similarity: -1, startLine: -1, endLine: -1 };
    // Store objects containing the normalized line and its original index
    const currentWindowNormalizedItems = [];
    // Iterate with Sliding Window
    for (let lineIndex = 0; lineIndex < codebaseLines.length; lineIndex++) {
        const originalLine = codebaseLines[lineIndex];
        const normalizedLine = normalizeLine(originalLine);
        // Conditional Add: Only add non-empty normalized lines
        if (normalizedLine !== '') {
            currentWindowNormalizedItems.push({ line: normalizedLine, originalIndex: lineIndex });
        }
        // Maintain Window Size - remove oldest items if window is too large
        while (currentWindowNormalizedItems.length > targetLength) {
            currentWindowNormalizedItems.shift();
        }
        // Perform Comparison if the window has the exact target size
        if (currentWindowNormalizedItems.length === targetLength) {
            // Extract just the normalized lines for comparison
            const currentNormalizedLines = currentWindowNormalizedItems.map(item => item.line);
            // Use diffArrays for comparison
            const diffResult = Diff.diffArrays(targetNormalizedLines, currentNormalizedLines);
            // Calculate Similarity Ratio based on common lines
            let commonCount = 0;
            for (const part of diffResult) {
                if (!part.added && !part.removed) {
                    commonCount += part.count || 0;
                }
            }
            // Similarity: (2 * Common) / (Total elements in both lists)
            // Since both lists now MUST have targetLength for comparison, denominator is 2 * targetLength
            const similarity = (2.0 * commonCount) / (targetLength + targetLength); // Simplified from targetLength + currentNormalizedLines.length
            // Check Threshold and Update Best Match
            if (similarity >= threshold && similarity > bestMatch.similarity) {
                console.log("let's see the fix man", currentNormalizedLines, targetNormalizedLines);
                // The start line is the original index of the *first* item currently in the normalized window
                const matchStartLine = currentWindowNormalizedItems[0].originalIndex;
                // The end line is the index of the *last* line that was added to complete this window
                const matchEndLine = lineIndex;
                // --- Debugging Log ---
                // console.log(`Potential Match Found (Sim: ${similarity.toFixed(3)}):`);
                // console.log(` -> Normalized Window (@End Line ${matchEndLine}):`, currentNormalizedLines);
                // console.log(` -> Target Normalized:`, targetNormalizedLines);
                // console.log(` -> Calculated Range: ${matchStartLine} - ${matchEndLine}`);
                // --- End Debugging Log ---
                bestMatch.similarity = similarity;
                bestMatch.startLine = matchStartLine;
                bestMatch.endLine = matchEndLine;
                // Optimization: If we found a perfect match, we can stop early.
                if (similarity === 1.0) {
                    break;
                }
            }
        }
    }
    // Return Final Result
    if (bestMatch.startLine !== -1) {
        return {
            found: true,
            startLine: bestMatch.startLine,
            endLine: bestMatch.endLine,
            similarity: bestMatch.similarity
        };
    }
    else {
        // Check if codebase might have had fewer non-empty lines than targetLength
        const totalNonEmptyCodebaseLines = codebaseLines.map(normalizeLine).filter(line => line !== '').length;
        if (totalNonEmptyCodebaseLines < targetLength) {
            // It was impossible to form a full window
            return { found: false, startLine: -1, endLine: -1 };
        }
        // Otherwise, no match above threshold found
        return { found: false, startLine: -1, endLine: -1 };
    }
}
// --- Main Function ---
/**
 * Finds the best matching range for a code snippet within a codebase using
 * anchor-based alignment, handling LLM merge and omission errors.
 *
 * @param snippet The multi-line code snippet to search for.
 * @param codebase The multi-line codebase string to search within.
 * @param matchThreshold Minimum similarity (0.0-1.0) for direct line fuzzy match. Default 0.9.
 * @param mergeThreshold Minimum similarity (0.0-1.0) for confirming merged parts. Default 0.85.
 * @param omissionLookahead Max number of non-empty file lines to look ahead for omission check. Default 3.
 * @returns Object indicating if found, the 0-based start/end lines, and the similarity score.
 */
function findCodeRangeWithAlignment(snippet, codebase, matchThreshold = 0.9, mergeThreshold = 0.85, omissionLookahead = 3) {
    // --- Helper: Normalization ---
    function normalizeLine(line) {
        let normalized = line.trim();
        normalized = normalized.replace(/\s+/g, ' ');
        return normalized;
    }
    // --- Helper: Fuzzy Comparison ---
    function fuzzyCompareLines(line1, line2) {
        const maxLen = Math.max(line1.length, line2.length);
        if (maxLen === 0)
            return 1.0; // Both empty are identical
        // Avoid trivial matches based on shared small substrings if one line is much longer
        // Or if one is empty and the other isn't (and isn't trivially short)
        const minLen = Math.min(line1.length, line2.length);
        if ((minLen === 0 && maxLen > 5) || (minLen / maxLen < 0.3 && maxLen > 10)) {
            // Significantly different lengths, unlikely to be a good fuzzy match unless short
            // Allow comparison if both short or lengths are reasonably close
        }
        const dist = (0, fastest_levenshtein_1.distance)(line1, line2);
        const similarity = 1.0 - (dist / maxLen);
        return similarity;
    }
    // --- Helper: Recursive Merge Verification ---
    function verifyRecursiveMerge(remainingAddedPart, startIndexToCheck, // Index in fileLines to start checking FROM
    fileLines) {
        let currentAddedPart = remainingAddedPart.trim();
        let fileIdx = startIndexToCheck;
        let linesConsumedCount = 0;
        let lastConsumedOriginalIndex = -1; // Track the index of the last line successfully consumed
        while (currentAddedPart.length > 0 && fileIdx < fileLines.length) {
            // Find next non-empty file line
            while (fileIdx < fileLines.length && fileLines[fileIdx].isEmpty) {
                fileIdx++;
            }
            if (fileIdx >= fileLines.length) {
                break; // No more non-empty file lines to check
            }
            const nextFileLine = fileLines[fileIdx];
            const nextNormFile = nextFileLine.normalizedText;
            if (currentAddedPart.startsWith(nextNormFile)) {
                // Consumed this file line, update remaining part
                linesConsumedCount++;
                lastConsumedOriginalIndex = nextFileLine.originalIndex;
                currentAddedPart = currentAddedPart.substring(nextNormFile.length).trim();
                fileIdx++; // Move to check the line *after* this one next time
            }
            else {
                // Check if it's a fuzzy match instead of perfect startswith
                const fuzzySim = fuzzyCompareLines(currentAddedPart, nextNormFile);
                if (fuzzySim >= mergeThreshold && currentAddedPart.length <= nextNormFile.length + 5) { // Allow fuzzy match if it accounts for most/all of the remaining part
                    // Treat as consuming the rest of the added part
                    linesConsumedCount++;
                    lastConsumedOriginalIndex = nextFileLine.originalIndex;
                    currentAddedPart = ""; // Assume consumed
                    fileIdx++;
                }
                else {
                    // Doesn't start with the next line, verification fails here
                    return { verified: false, fileLinesConsumed: linesConsumedCount, lastOriginalIndex: lastConsumedOriginalIndex };
                }
            }
        }
        // Verification succeeds only if the entire added part was consumed
        const verified = currentAddedPart.length === 0;
        return { verified, fileLinesConsumed: linesConsumedCount, lastOriginalIndex: lastConsumedOriginalIndex };
    }
    // --- Helper: Omission Check ---
    function checkOmission(normSearchLine, currentFileIdx, fileLines) {
        let nonEmtpyLinesChecked = 0;
        let fileIdxToCheck = currentFileIdx + 1;
        while (fileIdxToCheck < fileLines.length && nonEmtpyLinesChecked < omissionLookahead) {
            if (fileLines[fileIdxToCheck].isEmpty) {
                fileIdxToCheck++;
                continue; // Skip empty file lines
            }
            nonEmtpyLinesChecked++;
            const nextNormFile = fileLines[fileIdxToCheck].normalizedText;
            const similarity = fuzzyCompareLines(normSearchLine, nextNormFile);
            if (similarity >= matchThreshold) {
                // Found a match after skipping!
                return {
                    found: true,
                    nextFileIdx: fileIdxToCheck + 1, // Continue alignment AFTER this matched line
                    matchedOriginalIndex: fileLines[fileIdxToCheck].originalIndex
                };
            }
            fileIdxToCheck++; // Check next file line
        }
        return { found: false, nextFileIdx: -1, matchedOriginalIndex: -1 }; // Not found within lookahead
    }
    // --- Phase 1: Preprocessing ---
    const rawSnippetLines = snippet.split('\n');
    // Normalize and Filter empty snippet lines upfront
    const targetNormalizedLines = rawSnippetLines.map(normalizeLine).filter(line => line !== '');
    const targetLength = targetNormalizedLines.length;
    if (targetLength === 0) {
        return { found: false, startLine: -1, endLine: -1 }; // Cannot match empty snippet
    }
    const rawCodebaseLines = codebase.split('\n');
    const fileLines = rawCodebaseLines.map((line, index) => {
        const normalized = normalizeLine(line);
        return {
            text: line,
            originalIndex: index,
            normalizedText: normalized,
            isEmpty: normalized === ''
        };
    });
    // --- Phase 2: Initialization ---
    let bestMatch = { found: false, startLine: -1, endLine: -1, similarity: -1 };
    // --- Phase 3: Finding Anchor and Attempting Alignment ---
    for (let fileOuterIdx = 0; fileOuterIdx < fileLines.length; fileOuterIdx++) {
        const potentialAnchorFileItem = fileLines[fileOuterIdx];
        // Skip empty lines as anchors
        if (potentialAnchorFileItem.isEmpty) {
            continue;
        }
        const firstSearchLineNorm = targetNormalizedLines[0];
        const anchorFileLineNorm = potentialAnchorFileItem.normalizedText;
        // Anchor Check: Does the current file line match the *first* search line (fully or partially)?
        const anchorSimilarity = fuzzyCompareLines(firstSearchLineNorm, anchorFileLineNorm);
        const startsWithAnchor = firstSearchLineNorm.startsWith(anchorFileLineNorm);
        if (anchorSimilarity >= matchThreshold || startsWithAnchor) {
            // ANCHOR FOUND (potentially) - Initiate Alignment Attempt
            let currentSearchIdx = 0;
            let currentFileIdx = fileOuterIdx;
            let potentialStartLine = potentialAnchorFileItem.originalIndex;
            let potentialEndLine = -1; // Will be updated on first successful alignment
            let alignmentSuccessful = true;
            let successfullyAlignedCount = 0;
            // --- Phase 4: Inner Alignment Loop ---
            while (currentSearchIdx < targetLength && currentFileIdx < fileLines.length) {
                const searchLineNorm = targetNormalizedLines[currentSearchIdx];
                const fileItem = fileLines[currentFileIdx];
                // Skip empty file lines during alignment
                if (fileItem.isEmpty) {
                    currentFileIdx++;
                    continue;
                }
                const fileLineNorm = fileItem.normalizedText;
                // Ensure potentialEndLine gets set on the first non-empty match
                if (potentialEndLine === -1) {
                    potentialEndLine = fileItem.originalIndex;
                }
                // Case A: Full Match Check
                const directSimilarity = fuzzyCompareLines(searchLineNorm, fileLineNorm);
                if (directSimilarity >= matchThreshold) {
                    successfullyAlignedCount++;
                    potentialEndLine = fileItem.originalIndex; // Update end line
                    currentSearchIdx++;
                    currentFileIdx++;
                    continue; // Move to next pair
                }
                // Case B: Partial Match (Merge Check)
                if (searchLineNorm.startsWith(fileLineNorm)) {
                    const addedPart = searchLineNorm.substring(fileLineNorm.length).trim();
                    if (addedPart.length > 0) {
                        const mergeResult = verifyRecursiveMerge(addedPart, currentFileIdx + 1, fileLines);
                        if (mergeResult.verified) {
                            // Confirmed Merge!
                            successfullyAlignedCount++;
                            potentialEndLine = mergeResult.lastOriginalIndex; // End line is the last merged one
                            currentSearchIdx++; // Consumed one search line
                            // Advance file pointer past the base line AND all consumed merged lines
                            currentFileIdx += (1 + mergeResult.fileLinesConsumed);
                            continue; // Move to next search line
                        }
                        else {
                            // StartsWith matched, but verification failed (LLM hallucination?)
                            // Treat as a match of the prefix ONLY.
                            successfullyAlignedCount++; // Count as aligning the prefix part
                            potentialEndLine = fileItem.originalIndex; // End line is only the prefix line
                            currentSearchIdx++; // Move to next search line
                            currentFileIdx++; // Move file pointer past the prefix line only
                            console.warn(`Alignment Warning: Snippet line ${currentSearchIdx - 1} started like file line ${fileItem.originalIndex} but suffix didn't match subsequent lines.`);
                            continue;
                        }
                    }
                    // If addedPart is empty, it should have been caught by Case A (Full Match)
                }
                // Case C: Omission Check
                const omissionResult = checkOmission(searchLineNorm, currentFileIdx, fileLines);
                if (omissionResult.found) {
                    successfullyAlignedCount++;
                    potentialEndLine = omissionResult.matchedOriginalIndex; // End line is the matched one after skipping
                    currentSearchIdx++; // Consumed one search line
                    currentFileIdx = omissionResult.nextFileIdx; // Advance file pointer PAST the matched line
                    console.warn(`Alignment Warning: Omitted file line(s) before matching snippet line ${currentSearchIdx - 1} with file line ${potentialEndLine}`);
                    continue;
                }
                // Case D: Unrecoverable Mismatch
                alignmentSuccessful = false;
                // console.log(`DEBUG: Alignment failed. Snippet line ${currentSearchIdx} ('${searchLineNorm}') did not match File line ${fileItem.originalIndex} ('${fileLineNorm}') or handle via merge/omission.`);
                break; // Break Inner loop for this anchor
            } // End Inner Alignment Loop
            // --- Phase 5: End of Alignment Attempt ---
            if (alignmentSuccessful && currentSearchIdx === targetLength) {
                // Successfully aligned the *entire* snippet
                const currentSimilarity = successfullyAlignedCount / targetLength; // Should be 1.0 if all aligned
                // Ensure end line is valid
                if (potentialEndLine === -1 && targetLength > 0) {
                    // This case shouldn't happen if alignment succeeded, but as safety:
                    potentialEndLine = potentialStartLine; // Default to start if somehow end wasn't set
                }
                // Update best match if this one is better
                if (currentSimilarity > (bestMatch.similarity ?? -1)) {
                    console.log(`DEBUG: New best match found. Start: ${potentialStartLine}, End: ${potentialEndLine}, Sim: ${currentSimilarity}`);
                    bestMatch = {
                        found: true,
                        startLine: potentialStartLine,
                        endLine: potentialEndLine,
                        similarity: currentSimilarity
                    };
                }
                // Optimization: If we found a perfect score (1.0), we can potentially stop early,
                // though other anchors might yield the same score with a different range.
                // For simplicity, let's continue checking all anchors for now.
                if (bestMatch.similarity === 1.0)
                    break; // Optional early exit
            }
            // else: Alignment failed or didn't complete fully for this anchor.
        } // End if (Anchor Found)
        // Outer loop continues to the next potential anchor line in fileLines
    } // End Outer Loop
    // --- Phase 6: Final Result ---
    return bestMatch;
}
class DiffParser {
    /**
     * Main parsing function that handles multiple blocks robustly,
     * even when markers share lines with content.
     */
    static parseBlocks(content) {
        if (!content || typeof content !== 'string') {
            return [];
        }
        // Normalize line endings consistently
        const normalizedContent = content.replace(/\r\n/g, '\n');
        const blocks = [];
        // Reset regex state before starting
        this.SEARCH_MARKER_REGEX.lastIndex = 0;
        let lastIndex = 0;
        while (true) {
            // Find the next search marker starting from `lastIndex`
            this.SEARCH_MARKER_REGEX.lastIndex = lastIndex;
            const searchMatch = this.SEARCH_MARKER_REGEX.exec(normalizedContent);
            if (!searchMatch) {
                break; // No more search markers found
            }
            const searchMarkerStart = searchMatch.index;
            const searchMarkerEnd = this.SEARCH_MARKER_REGEX.lastIndex; // Position *after* the search marker
            // Find the next divider marker starting *after* the search marker
            this.DIVIDER_MARKER_REGEX.lastIndex = searchMarkerEnd;
            const dividerMatch = this.DIVIDER_MARKER_REGEX.exec(normalizedContent);
            if (!dividerMatch) {
                // Found a search marker but no subsequent divider, stop parsing here or log warning?
                // For now, we assume this block is malformed and stop.
                console.warn(`Found SEARCH marker starting at index ${searchMarkerStart} but no subsequent DIVIDER marker.`);
                break;
            }
            const dividerMarkerStart = dividerMatch.index;
            const dividerMarkerEnd = this.DIVIDER_MARKER_REGEX.lastIndex; // Position *after* the divider marker
            // Extract the search content (between end of search marker and start of divider marker)
            const searchContent = normalizedContent.substring(searchMarkerEnd, dividerMarkerStart);
            // Find the next update marker starting *after* the divider marker
            this.UPDATE_MARKER_REGEX.lastIndex = dividerMarkerEnd;
            const updateMatch = this.UPDATE_MARKER_REGEX.exec(normalizedContent);
            let replaceContent;
            let nextSearchStartIndex;
            if (updateMatch) {
                // Make sure another SEARCH or DIVIDER doesn't appear *before* this UPDATE marker
                // Search for intervening markers strictly between dividerEnd and updateMatch.index
                this.SEARCH_MARKER_REGEX.lastIndex = dividerMarkerEnd;
                const nextSearchBeforeUpdate = this.SEARCH_MARKER_REGEX.exec(normalizedContent);
                this.DIVIDER_MARKER_REGEX.lastIndex = dividerMarkerEnd;
                const nextDividerBeforeUpdate = this.DIVIDER_MARKER_REGEX.exec(normalizedContent);
                let blockIsValid = true;
                if (nextSearchBeforeUpdate && nextSearchBeforeUpdate.index < updateMatch.index) {
                    console.warn(`Found nested SEARCH marker at index ${nextSearchBeforeUpdate.index} before UPDATE marker at index ${updateMatch.index}. Ending block before nested marker.`);
                    // Treat the block as ending just before the nested search marker
                    replaceContent = normalizedContent.substring(dividerMarkerEnd, nextSearchBeforeUpdate.index);
                    nextSearchStartIndex = nextSearchBeforeUpdate.index; // Start next search from the nested marker
                    blockIsValid = false; // Technically, this isn't a complete block as expected, but we parsed something. Let's reconsider.
                    // Let's assume the update marker *must* come before any other marker to be valid for *this* block
                    blockIsValid = false;
                }
                if (nextDividerBeforeUpdate && nextDividerBeforeUpdate.index < updateMatch.index) {
                    console.warn(`Found nested DIVIDER marker at index ${nextDividerBeforeUpdate.index} before UPDATE marker at index ${updateMatch.index}. Ending block before nested marker.`);
                    // Treat the block as ending just before the nested divider marker
                    replaceContent = normalizedContent.substring(dividerMarkerEnd, nextDividerBeforeUpdate.index);
                    nextSearchStartIndex = dividerMarkerStart; // Go back and restart search before this divider? This gets complex. Let's invalidate.
                    blockIsValid = false;
                }
                if (blockIsValid) {
                    const updateMarkerStart = updateMatch.index;
                    const updateMarkerEnd = this.UPDATE_MARKER_REGEX.lastIndex; // Position *after* the update marker
                    // Extract replace content (between end of divider marker and start of update marker)
                    replaceContent = normalizedContent.substring(dividerMarkerEnd, updateMarkerStart);
                    // The next block search should start after the current update marker
                    nextSearchStartIndex = updateMarkerEnd;
                }
                else {
                    // If invalidated by nested marker, effectively treat the UPDATE marker as not found for *this* block
                    // And reset search start point. Let's simplify: if a marker is invalidly nested, skip the block.
                    console.warn("Skipping potentially malformed block due to nested markers.");
                    lastIndex = searchMarkerEnd; // Try searching again right after the initial search marker
                    continue; // Skip adding this block and continue the loop
                }
            }
            else {
                // No update marker found after divider, treat content until the end as replace content
                // However, we need to check if another SEARCH marker appears before the end
                this.SEARCH_MARKER_REGEX.lastIndex = dividerMarkerEnd;
                const nextSearchMatch = this.SEARCH_MARKER_REGEX.exec(normalizedContent);
                if (nextSearchMatch) {
                    // Found the start of the *next* block before the end of the content
                    replaceContent = normalizedContent.substring(dividerMarkerEnd, nextSearchMatch.index);
                    nextSearchStartIndex = nextSearchMatch.index; // Start next search from the beginning of the next block
                }
                else {
                    // No subsequent markers found, replace content is everything remaining
                    replaceContent = normalizedContent.substring(dividerMarkerEnd);
                    nextSearchStartIndex = normalizedContent.length; // We've reached the end
                }
            }
            // Create the block
            // .trim() removes leading/trailing whitespace/newlines from search/replace for comparison purposes
            // originalReplace preserves the exact slice, including whitespace and newlines
            blocks.push({
                search: searchContent.trim(),
                replace: replaceContent.trim(),
                originalReplace: replaceContent,
            });
            // Prepare for the next iteration
            lastIndex = nextSearchStartIndex;
            // Safety break if index doesn't advance (e.g., regex finds zero-width match at same spot)
            if (lastIndex <= searchMarkerStart) {
                console.error("Parser stuck in a loop. Aborting.", { lastIndex, searchMarkerStart });
                break;
            }
            // Exit loop if we've processed the whole string
            if (lastIndex >= normalizedContent.length) {
                break;
            }
        }
        console.log("Blocks extracted:", blocks);
        return blocks;
    }
}
// Regexes to find markers anywhere, potentially preceded/followed by content or whitespace on the same line.
// We use capturing groups to easily get the marker text itself if needed.
// Added 'm' flag if we were using ^/$ within these for multiline matching, but here we primarily rely on finding the markers anywhere.
// Using 'g' flag to allow repeated searching with exec.
DiffParser.SEARCH_MARKER_REGEX = /(\s*[<]{3,}[\s_]*(?:SEARCH|Search|search))/g;
DiffParser.DIVIDER_MARKER_REGEX = /(\s*[=]{4,})/g;
DiffParser.UPDATE_MARKER_REGEX = /(\s*[>]{3,}[\s_]*(?:UPDATE|Update|update))/g;
exports.default = DiffParser;
//# sourceMappingURL=stringUtils.js.map