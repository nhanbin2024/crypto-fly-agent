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
exports.REGISTER_ANALYTICS = void 0;
exports.registerAnalytics = registerAnalytics;
const vscode = __importStar(require("vscode"));
exports.REGISTER_ANALYTICS = "REGISTER_ANALYTICS";
function registerAnalytics() {
    vscode.workspace.onDidChangeTextDocument(e => {
    });
}
function extractFilePaths(filePath) {
    const regex = /\.(.+)$/;
    const match = filePath.match(regex);
    if (match) {
        const extension = match[1];
        return extension;
    }
    return "";
}
function extractFileAsStringFromFilePath(filePath) {
    const fileUri = vscode.Uri.file(filePath);
    const document = vscode.workspace.textDocuments.find(doc => doc.uri.fsPath === fileUri.fsPath);
    if (document) {
        return document.getText();
    }
    return "";
}
//# sourceMappingURL=commands.js.map