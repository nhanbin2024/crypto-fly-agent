"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AstDetector = void 0;
// Import all parsers
const { parseGOCode } = require("../utils/astUtils/goAstUtils");
const { parseJavascriptCode } = require("../utils/astUtils/javascriptAstUtils");
const { parsePhpCode } = require("../utils/astUtils/phpAstUtils"); // Now uses web-tree-sitter
const { parsePythonCode } = require("../utils/astUtils/pythonAstUtils");
const { parseTypescriptCode } = require("../utils/astUtils/typescriptAstUtils"); // Now uses web-tree-sitter
const { parseJavaCode } = require("../utils/astUtils/javaAstUtils");
const { parseCCode } = require("../utils/astUtils/cAstUtils");
const { parseCppCode } = require("../utils/astUtils/cppAstUtils");
const { parseCSharpCode } = require("../utils/astUtils/csharpAstUtils");
const { parseRustCode } = require("../utils/astUtils/rustAstUtils");
const EventEmitter = require('events'); // Import EventEmitter
class AstDetector extends EventEmitter {
    constructor(filename, code, flag) {
        super(); // Call EventEmitter constructor
        this.functions = [];
        this.classes = {};
        this.code = "";
        this.filename = filename;
        this.code = code;
        this.flag = flag;
    }
    setFunction(newFunctions) {
        this.functions = newFunctions;
    }
    setClass(newClasses) {
        this.classes = newClasses;
    }
    setFilename(filename) {
        this.filename = filename;
    }
    setFlag(flag) {
        this.flag = flag;
    }
    setCode(code) {
        this.code = code;
    }
    getFunctions() {
        return this.functions;
    }
    getClasses() {
        return this.classes;
    }
    getFilename() {
        return this.filename;
    }
    getFlag() {
        return this.flag;
    }
    reset() {
        this.functions = [];
        this.classes = {};
        this.filename = '';
        this.code = '';
    }
    async generateAst() {
        if (this.filename.endsWith(".git")) {
            this.setFilename(this.filename.replace(".git", ""));
        }
        let results = null; // Initialize results to null
        try {
            if (this.filename.endsWith("js") || this.filename.endsWith("jsx")) {
                results = await parseJavascriptCode(this.code); // Use await
            }
            else if (this.filename.endsWith("go")) {
                results = await parseGOCode(this.code); // Use await
            }
            else if (this.filename.endsWith("py")) {
                results = await parsePythonCode(this.code);
            }
            else if (this.filename.endsWith(".php") || this.filename.endsWith(".php3") || this.filename.endsWith(".php4") || this.filename.endsWith(".php5")) {
                results = await parsePhpCode(this.code); // Use await
            }
            else if (this.filename.endsWith(".ts") || this.filename.endsWith(".tsx")) {
                // Pass filename to TS parser to handle TS vs TSX
                results = await parseTypescriptCode(this.code, this.filename);
            }
            else if (this.filename.endsWith(".java")) {
                console.log(`AstDetector: Attempting to parse Java file: ${this.filename}`); // Log dispatch
                results = await parseJavaCode(this.code);
            }
            else if (this.filename.endsWith(".c") || this.filename.endsWith(".h")) {
                console.log(`AstDetector: Attempting to parse C file: ${this.filename}`); // Log dispatch
                results = await parseCCode(this.code);
            }
            else if (this.filename.endsWith(".cpp") || this.filename.endsWith(".hpp") || this.filename.endsWith(".cc") || this.filename.endsWith(".hh") || this.filename.endsWith(".cxx") || this.filename.endsWith(".hxx")) {
                console.log(`AstDetector: Attempting to parse C++ file: ${this.filename}`); // Log dispatch
                results = await parseCppCode(this.code);
            }
            else if (this.filename.endsWith(".cs")) {
                console.log(`AstDetector: Attempting to parse C# file: ${this.filename}`); // Log dispatch
                results = await parseCSharpCode(this.code);
            }
            else if (this.filename.endsWith(".rs")) {
                console.log(`AstDetector: Attempting to parse Rust file: ${this.filename}`); // Log dispatch
                results = await parseRustCode(this.code);
            }
            else {
                console.log(`AstDetector: No parser found for file: ${this.filename}`); // Log if no match
            }
        }
        catch (e) {
            console.error(`Error during parsing dispatch for ${this.filename}:`, e);
            results = null; // Ensure results is null on error
        }
        if (results && results.functions !== undefined && results.classes !== undefined) {
            this.functions = results.functions;
            this.classes = results.classes;
        }
        else {
            // Reset if parsing failed or returned unexpected structure
            this.functions = [];
            this.classes = {};
        }
        // Emit event after updating properties
        this.emit('astUpdated');
        // Removed the recursive call logic as it seemed problematic,
        // especially in an async context. If retry logic is needed,
        // it should be handled differently.
    }
}
exports.AstDetector = AstDetector;
//# sourceMappingURL=astDetector.js.map