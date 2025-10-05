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
exports.startValidating = void 0;
const vscode = __importStar(require("vscode"));
const jsx_1 = require("./jsx");
const changeSeverityType_1 = require("../commands/changeSeverityType");
const constants_1 = require("../utils/constants");
const startValidating = (document, scriptKind, diagnosticsCollection, severityTypeParam) => {
    const diagnostics = [];
    const text = document.getText();
    const nakedTextsWithRange = (0, jsx_1.extractAllNakedTexts)({
        content: text,
        scriptKind,
    });
    const severityType = severityTypeParam ?? (0, changeSeverityType_1.getSeverityType)() ?? constants_1.DEFAULT_SEVERITY_TYPE;
    for (const text of nakedTextsWithRange) {
        const diagnostic = new vscode.Diagnostic(text.range, `Text string "${text.text.length > 60 ? `${text.text.slice(0, 60)}...` : text.text}" must be rendered within a <Text/> or one of your custom text components.`, severityType);
        diagnostics.push(diagnostic);
    }
    diagnosticsCollection.set(document.uri, diagnostics);
};
exports.startValidating = startValidating;
//# sourceMappingURL=validator.js.map