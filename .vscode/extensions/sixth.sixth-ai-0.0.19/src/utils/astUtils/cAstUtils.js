const Parser = require('web-tree-sitter');
const path = require('path');

let parser = null;
let cLanguage = null;

// Asynchronous initialization function
async function initializeCParser() {
    if (parser && cLanguage) {
        return; // Already initialized
    }
    try {
        await Parser.init(); // Initialize the Parser WASM module
        parser = new Parser();
        const wasmPath = path.join(__dirname, '../../parsers/tree-sitter-c.wasm');
        console.log(`Attempting to load C WASM from: ${wasmPath}`); // Log the path
        cLanguage = await Parser.Language.load(wasmPath);
        parser.setLanguage(cLanguage);
        console.log("C parser initialized successfully.");
    } catch (error) {
        // Log the full error object, including stack trace if available
        console.error("Detailed error initializing C parser:", error);
        parser = null; // Reset on error
        cLanguage = null;
    }
}

// Helper function to extract function details from a function_definition node
function extractFunctionDetails(node, code) {
    let name = '';
    let declaratorNode = node.childForFieldName('declarator'); // Use field name for clarity

    // Function to find the innermost identifier within potentially nested declarators
    function findDeepestIdentifier(declarator) {
        if (!declarator) return null;
        if (declarator.type === 'identifier') {
            return declarator.text;
        }
        // Check common declarator types that might contain the identifier
        if (declarator.type === 'pointer_declarator' ||
            declarator.type === 'function_declarator' ||
            declarator.type === 'array_declarator' ||
            declarator.type === 'parenthesized_declarator')
        {
            // Recursively search within the nested declarator part
            return findDeepestIdentifier(declarator.childForFieldName('declarator'));
        }
        return null; // Identifier not found in expected structure
    }

    name = findDeepestIdentifier(declaratorNode);

    if (!name) {
        // console.warn("Could not find C function name for node:", node.text.substring(0, 50));
        return null;
    }

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

// C doesn't have classes in the same way as OOP languages.
// We won't extract structs/unions for now, focusing only on functions.

async function parseCCode(code) {
    await initializeCParser(); // Ensure parser is ready

    if (!parser || !cLanguage) {
        console.error("C parser not initialized. Cannot parse code.");
        return { functions: [], classes: {} }; // Return empty on failure
    }

    const functions = [];
    const classes = {}; // No classes in C, return empty object for consistency

    try {
        const tree = parser.parse(code);

        // Iterate through top-level nodes in the source file
        for (const node of tree.rootNode.children) {
            // Check if the top-level node is a function definition
            if (node.type === 'function_definition') {
                const funcInfo = extractFunctionDetails(node, code);
                if (funcInfo) {
                    functions.push(funcInfo);
                }
                // No need to traverse deeper into the function body from this top-level loop
            }
            // Could add checks for other top-level constructs if needed (e.g., global variables)
        }

    } catch (e) {
        console.error("Error parsing C code:", e);
        return { functions: [], classes: {} };
    }

    return { functions, classes };
}

// Export the function for CommonJS
module.exports = { parseCCode };
