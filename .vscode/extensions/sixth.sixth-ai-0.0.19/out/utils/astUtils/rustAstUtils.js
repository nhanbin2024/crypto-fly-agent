const Parser = require('web-tree-sitter');
const path = require('path');

let parser = null;
let rustLanguage = null;

// Asynchronous initialization function
async function initializeRustParser() {
    if (parser && rustLanguage) {
        return; // Already initialized
    }
    try {
        await Parser.init(); // Initialize the Parser WASM module
        parser = new Parser();
        const wasmPath = path.join(__dirname, '../../parsers/tree-sitter-rust.wasm');
        rustLanguage = await Parser.Language.load(wasmPath);
        parser.setLanguage(rustLanguage);
        console.log("Rust parser initialized successfully.");
    } catch (error) {
        console.error("Error initializing Rust parser:", error);
        parser = null; // Reset on error
        rustLanguage = null;
    }
}

// Helper function to extract function/method details
function extractFunctionDetails(node, code) {
    let name = '';
    let bodyNode = null;

    // Find identifier (name) and body
    for (const child of node.namedChildren) {
        if (child.type === 'identifier') { // Function/method name
            name = child.text;
        } else if (child.type === 'block') { // Body block
            bodyNode = child;
        }
    }

    if (!name) return null; // Need a name

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

// Rust uses `impl` blocks for methods, not traditional classes.
// We'll extract functions within `impl` blocks and associate them conceptually.
// For simplicity, we won't create a separate 'class' structure here,
// but just add methods found in impl blocks to the main functions list.
// A more complex approach could group them by the type in the impl block.

async function parseRustCode(code) {
    await initializeRustParser(); // Ensure parser is ready

    if (!parser || !rustLanguage) {
        console.error("Rust parser not initialized. Cannot parse code.");
        return { functions: [], classes: {} }; // Return empty on failure
    }

    const functions = [];
    const classes = {}; // Keep classes empty for Rust

    try {
        const tree = parser.parse(code);
        const cursor = tree.walk();

        function traverse() {
            const node = cursor.currentNode;

            // --- Identify Functions (standalone or within impl) ---
            if (node.type === 'function_item') {
                const funcInfo = extractFunctionDetails(node, code);
                if (funcInfo) {
                    functions.push(funcInfo);
                }
                // Don't traverse deeper into function bodies from the main traversal
                // to avoid potential infinite loops if traverse is called recursively inside helpers
                 return false;
            }

            // --- Traverse Children ---
            // We need to traverse into impl blocks to find function_items (methods)
            if (cursor.gotoFirstChild()) {
                do {
                    if (!traverse()) {
                         // If traverse returns false (e.g., it processed a function),
                         // we still need to check siblings, but don't go deeper into that node.
                         // However, the standard traverse logic handles this by returning false
                         // and letting the loop continue with gotoNextSibling.
                         // The explicit gotoParent/return true logic might be overly complex here.
                         // Let's simplify: just continue traversal unless an error occurs.
                         // If a node type signifies we should stop descending (like function_item),
                         // the check at the top of traverse() handles it.
                    }
                } while (cursor.gotoNextSibling());
                cursor.gotoParent();
            }
             return true; // Indicate successful traversal of this node and its children
        }

        traverse(); // Start traversal from root

    } catch (e) {
        console.error("Error parsing Rust code:", e);
        return { functions: [], classes: {} };
    }

    // Filter out potential duplicates if methods are somehow caught twice (unlikely with current logic)
    // const uniqueFunctions = Array.from(new Map(functions.map(f => [f.name + '@' + f.startLine, f])).values());

    return { functions: functions, classes };
}

// Export the function for CommonJS
module.exports = { parseRustCode };
