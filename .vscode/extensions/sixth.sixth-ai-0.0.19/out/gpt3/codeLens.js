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
exports.CodelensProvider = exports.curDocument = void 0;
exports.setCurDocument = setCurDocument;
exports.ensureChatProvider = ensureChatProvider;
const vscode = __importStar(require("vscode"));
const extension_1 = require("../extension");
const commands_1 = require("./commands");
const astDetector_1 = require("./astDetector");
const chatGpt4Provider_1 = require("../chatGPT4/chatGpt4Provider");
const extension_2 = require("../extension");
/**
 * CodelensProvider
 */
function setCurDocument(doc) {
    exports.curDocument = doc;
}
class CodelensProvider {
    constructor() {
        this.codeLenses = [];
        this._onDidChangeCodeLenses = new vscode.EventEmitter();
        this.onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;
        this.jsonSet = [];
        this.funNamesLinesSet = new Set();
        this.funNamesSet = new Set();
        this.curCodeLensDoc = [];
        // Initialize AstDetector - Note: curDocument might not be fully ready here,
        // but syncDocument will handle the first real update.
        this.ast = new astDetector_1.AstDetector(vscode.window.activeTextEditor?.document?.fileName || '', vscode.window.activeTextEditor?.document?.getText() || '', "DETECT_AST");
        // Subscribe to the event emitted by AstDetector when parsing is complete
        this.ast.on('astUpdated', () => {
            //console.log("AST updated event received.");
            this.generateLensesFromAstData(); // Generate lenses with new data
            this._onDidChangeCodeLenses.fire(); // Notify VS Code to refresh
        });
        // Trigger the initial asynchronous parse (don't await)
        // It will use the potentially empty initial values, syncDocument will correct it.
        this.ast.generateAst().catch(err => console.error("Initial AST generation failed:", err));
        // Setup listener for document changes
        this.setupDocumentChangeListener((0, extension_1.getExtensionContext)());
        // Also setup the listener that generates lenses when the AST is updated
        this.setupAstUpdateListener();
    }
    // This method will now handle generating the codelenses based on the latest data
    // It gets called automatically when _onDidChangeCodeLenses.fire() is invoked.
    generateLensesFromAstData() {
        this.codeLenses = []; // Clear previous lenses for the current update cycle
        const functions = this.ast.getFunctions();
        const classes = this.ast.getClasses();
        let combinedFunctions = functions || []; // Start with top-level functions
        // Add methods from classes
        if (classes) {
            for (let key in classes) {
                if (classes.hasOwnProperty(key) && classes[key] && classes[key]["functions"]) {
                    // Add class context if needed later
                    const classMethods = classes[key]["functions"].map((method) => ({
                        ...method,
                        className: key // Optionally add class name context
                    }));
                    combinedFunctions = combinedFunctions.concat(classMethods);
                }
            }
        }
        if (combinedFunctions && combinedFunctions.length > 0) {
            //console.log("Generating lenses for functions:", combinedFunctions.length);
            combinedFunctions.forEach((item) => {
                if (item && typeof item.startLine === 'number' && typeof item.endLine === 'number') {
                    // Ensure filename is associated if needed, though AstDetector holds the current filename
                    item.filename = this.ast.getFilename();
                    const range = new vscode.Range(item.startLine - 1, 0, item.endLine - 1, 0);
                    // Check if range is valid before adding lenses
                    if (range.start.line >= 0 && range.end.line >= range.start.line) {
                        this.codeLenses.push(new vscode.CodeLens(range, {
                            title: "Debug this code",
                            tooltip: "Click here to debug and fix the broken part of this function",
                            command: commands_1.DETECT_VULNERABILITY_V2,
                            arguments: [item, false, async () => {
                                    const provider = await this.ensureChatProvider();
                                    provider.webview?.postMessage({
                                        command: "special_chat_with_user",
                                        value: {
                                            id: Date.now().toString(),
                                            user_prompt: "/fix_code",
                                            code: item.code
                                        }
                                    });
                                }]
                        }));
                        this.codeLenses.push(new vscode.CodeLens(range, {
                            title: "Explain this function to me",
                            tooltip: "You don't understand what this code does anymore? Don't stress, just click this button",
                            command: commands_1.EXPLAIN_CODE,
                            arguments: [item, false, async () => {
                                    const provider = await this.ensureChatProvider();
                                    provider.webview?.postMessage({
                                        command: "special_chat_with_user",
                                        value: {
                                            id: Date.now().toString(),
                                            user_prompt: "/explain_code",
                                            code: item.code
                                        }
                                    });
                                }]
                        }));
                        this.codeLenses.push(new vscode.CodeLens(range, {
                            title: "Optimize this function's Speed",
                            tooltip: "This code takes forever to run? Let ChatGPT4 decrease the space and time complexity of this code for you! ",
                            command: commands_1.OPTIMIZE_CODE,
                            arguments: [item, false]
                        }));
                        this.codeLenses.push(new vscode.CodeLens(range, {
                            title: "Generate Doc String",
                            tooltip: "Don't stress yourself generating doc strings anymore, just click this button",
                            command: commands_1.GENERATE_DOC_STRING,
                            arguments: [item, false]
                        }));
                        this.codeLenses.push(new vscode.CodeLens(range, {
                            title: "Generate Unit test",
                            tooltip: "Unit tests shouldn't take much of your time!, don't let it either!",
                            command: commands_1.GENERATE_UNIT_TEST,
                            arguments: [item, false]
                        }));
                    }
                    else {
                        // console.warn("Skipping invalid range for lens:", item.name, range.start.line, range.end.line);
                    }
                }
                else {
                    // console.warn("Skipping item with invalid structure:", item);
                }
            });
        }
        else {
            // console.log("No functions or classes found to generate lenses for.");
        }
        // Store lenses per document - This part needs refinement
        // We should store lenses based on the document they belong to.
        // The current structure might lead to issues if multiple files are processed quickly.
        // For now, we'll update a single store, assuming provideCodeLenses filters correctly.
        var docCodeLensEntry = this.curCodeLensDoc.find(entry => entry.fileName === this.ast.getFilename());
        if (docCodeLensEntry) {
            docCodeLensEntry.codeLenses = [...this.codeLenses]; // Update existing entry
        }
        else {
            this.curCodeLensDoc.push({
                fileName: this.ast.getFilename(),
                codeLenses: [...this.codeLenses] // Add new entry
            });
        }
        // Clear the temporary array for the next update cycle
        this.codeLenses = [];
    }
    // Renamed from createASTFileListener
    setupAstUpdateListener() {
        this.ast.on('astUpdated', () => {
            //console.log("AST updated event received.");
            this.generateLensesFromAstData(); // Generate lenses with new data
            this._onDidChangeCodeLenses.fire(); // Notify VS Code to refresh
        });
    }
    // NOTE: The old createFileSenderConnector and createASTFileListener methods are removed by not including them here.
    // Renamed from createFileSenderConnector
    setupDocumentChangeListener(context) {
        // Initial sync on activation or when editor becomes active
        if (vscode.window.activeTextEditor) {
            this.syncDocument(vscode.window.activeTextEditor.document);
        }
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                this.syncDocument(editor.document);
            }
        });
        // Sync on document change
        vscode.workspace.onDidChangeTextDocument((e) => {
            if (e && e.document === vscode.window.activeTextEditor?.document) {
                // Optional: Add debounce here if needed
                this.syncDocument(e.document);
            }
        });
    }
    syncDocument(document) {
        if (!document) {
            //console.log("syncDocument called with undefined document");
            return;
        }
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document !== document) {
            // console.log("syncDocument called for non-active document, skipping.");
            return; // Only process the active document
        }
        // Check if the language is supported (Added java, c, cpp, csharp, rust)
        const supportedLanguages = ["python", "javascript", "typescript", "go", "php", "javascriptreact", "typescriptreact", "java", "c", "cpp", "csharp", "rust"];
        // Added extensions for new languages
        const supportedExtensions = [
            ".py", ".js", ".jsx", ".go", ".ts", ".tsx", ".php", ".php3", ".php4", ".php5", ".inc",
            ".java", ".c", ".h", ".cpp", ".hpp", ".cc", ".hh", ".cxx", ".hxx", ".cs", ".rs"
        ];
        const languageId = document.languageId;
        const fileName = document.fileName;
        const isSupported = supportedLanguages.includes(languageId) || supportedExtensions.some(ext => fileName.endsWith(ext));
        if (isSupported) {
            // console.log(`Syncing document: ${fileName}`);
            // Update AstDetector state
            this.ast.reset(); // Reset previous state
            this.ast.setFlag("DETECT_AST"); // Set flag if needed
            this.ast.setFilename(fileName);
            this.ast.setCode(document.getText());
            // Trigger asynchronous AST generation (don't await)
            this.ast.generateAst().catch(err => console.error(`Error during AST generation for ${fileName}:`, err));
        }
        else {
            // console.log(`Skipping sync for unsupported language/file: ${fileName} (${languageId})`);
            // Optionally clear lenses for unsupported files
            var docCodeLensEntry = this.curCodeLensDoc.find(entry => entry.fileName === fileName);
            if (docCodeLensEntry) {
                docCodeLensEntry.codeLenses = [];
                this._onDidChangeCodeLenses.fire(); // Refresh to remove lenses
            }
        }
    }
    provideCodeLenses(document, token) {
        if (vscode.workspace.getConfiguration("codelens-sample").get("enableCodeLens", true)) {
            // Find the lenses specifically for the requested document
            var docCodeLensEntry = this.curCodeLensDoc.find(entry => entry.fileName === document.fileName);
            if (docCodeLensEntry) {
                // console.log(`Providing ${docCodeLensEntry.codeLenses.length} lenses for ${document.fileName}`);
                return docCodeLensEntry.codeLenses;
            }
            else {
                // console.log(`No lenses found for ${document.fileName}`);
                return []; // No lenses generated for this doc yet or unsupported
            }
        }
        return [];
    }
    resolveCodeLens(codeLens, token) {
        // Resolve is usually fast, no changes needed here
        return codeLens;
    }
    async ensureChatProvider() {
        let provider = extension_2.chatGPT4Provider;
        if (!provider) {
            provider = new chatGpt4Provider_1.ChatGPT4Provider(true, null);
            await provider.provideChat();
            (0, extension_2.setChatGPT4Provider)(provider);
        }
        return provider;
    }
}
exports.CodelensProvider = CodelensProvider;
async function ensureChatProvider() {
    let provider = extension_2.chatGPT4Provider;
    console.log("Ensure Chat Provideprovider ", provider);
    if (!provider) {
        provider = new chatGpt4Provider_1.ChatGPT4Provider(true, null);
        await provider.provideChat();
        (0, extension_2.setChatGPT4Provider)(provider);
    }
    return provider;
}
//# sourceMappingURL=codeLens.js.map