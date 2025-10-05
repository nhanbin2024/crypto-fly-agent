const Parser = require('web-tree-sitter');
const path = require('path');

let parser = null;
let cppLanguage = null;

// --- Initialization ---
async function initializeCppParser() {
    if (parser && cppLanguage) return;
    try {
        await Parser.init();
        parser = new Parser();
        const wasmPath = path.join(__dirname, '../../parsers/tree-sitter-cpp.wasm');
        cppLanguage = await Parser.Language.load(wasmPath);
        parser.setLanguage(cppLanguage);
        console.log("C++ parser initialized successfully.");
    } catch (error) {
        console.error("Error initializing C++ parser:", error);
        parser = null;
        cppLanguage = null;
    }
}

// --- Helper: Find Name Node ---
// Recursively searches within declarators for the primary name identifier node
function findNameNode(node) {
    if (!node) return null;

    // Base cases for different name types
    if (node.type === 'identifier' || // e.g., main
        node.type === 'field_identifier' || // e.g., add (method)
        node.type === 'type_identifier' || // e.g., Calculator (class name)
        node.type === 'operator_name' || // e.g., operator+
        node.type === 'destructor_name') { // e.g., ~Calculator
        return node;
    }

    // Handle qualified names (Namespace::Class::func) -> find the last part
    if (node.type === 'qualified_identifier') {
        return findNameNode(node.childForFieldName('name'));
    }
    // Handle template functions/classes (template<...> name) -> find the name part
    if (node.type === 'template_function' || node.type === 'template_declaration' || node.type === 'template_instantiation') {
       return findNameNode(node.childForFieldName('name'));
    }

    // Recurse through common declarator types using the 'declarator' field
    if (node.type === 'pointer_declarator' || node.type === 'reference_declarator' ||
        node.type === 'function_declarator' || node.type === 'array_declarator' ||
        node.type === 'parenthesized_declarator' || node.type === 'operator_cast_declarator') {
       return findNameNode(node.childForFieldName('declarator'));
    }

    // Fallback: Check direct named children if specific fields didn't match
    // (Less reliable, but might catch edge cases)
    for (const child of node.namedChildren) {
        const found = findNameNode(child);
        if (found) return found;
    }

    return null;
}

// --- Helper: Extract Function/Method Details ---
function extractFunctionDetails(node, code) {
    let name = '';
    let declaratorNode = node.childForFieldName('declarator');

    if (declaratorNode) {
        const nameNode = findNameNode(declaratorNode);
        if (nameNode) {
            name = nameNode.text;
        }
    }

    // Handle template functions where the name might be directly under the definition
    if (!name && node.type === 'template_function') {
         const nameNode = findNameNode(node.childForFieldName('name'));
         if (nameNode) name = nameNode.text;
    }

    if (!name) {
        // console.warn("Could not find C++ function/method name for node:", node.type, node.text.substring(0, 80));
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

// --- Helper: Extract Class/Struct Details ---
function extractClassInfo(node, code) {
    let name = '';
    let nameNode = node.childForFieldName('name'); // class_specifier, struct_specifier usually have 'name' field
    let bodyNode = node.childForFieldName('body'); // Usually 'field_declaration_list'

    if (nameNode?.type === 'type_identifier') {
        name = nameNode.text;
    } else {
        // Fallback for templates or unusual structures
        nameNode = node.namedChildren.find(c => c.type === 'type_identifier');
        if (nameNode) name = nameNode.text;
    }

    if (!name) {
        // console.warn("Could not find C++ class/struct name for node:", node.type, node.text.substring(0, 50));
        return null;
    }
    if (!bodyNode) {
         // console.warn("Could not find C++ class/struct body for:", name);
         bodyNode = node.namedChildren.find(c => c.type === 'field_declaration_list'); // Try finding body again
         if (!bodyNode) return null; // Cannot proceed without body
    }


    const startLine = node.startPosition.row;
    const endLine = node.endPosition.row;
    const classCode = code.substring(node.startIndex, node.endIndex);
    const methods = [];

    // Iterate through members in the class body
    for (const member of bodyNode.namedChildren) {
        // Look for function definitions (methods)
        if (member.type === 'function_definition') {
            const methodInfo = extractFunctionDetails(member, code);
            // Exclude constructors and destructors
            if (methodInfo && methodInfo.name !== name && !methodInfo.name.startsWith('~')) {
                methods.push(methodInfo);
            }
        }
        // Could add template_declaration containing function_definition here if needed
    }

    return {
        type: "class", // Treat struct/class similarly
        name,
        code: classCode,
        startLine: startLine + 1,
        endLine: endLine + 1,
        functions: methods,
    };
}

// --- Main Parsing Function ---
async function parseCppCode(code) {
    await initializeCppParser();
    if (!parser || !cppLanguage) {
        console.error("C++ parser not initialized. Cannot parse code.");
        return { functions: [], classes: {} };
    }

    const functions = [];
    const classes = {};

    try {
        const tree = parser.parse(code);

        // Iterate through top-level nodes
        for (const node of tree.rootNode.children) {
            // Standalone function definitions
            if (node.type === 'function_definition') {
                const funcInfo = extractFunctionDetails(node, code);
                if (funcInfo) {
                    functions.push(funcInfo);
                }
            }
            // Class or struct definitions
            else if (node.type === 'class_specifier' || node.type === 'struct_specifier') {
                const classInfo = extractClassInfo(node, code);
                if (classInfo) {
                    classes[classInfo.name] = classInfo;
                }
            }
             // Handle template declarations containing functions or classes
             else if (node.type === 'template_declaration') {
                 const declaration = node.namedChild(1); // The actual class or function definition
                 if (declaration) {
                     if (declaration.type === 'function_definition') {
                         const funcInfo = extractFunctionDetails(declaration, code);
                         if (funcInfo) functions.push(funcInfo);
                     } else if (declaration.type === 'class_specifier' || declaration.type === 'struct_specifier') {
                         const classInfo = extractClassInfo(declaration, code);
                         if (classInfo) classes[classInfo.name] = classInfo;
                     }
                 }
             }
            // Could add checks for namespaces etc. if needed to find nested items
        }
    } catch (e) {
        console.error("Error parsing C++ code:", e);
        return { functions: [], classes: {} };
    }

    return { functions, classes };
}

module.exports = { parseCppCode };
