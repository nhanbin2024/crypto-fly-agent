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
exports.monitorChanges = monitorChanges;
exports.handleDocumentOpened = handleDocumentOpened;
exports.codeHighlightedListener = codeHighlightedListener;
const vscode = __importStar(require("vscode"));
const codeLens_1 = require("../gpt3/codeLens");
function monitorChanges() {
    vscode.workspace.onDidChangeTextDocument(handleTextDocumentChange);
}
function handleTextDocumentChange(event) {
    // Handle the text document change event here
    for (const change of event.contentChanges) {
        //console.log("Change at offset", change.range.start.line, "length", change.rangeLength, "new text:", change.text);
    }
}
function handleDocumentOpened(document) {
    (0, codeLens_1.setCurDocument)(document);
}
function codeHighlightedListener(context, onCodeHighlighted) {
    const disposable = vscode.window.onDidChangeTextEditorSelection((event) => {
        const editor = event.textEditor;
        const selections = editor.selections;
        selections.forEach(selection => {
            if (!selection.isEmpty) {
                const selectedText = editor.document.getText(selection);
                onCodeHighlighted(selectedText);
            }
            if (selections.every(selection => selection.isEmpty)) {
                onCodeHighlighted("");
            }
        });
    });
    context.subscriptions.push(disposable);
}
//# sourceMappingURL=documentSync.js.map