const vscode = require('vscode');

async function PassLanguage(document) {
    try {
        const languageId = document.languageId;
        console.log("Processing document with language:", languageId);

        // Map of language IDs to their required extensions
        const languageExtensions = {
            'javascript': 'vscode.javascript',
            'typescript': 'vscode.typescript-language-features',
            'python': 'ms-python.python',
            'go': 'golang.go',
            'php': 'vscode.php',
            'java': 'redhat.java',
            'csharp': 'ms-dotnettools.csharp',
            'ruby': 'rebornix.ruby',
            'rust': 'rust-lang.rust-analyzer',
            'cpp': 'ms-vscode.cpptools',
            'c': 'ms-vscode.cpptools'
        };

        // Check if language extension is installed
        const extension = languageExtensions[languageId];
        if (extension) {
            const isExtensionInstalled = vscode.extensions.getExtension(extension);
            if (!isExtensionInstalled) {
                console.log(`Required extension ${extension} for ${languageId} is not installed`);
            }
        }

        // Wait for language server to be ready if needed
        await ensureLanguageServerReady(languageId);

        // Try multiple symbol provider approaches
        const symbols = await tryGetSymbols(document);
        
        if (!symbols || symbols.length === 0) {
            console.log(`No symbols found for ${document.fileName}, trying fallback methods...`);
            return await handleFallbackParsing(document, languageId);
        }

        return processSymbols(symbols, document);

    } catch (error) {
        console.error('Error in PassLanguage:', error);
        return { functions: [], classes: [] };
    }
}

async function ensureLanguageServerReady(languageId) {
    // Add delay for certain languages that need time to initialize their language servers
    const delayLanguages = ['java', 'python', 'rust'];
    if (delayLanguages.includes(languageId)) {
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

async function tryGetSymbols(document) {
    // Try different symbol provider commands
    const commands = [
        'vscode.executeDocumentSymbolProvider',
        'vscode.executePrepareCallHierarchy' // Alternative symbol detection for some languages
    ];

    for (const command of commands) {
        try {
            const symbols = await vscode.commands.executeCommand(command, document.uri);
            if (symbols && symbols.length > 0) {
                return symbols;
            }
        } catch (error) {
            console.log(`Failed to get symbols using ${command}:`, error.message);
        }
    }

    return null;
}

async function handleFallbackParsing(document, languageId) {
    // Language-specific parsing strategies
    const strategies = {
        'javascript': () => parseWithRegex(document, /function\s+(\w+)\s*\([^)]*\)\s*{/g),
        'python': () => parseWithRegex(document, /def\s+(\w+)\s*\([^)]*\):/g),
        'php': () => parseWithRegex(document, /function\s+(\w+)\s*\([^)]*\)\s*{/g),
        'ruby': () => parseWithRegex(document, /def\s+(\w+)/g),
        'go': () => parseWithRegex(document, /func\s+(\w+)\s*\([^)]*\)\s*{/g),
        'java': () => parseWithRegex(document, /(public|private|protected|static|\s) +[\w\<\>\[\]]+\s+(\w+) *\([^\)]*\) *(\{?|[^;])/g),
        'cpp': () => parseWithRegex(document, /\w+\s+(\w+)\s*\([^)]*\)\s*{/g),
        'c': () => parseWithRegex(document, /\w+\s+(\w+)\s*\([^)]*\)\s*{/g)
    };

    const parser = strategies[languageId];
    if (parser) {
        return await parser();
    }

    console.log(`No fallback parser available for language: ${languageId}`);
    return { functions: [], classes: [] };
}

function parseWithRegex(document, regex) {
    const text = document.getText();
    const functions = [];
    const classes = [];

    let match;
    while ((match = regex.exec(text)) !== null) {
        const position = document.positionAt(match.index);
        const line = position.line + 1;
        const name = match[1];

        // Find the end of the function by matching braces
        let endLine = line;
        if (text[match.index + match[0].length - 1] === '{') {
            let braceCount = 1;
            let pos = match.index + match[0].length;
            while (braceCount > 0 && pos < text.length) {
                if (text[pos] === '{') braceCount++;
                if (text[pos] === '}') braceCount--;
                if (braceCount === 0) {
                    endLine = document.positionAt(pos).line + 1;
                }
                pos++;
            }
        }

        functions.push({
            type: "func",
            name: name,
            code: document.getText(new vscode.Range(
                new vscode.Position(line - 1, 0),
                new vscode.Position(endLine - 1, Number.MAX_VALUE)
            )),
            startLine: line,
            endLine: endLine
        });
    }

    return { functions, classes };
}

function processSymbols(symbols, document) {
    const functions = [];
    const classes = [];

    function processSymbol(symbol) {
        if (!symbol || !symbol.range) return;

        const startLine = symbol.range.start.line + 1;
        const endLine = symbol.range.end.line + 1;
        const code = document.getText(symbol.range);
        if (symbol.kind === vscode.SymbolKind.Function || 
            symbol.kind === vscode.SymbolKind.Method) {
            functions.push({
                type: "func",
                name: symbol.name,
                code: code,
                startLine: startLine,
                endLine: endLine
            });
        } else if (symbol.kind === vscode.SymbolKind.Class) {
            classes.push({
                type: "class",
                name: symbol.name,
                code: code,
                startLine: startLine,
                endLine: endLine
            });
        }

        if (symbol.children) {
            symbol.children.forEach(processSymbol);
        }
    }

    symbols.forEach(processSymbol);
    return { functions, classes };
}



module.exports = {
    PassLanguage
};