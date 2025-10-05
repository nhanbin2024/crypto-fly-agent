const Parser = require('web-tree-sitter');
const path = require('path');

let parser = null;
let javaLanguage = null;

// --- Initialization ---
async function initializeJavaParser() {
    if (parser && javaLanguage) return;
    try {
        await Parser.init();
        parser = new Parser();
        const wasmPath = path.join(__dirname, '../../parsers/tree-sitter-java.wasm');
        javaLanguage = await Parser.Language.load(wasmPath);
        parser.setLanguage(javaLanguage);
        console.log("Java parser initialized successfully.");
    } catch (error) {
        console.error("Error initializing Java parser:", error);
        parser = null;
        javaLanguage = null;
    }
}

// --- Helper: Extract Method Details ---
function extractMethodDetails(node, code) {
    let name = '';
    let nameNode = node.childForFieldName('name');

    if (nameNode?.type === 'identifier') {
        name = nameNode.text;
    } else {
        // console.warn("Could not find Java method name identifier:", node.type, node.text.substring(0, 80));
        return null;
    }

    // Exclude constructors by type
    if (node.type === 'constructor_declaration') {
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

// --- Recursive Traversal Function ---
function findMethodsAndClassesRecursive(node, code, functions, classes) {
    // --- Identify Classes/Interfaces/Enums ---
    if (node.type === 'class_declaration' || node.type === 'interface_declaration' || node.type === 'enum_declaration') {
        let name = '';
        let nodeType = 'class'; // Default
        let nameNode = node.childForFieldName('name');
        let bodyNode = node.childForFieldName('body'); // class_body, interface_body, enum_body

        if (node.type.includes('interface')) nodeType = 'interface';
        if (node.type.includes('enum')) nodeType = 'enum';

        if (nameNode?.type === 'identifier') {
            name = nameNode.text;
        } else {
            // console.warn(`Could not find Java ${nodeType} name identifier for node:`, node.type);
            // Continue traversal even if name isn't found, might have nested types
        }

        const startLine = node.startPosition.row;
        const endLine = node.endPosition.row;
        const typeCode = code.substring(node.startIndex, node.endIndex);
        const methods = [];

        // Process the body if it exists
        if (bodyNode) {
            for (const member of bodyNode.namedChildren) {
                // Find methods directly within this type's body
                if (member.type === 'method_declaration') {
                    const methodInfo = extractMethodDetails(member, code);
                    // Exclude methods with the same name as the type (constructors)
                    if (methodInfo && methodInfo.name !== name) {
                        methods.push(methodInfo);
                    }
                }
                // Recursively find nested types and their methods
                findMethodsAndClassesRecursive(member, code, functions, classes);
            }
        }

        // Store the found type information if it has a name
        if (name) {
            classes[name] = {
                type: nodeType,
                name,
                code: typeCode,
                startLine: startLine + 1,
                endLine: endLine + 1,
                functions: methods,
            };
        }
        // We've processed this type declaration and its direct children (methods/nested types)
        // No need to descend further into *this specific node* from the outer loop
        return;
    }

    // --- Identify Standalone Methods (less common, e.g., in future Java versions?) ---
    // if (node.type === 'method_declaration' && !node.ancestors.some(a => a.type.includes('class') || a.type.includes('interface'))) {
    //     const funcInfo = extractMethodDetails(node, code);
    //     if (funcInfo) functions.push(funcInfo);
    //     return; // Don't descend further
    // }


    // --- Continue Traversal ---
    for (const child of node.namedChildren) {
        findMethodsAndClassesRecursive(child, code, functions, classes);
    }
}


// --- Main Parsing Function ---
async function parseJavaCode(code) {
    await initializeJavaParser();
    if (!parser || !javaLanguage) {
        console.error("Java parser not initialized. Cannot parse code.");
        return { functions: [], classes: {} };
    }

    const functions = []; // Usually empty for Java
    const classes = {};   // Store classes, interfaces, enums

    try {
        const tree = parser.parse(code);
        // Start recursive traversal from the root node
        findMethodsAndClassesRecursive(tree.rootNode, code, functions, classes);

    } catch (e) {
        console.error("Error parsing Java code:", e);
        return { functions: [], classes: {} };
    }

    return { functions, classes };
}

module.exports = { parseJavaCode };
