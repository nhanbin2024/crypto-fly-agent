"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorQuickFixProvider = void 0;
exports.registerErrorQuickFixCommand = registerErrorQuickFixCommand;
const vscode = __importStar(require("vscode"));
const fileUtils_1 = require("../utils/fileUtils");
const extension_1 = require("../extension");
class ErrorQuickFixProvider {
    provideCodeActions(document, range, context) {
        const diagnostics = context.diagnostics;
        const actions = [];
        diagnostics.forEach(diagnostic => {
            const action = new vscode.CodeAction('Fix with Sixth AI Chat', vscode.CodeActionKind.QuickFix);
            action.command = {
                command: 'sixth.fixWithChat',
                title: 'Fix with Sixth AI Chat',
                arguments: [document, diagnostic, range]
            };
            actions.push(action);
        });
        return actions;
    }
}
exports.ErrorQuickFixProvider = ErrorQuickFixProvider;
ErrorQuickFixProvider.providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix
];
// Command handler for fixing with chat
function registerErrorQuickFixCommand(context) {
    let disposable = vscode.commands.registerCommand('sixth.fixWithChat', (document, diagnostic, range) => {
        if (!extension_1.chatGPT4Provider) {
            vscode.window.showErrorMessage('Chat provider not initialized');
            return;
        }
        const fileName = document.fileName.split('/').pop() || '';
        const fileIcon = (0, fileUtils_1.getFileIcon)(fileName);
        const startLine = diagnostic.range.start.line + 1;
        const endLine = diagnostic.range.end.line + 1;
        // Extract the problematic code
        const errorCode = document.getText(diagnostic.range);
        // Create prompt
        const prompt = buildErrorFixPrompt(diagnostic, document);
        // Create context chip HTML
        const contextChip = `
            <div class="error-context-chip">
                <span class="file-icon file-icon-light">${fileIcon}</span>
                <span class="file-name">${fileName}:${startLine}-${endLine}</span>
            </div>
        `;
        // Send to chat via ChatGPT4Provider
        extension_1.chatGPT4Provider.handleErrorFixChat(prompt, contextChip, errorCode, {
            start: startLine,
            end: endLine,
            file: document.fileName,
            fullFile: document.getText()
        });
        // Focus the chat panel
        extension_1.chatGPT4Provider.panel?.reveal();
    });
    context.subscriptions.push(disposable);
}
function getCodeContext(document, range) {
    const startLine = Math.max(0, range.start.line); // 3 lines before, but not less than 0
    const endLine = Math.min(document.lineCount - 1, range.end.line); // 3 lines after, but not beyond file end
    let contextLines = [];
    // Add lines before error
    for (let i = startLine; i < range.start.line; i++) {
        contextLines.push(document.lineAt(i).text);
    }
    // Add the error line(s)
    for (let i = range.start.line; i <= range.end.line; i++) {
        contextLines.push(document.lineAt(i).text);
    }
    // Add lines after error
    for (let i = range.end.line + 1; i <= endLine; i++) {
        contextLines.push(document.lineAt(i).text);
    }
    return contextLines.join('\n');
}
function buildErrorFixPrompt(diagnostic, document) {
    const codeContext = getCodeContext(document, diagnostic.range);
    return `For the code present in the file ${document.fileName}, we get this error:
\`\`\`
${diagnostic.message}
\`\`\`

Here's the code section causing this error:
\`\`\`${document.languageId}
${codeContext}
\`\`\`
only use this as context! not for regeneration! Propose the shortest and most concise fix, 
without regenerating any previous code when not necessary!

How can I resolve this? If you propose a fix, do not generate the entire file from scratch, 
only fix the affected section and please make it concise, remember to also use the right file name
and file path of the codes you are fixing, when proposing a fix!
`;
}
//# sourceMappingURL=quickActions.js.map