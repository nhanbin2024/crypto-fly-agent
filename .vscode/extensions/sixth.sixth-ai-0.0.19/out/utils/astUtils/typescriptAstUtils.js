const Parser = require('web-tree-sitter');
const path = require('path');

let parser = null;
let tsLanguage = null;
let tsxLanguage = null;
let isInitialized = false;

// Asynchronous initialization function
async function initializeTsParsers() {
    if (isInitialized) {
        return; // Already initialized
    }
    try {
        await Parser.init(); // Initialize the Parser WASM module
        parser = new Parser();

        const wasmTsPath = path.join(__dirname, '../../parsers/tree-sitter-typescript.wasm');
        const wasmTsxPath = path.join(__dirname, '../../parsers/tree-sitter-tsx.wasm');

        // Load both languages
        [tsLanguage, tsxLanguage] = await Promise.all([
            Parser.Language.load(wasmTsPath),
            Parser.Language.load(wasmTsxPath)
        ]);

        console.log("TypeScript/TSX parsers initialized successfully.");
        isInitialized = true;
    } catch (error) {
        console.error("Error initializing TypeScript/TSX parsers:", error);
        parser = null; // Reset on error
        tsLanguage = null;
        tsxLanguage = null;
        isInitialized = false;
    }
}

// Helper to extract function/method details
function extractFunctionDetails(node, code) {
    let name = '';
    let bodyNode = null;

    // Common patterns for finding name and body
    for (const child of node.namedChildren) { // Use namedChildren for more relevant nodes
        if (child.type === 'identifier' && child.parent === node) { // Direct identifier child for name
            name = child.text;
        } else if (child.type === 'property_identifier') { // For methods
             name = child.text;
        } else if (child.type === 'statement_block') { // Common body node type
            bodyNode = child;
        }
    }

     // Handle arrow functions in variable declarations (const/let func = () => {})
     if (!name && (node.type === 'lexical_declaration' || node.type === 'variable_declaration')) {
        let declarator = null;
        if (node.type === 'lexical_declaration') {
            declarator = node.namedChildren.find(c => c.type === 'variable_declarator');
        } else {
             declarator = node; // If node is already the declarator
        }

        if (declarator) {
            const idNode = declarator.namedChildren.find(c => c.type === 'identifier');
            const arrowFuncNode = declarator.namedChildren.find(c => c.type === 'arrow_function');
            if (idNode) {
                name = idNode.text;
            }
            if (arrowFuncNode) {
                 bodyNode = arrowFuncNode.namedChild(1); // Body is often the second named child
            }
        }
    }


    if (!name) name = '(anonymous)';

    const startLine = node.startPosition.row;
    const endLine = node.endPosition.row;
    const functionCode = code.substring(node.startIndex, node.endIndex);

    return {
        type: "func",
        name,
        code: functionCode,
        startLine: startLine + 1,
        endLine: endLine + 1,
    };
}

// Helper to extract class details
function extractClassDetails(node, code) {
    let name = '';
    let bodyNode = null;

    for (const child of node.namedChildren) {
        if (child.type === 'type_identifier') { // Class name identifier
            name = child.text;
        } else if (child.type === 'class_body') { // Body node
            bodyNode = child;
        }
    }

    if (!name) return null; // Skip anonymous classes or errors

    const startLine = node.startPosition.row;
    const endLine = node.endPosition.row;
    const classCode = code.substring(node.startIndex, node.endIndex);
    const methods = [];

    if (bodyNode) {
        for (const member of bodyNode.namedChildren) {
            // Look for method definitions within the class body
            if (member.type === 'method_definition') {
                const methodInfo = extractFunctionDetails(member, code); // Reuse function extractor
                if (methodInfo && methodInfo.name !== 'constructor') { // Exclude constructors if desired
                    methods.push(methodInfo);
                }
            }
            // Could add logic here for property arrow functions if needed
        }
    }

    return {
        type: "class",
        name,
        code: classCode,
        startLine: startLine + 1,
        endLine: endLine + 1,
        functions: methods, // Keep consistent naming
    };
}


// Modified parseTypescriptCode to accept filename
async function parseTypescriptCode(code, filename) {
    await initializeTsParsers(); // Ensure parsers are ready

    if (!parser || !tsLanguage || !tsxLanguage) {
        console.error("TypeScript/TSX parser not initialized. Cannot parse code.");
        return { functions: [], classes: {} }; // Return empty on failure
    }

    // Choose the correct language based on filename extension
    const language = filename.endsWith('.tsx') ? tsxLanguage : tsLanguage;
    parser.setLanguage(language);

    const functions = [];
    const classes = {};

    try {
        const tree = parser.parse(code);
        const cursor = tree.walk();

        function traverse() {
            const node = cursor.currentNode;

            // --- Identify Functions ---
            if (node.type === 'function_declaration') {
                const funcInfo = extractFunctionDetails(node, code);
                if (funcInfo) functions.push(funcInfo);
                return false; // Don't traverse deeper
            }
             // Arrow function assigned to variable (const/let)
             if (node.type === 'lexical_declaration' && node.namedChildren.some(c => c.type === 'variable_declarator' && c.namedChildren.some(gc => gc.type === 'arrow_function'))) {
                const funcInfo = extractFunctionDetails(node, code);
                if (funcInfo) functions.push(funcInfo);
                return false; // Don't traverse deeper
            }


            // --- Identify Classes ---
            if (node.type === 'class_declaration') {
                const classInfo = extractClassDetails(node, code);
                if (classInfo) {
                    classes[classInfo.name] = classInfo;
                    // Methods are extracted within extractClassDetails
                }
                 return false; // Don't traverse deeper
            }

            // --- Traverse Children ---
             if (cursor.gotoFirstChild()) {
                do {
                    if (!traverse()) {
                         cursor.gotoParent();
                         return true; // Continue traversal from parent after skipping siblings
                    }
                } while (cursor.gotoNextSibling());
                cursor.gotoParent();
            }
             return true; // Continue traversal
        }

        traverse(); // Start traversal

    } catch (e) {
        console.error("Error parsing TypeScript/TSX code:", e);
        return { functions: [], classes: {} };
    }

    return { functions, classes };
}

// Export the function for CommonJS
module.exports = { parseTypescriptCode };
