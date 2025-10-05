const Parser = require('web-tree-sitter');
const path = require('path');

let parser = null;
let phpLanguage = null;

// Asynchronous initialization function
async function initializePhpParser() {
    if (parser && phpLanguage) {
        return; // Already initialized
    }
    try {
        await Parser.init(); // Initialize the Parser WASM module
        parser = new Parser();
        const wasmPath = path.join(__dirname, '../../parsers/tree-sitter-php.wasm');
        phpLanguage = await Parser.Language.load(wasmPath);
        parser.setLanguage(phpLanguage);
        console.log("PHP parser initialized successfully.");
    } catch (error) {
        console.error("Error initializing PHP parser:", error);
        parser = null; // Reset on error
        phpLanguage = null;
    }
}

// Helper function to extract info from common function/method nodes
function extractFunctionInfo(node, code) {
    let name = '';
    let bodyNode = null;

    // Find identifier (name) and body
    for (const child of node.children) {
        if (child.type === 'name' && child.childCount === 0) { // Simple identifier for function name
             name = child.text;
        } else if (child.type === 'identifier') { // Fallback for some structures
             name = child.text;
        } else if (child.type === 'compound_statement' || child.type === 'block') { // Body node
            bodyNode = child;
        }
    }

    // Handle anonymous functions assigned to variables (e.g., $var = function() {})
    if (!name && node.parent?.type === 'assignment_expression') {
        for (const child of node.parent.children) {
            if (child.type === 'variable_name') {
                name = child.text; // Use variable name
                break;
            }
        }
    }
     // Handle arrow functions assigned to variables (e.g., $var = fn() => ...)
     if (!name && node.type === 'arrow_function' && node.parent?.type === 'assignment_expression') {
        for (const child of node.parent.children) {
            if (child.type === 'variable_name') {
                name = child.text; // Use variable name
                break;
            }
        }
        bodyNode = node.namedChild(1); // Body is usually the second named child in arrow functions
    }


    if (!name) name = '(anonymous)'; // Default for anonymous functions not assigned

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

// Helper function to extract class info
function extractClassInfo(node, code) {
    let name = '';
    let bodyNode = null;

    for (const child of node.children) {
        if (child.type === 'name') { // Class name identifier
            name = child.text;
        } else if (child.type === 'declaration_list' || child.type === 'class_body') { // Body node
            bodyNode = child;
        }
    }

    if (!name) return null; // Skip anonymous classes or errors

    const startLine = node.startPosition.row;
    const endLine = node.endPosition.row;
    const classCode = code.substring(node.startIndex, node.endIndex);
    const methods = [];

    if (bodyNode) {
        for (const member of bodyNode.children) {
            // Look for method definitions within the class body
            if (member.type === 'method_declaration') {
                const methodInfo = extractFunctionInfo(member, code); // Reuse function extractor
                if (methodInfo) {
                    methods.push(methodInfo);
                }
            }
        }
    }

    return {
        type: "class",
        name,
        code: classCode,
        startLine: startLine + 1,
        endLine: endLine + 1,
        functions: methods, // Renamed 'methods' to 'functions' for consistency
    };
}


async function parsePhpCode(code) {
    await initializePhpParser(); // Ensure parser is ready

    if (!parser || !phpLanguage) {
        console.error("PHP parser not initialized. Cannot parse code.");
        return { functions: [], classes: {} }; // Return empty on failure
    }

    const functions = [];
    const classes = {};

    try {
        const tree = parser.parse(code);
        const cursor = tree.walk();

        function traverse() {
            const node = cursor.currentNode;

            // --- Identify Functions ---
            // Regular function definition: function name() {}
            if (node.type === 'function_definition') {
                const funcInfo = extractFunctionInfo(node, code);
                if (funcInfo) functions.push(funcInfo);
                return false; // Don't traverse deeper into this function from here
            }
            // Closure assigned to variable: $var = function() {};
            if (node.type === 'closure' && node.parent?.type === 'assignment_expression') {
                 const funcInfo = extractFunctionInfo(node, code);
                 if (funcInfo) functions.push(funcInfo);
                 return false;
            }
             // Arrow function assigned to variable: $var = fn() => ...;
             if (node.type === 'arrow_function' && node.parent?.type === 'assignment_expression') {
                const funcInfo = extractFunctionInfo(node, code);
                if (funcInfo) functions.push(funcInfo);
                return false;
           }


            // --- Identify Classes ---
            if (node.type === 'class_declaration') {
                const classInfo = extractClassInfo(node, code);
                if (classInfo) {
                    classes[classInfo.name] = classInfo;
                    // Note: Class methods are extracted within extractClassInfo
                }
                 return false; // Don't traverse deeper into the class from here
            }

            // --- Traverse Children ---
            if (cursor.gotoFirstChild()) {
                do {
                    if (!traverse()) { // If traverse returned false, skip siblings
                         cursor.gotoParent(); // Go back up before continuing sibling traversal
                         return true; // Continue traversal from parent
                    }
                } while (cursor.gotoNextSibling());
                cursor.gotoParent(); // Go back up after traversing all children
            }
             return true; // Continue traversal
        }

        traverse(); // Start traversal from root

    } catch (e) {
        console.error("Error parsing PHP code:", e);
        return { functions: [], classes: {} };
    }

    return { functions, classes };
}

// Export the function for CommonJS
module.exports = { parsePhpCode };
