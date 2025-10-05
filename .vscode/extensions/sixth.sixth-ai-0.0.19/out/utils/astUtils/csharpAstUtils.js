const Parser = require('web-tree-sitter');
const path = require('path');

let parser = null;
let csharpLanguage = null;

// --- Initialization ---
async function initializeCSharpParser() {
    if (parser && csharpLanguage) return;
    try {
        await Parser.init();
        parser = new Parser();
        const wasmPath = path.join(__dirname, '../../parsers/tree-sitter-c_sharp.wasm');
        csharpLanguage = await Parser.Language.load(wasmPath);
        parser.setLanguage(csharpLanguage);
        console.log("C# parser initialized successfully.");
    } catch (error) {
        console.error("Error initializing C# parser:", error);
        parser = null;
        csharpLanguage = null;
    }
}

// --- Helper: Extract Method Details ---
// Extracts details from method_declaration nodes
function extractMethodDetails(node, code) {
    let name = '';
    let nameNode = node.childForFieldName('name'); // Method name identifier

    if (nameNode?.type === 'identifier') {
        name = nameNode.text;
    } else {
        // console.warn("Could not find C# method name identifier for node:", node.type, node.text.substring(0, 80));
        return null;
    }

    // Basic check to exclude constructors/destructors by type if needed, though name check is primary
    if (node.type === 'constructor_declaration' || node.type === 'destructor_declaration') {
        return null;
    }

    const startLine = node.startPosition.row;
    const endLine = node.endPosition.row;
    const functionCode = code.substring(node.startIndex, node.endIndex);

    return {
        type: "func", // Treat methods as functions
        name,
        code: functionCode,
        startLine: startLine + 1,
        endLine: endLine + 1,
    };
}

// --- Helper: Extract Class/Struct/Interface Details ---
// Extracts details from class_declaration, struct_declaration, interface_declaration nodes
function extractTypeInfo(node, code) {
    let name = '';
    let nodeType = 'class'; // Default
    let nameNode = node.childForFieldName('name'); // Type name identifier
    let bodyNode = node.childForFieldName('body'); // Usually declaration_list

    if (node.type.includes('struct')) nodeType = 'struct';
    if (node.type.includes('interface')) nodeType = 'interface';

    if (nameNode?.type === 'identifier') {
        name = nameNode.text;
    } else {
        // console.warn(`Could not find C# ${nodeType} name identifier for node:`, node.type, node.text.substring(0, 50));
        return null;
    }

    if (!bodyNode || bodyNode.type !== 'declaration_list') {
         // console.warn(`Could not find C# ${nodeType} body (declaration_list) for:`, name);
         // Attempt fallback if body is directly a block (less common for types)
         bodyNode = node.namedChildren.find(c => c.type === 'block');
         if (!bodyNode) return null;
    }

    const startLine = node.startPosition.row;
    const endLine = node.endPosition.row;
    const classCode = code.substring(node.startIndex, node.endIndex);
    const methods = [];

    // Iterate through members in the declaration list body
    for (const member of bodyNode.namedChildren) {
        // Look specifically for method declarations
        if (member.type === 'method_declaration') {
            const methodInfo = extractMethodDetails(member, code);
            // Exclude methods with the same name as the class (constructors)
            if (methodInfo && methodInfo.name !== name) {
                methods.push(methodInfo);
            }
        }
        // NOTE: This currently ignores properties, fields, events, delegates, local functions etc.
        // It focuses only on standard method declarations within types.
    }

    return {
        type: nodeType,
        name,
        code: classCode,
        startLine: startLine + 1,
        endLine: endLine + 1,
        functions: methods, // Consistent naming
    };
}

// --- Main Parsing Function ---
async function parseCSharpCode(code) {
    await initializeCSharpParser();
    if (!parser || !csharpLanguage) {
        console.error("C# parser not initialized. Cannot parse code.");
        return { functions: [], classes: {} };
    }

    const functions = []; // No top-level functions expected
    const classes = {}; // Store classes, structs, interfaces here

    try {
        const tree = parser.parse(code);
        const cursor = tree.walk(); // Use cursor for recursive traversal

        function traverse() {
            const node = cursor.currentNode;
            let descend = true; // Flag to control descent

            // --- Identify Types (Classes, Structs, Interfaces) ---
            if (node.type === 'class_declaration' || node.type === 'struct_declaration' || node.type === 'interface_declaration') {
                 const typeInfo = extractTypeInfo(node, code);
                 if (typeInfo) {
                     classes[typeInfo.name] = typeInfo;
                     // Methods are extracted within extractTypeInfo, so don't descend further
                     // from the main traversal into the class body here.
                     descend = false;
                 }
            }
            // NOTE: We are not looking for top-level method_declarations as they are not standard C#.

            // --- Traverse Children ---
            if (descend && cursor.gotoFirstChild()) {
                do {
                   traverse(); // Recursively traverse children
                } while (cursor.gotoNextSibling());
                cursor.gotoParent();
            }
        }

        traverse(); // Start traversal from root

    } catch (e) {
        console.error("Error parsing C# code:", e);
        return { functions: [], classes: {} };
    }

    return { functions, classes };
}

module.exports = { parseCSharpCode };
