const Parser = require('web-tree-sitter');
const path = require('path'); // Needed for resolving WASM path

let parser = null;
let goLanguage = null;

// Asynchronous initialization function
async function initializeGoParser() {
    if (parser && goLanguage) {
        return; // Already initialized
    }
    try {
        await Parser.init(); // Initialize the Parser WASM module (can be called multiple times)
        parser = new Parser();
        const wasmPath = path.join(__dirname, '../../parsers/tree-sitter-go.wasm');
        goLanguage = await Parser.Language.load(wasmPath);
        parser.setLanguage(goLanguage);
        console.log("Go parser initialized successfully.");
    } catch (error) {
        console.error("Error initializing Go parser:", error);
        parser = null; // Reset on error
        goLanguage = null;
    }
}

async function parseGOCode(code) {
    await initializeGoParser(); // Ensure parser is ready

    if (!parser || !goLanguage) {
        console.error("Go parser not initialized. Cannot parse code.");
        return { functions: [], classes: {} }; // Return empty on failure
    }

    const functions = [];
    const classes = {};

    try {
        const tree = parser.parse(code);
        for (const node of tree.rootNode.children) {
            if (node.type === "function_declaration") {
            const functionInfo = extractFunctions(node, code);
            functions.push(functionInfo);
        } else if (node.type === "type_declaration") {
            for (const childNodes of node.children) {
                if (childNodes.type === "type_spec") {
                    for (const childChildNodes of childNodes.children) {
                        if (childChildNodes.type === "struct_type") {
                            const classInfo = extractClasses(node, code);
                            classes[classInfo.name] = classInfo;
                        }
                    }
                }
            }

        } else if (node.type === "method_declaration") {
            const functionInfo = extractMethods(node, code);
            functions.push(functionInfo);
            }
        }
    } catch (error) {
        console.error("Error parsing Go code:", error);
        // Return empty or partial results depending on desired behavior
        return { functions: [], classes: {} };
    }


    return { functions, classes };
}

function extractFunctions(node, code) {
    let name = '';
    for (const child of node.children) {
        if (child.type === "identifier") {
            name = child.text;
            break;
        }
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

function extractClasses(node, code) {
    let name = '';
    for (const child of node.children) {
        if (child.type === "type_spec") {
            for (const childChild of child.children) {
                if (childChild.type === "type_identifier") {
                    name = childChild.text;
                    break;
                }
            }
        }
    }

    const startLine = node.startPosition.row;
    const endLine = node.endPosition.row;
    const functions = [];

    const functionCode = code.substring(node.startIndex, node.endIndex);

    return {
        type: "object",
        name,
        code: functionCode,
        startLine: startLine + 1,
        endLine: endLine + 1,
        functions,
    };
}

function extractMethods(node, code) {
    let name = '';
    for (const child of node.children) {
        if (child.type === "field_identifier") {
            name = child.text;
            break;
        }
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

// Export the function for CommonJS
module.exports = { parseGOCode };
