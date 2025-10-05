const Parser = require('web-tree-sitter');
const path = require('path'); // Needed for resolving WASM path

let parser = null;
let pyLanguage = null;

// Asynchronous initialization function
async function initializePythonParser() {
    if (parser && pyLanguage) {
        return; // Already initialized
    }
    try {
        await Parser.init(); // Initialize the Parser WASM module
        parser = new Parser();
        const wasmPath = path.join(__dirname, '../../parsers/tree-sitter-python.wasm');
        pyLanguage = await Parser.Language.load(wasmPath);
        parser.setLanguage(pyLanguage);
        console.log("Python parser initialized successfully.");
    } catch (error) {
        console.error("Error initializing Python parser:", error);
        parser = null; // Reset on error
        pyLanguage = null;
    }
}


async function parsePythonCode(code) {
    await initializePythonParser(); // Ensure parser is ready

    if (!parser || !pyLanguage) {
        console.error("Python parser not initialized. Cannot parse code.");
        return { functions: [], classes: {} }; // Return empty on failure
    }

    const functions = [];
    const classes = {};
    try {
        const tree = parser.parse(code);

        // Traverse the tree and collect function and class information
        for (const node of tree.rootNode.children) {
            if (node.type === "function_definition") {
                const functionInfo = extractFunctionInfo(node, code);
                functions.push(functionInfo);
            } else if (node.type === "class_definition") {
                const classInfo = extractClassInfo(node, code);
                classes[classInfo.name] = classInfo;
            } else if (node.type === "decorated_definition") {
                const functionInfo = extractDecoratedFunctionInfo(node, code);
                functions.push(functionInfo);
            }
        }
    } catch (e) {
        console.error("Error parsing Python code:", e);
        // Return empty results on error
        return { functions: [], classes: {} };
    }
    // Return results if try block succeeded
    return { functions, classes };
}

function extractDecoratedFunctionInfo(node,code){
  let name='';
  let functionNode=null;
  for (const child of node.children) {
    if (child.type === "function_definition") {
      functionNode=child;
      for(const childChild of child.children){
        if (childChild.type === "identifier") {
          name = childChild.text;
          
        }
      }
    const startLine = node.startPosition.row;
    const endLine = functionNode.endPosition.row;
    const functionCode = code.substring(node.startIndex, functionNode.endIndex);
    return {
      type: "func",
      name,
      code: functionCode,
      startLine: startLine+1,
      endLine: endLine+1,
    };
    }
  }
}

function extractFunctionInfo(node, code) {
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
      startLine: startLine+1,
      endLine: endLine+1,
    };
  }

  function extractClassInfo(node, code) {
    let name = '';
    for (const child of node.children) {
      if (child.type === "identifier") {
        name = child.text;
        break;
      }
    }
    
    const startLine = node.startPosition.row;
    const endLine = node.endPosition.row;
  
    const classCode = code.substring(node.startIndex, node.endIndex);
  
    const functions = [];
  
    for (const child of node.children) {
      if (child.type === "block") {
        
        for(const funcs of child.children){
            if(funcs.type==="function_definition"){
                const functionInfo = extractFunctionInfo(funcs, code);
                functions.push(functionInfo);
            }
        }
      }
    }
  
    return {
      type: "class",
      name,
      code: classCode,
      startLine: startLine+1,
      endLine: endLine+1,
      functions,
    };
  }

  // Export the function for CommonJS
module.exports = { parsePythonCode };
