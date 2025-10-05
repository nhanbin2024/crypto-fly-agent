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
exports.extractAllNakedTexts = extractAllNakedTexts;
const vscode = __importStar(require("vscode"));
const manageTextComponent_1 = require("../commands/manageTextComponent");
const extension_1 = require("../extension");
function isJsxStringLiteral(text) {
    return text.match(/\{(?:['"`])(.*?)(?:['"`])\}/g) !== null;
}
function isNakedText(node) {
    if (!extension_1.ts) {
        throw new Error('TypeScript not found in your workspace. Please install it.');
    }
    const ALL_TAGS_TO_IGNORE = (0, manageTextComponent_1.getCustomTextComponents)();
    if (isOneOfTheseTags(node, ALL_TAGS_TO_IGNORE)) {
        return false;
    }
    if (!hasAtLeastOneJSXAncestor(node)) {
        return false;
    }
    if (extension_1.ts.isCallExpression(node.parent)) {
        return false;
    }
    if (!extension_1.ts.isJsxText(node) && !extension_1.ts.isStringLiteralLike(node)) {
        return false;
    }
    if (!isNotAPartOfProps(node)) {
        return false;
    }
    const text = node.getText().trim();
    if (text.match(/^\s*$/) !== null) {
        return false;
    }
    if (text.startsWith('{') && text.endsWith('}')) {
        if (isJsxStringLiteral(text)) {
            return false;
        }
    }
    return true;
}
function extractAllNakedTexts({ content, scriptKind, }) {
    if (!extension_1.ts) {
        console.error('TypeScript not found in your workspace. Please install it.');
        return [];
    }
    const nakedTexts = [];
    const sourceFile = extension_1.ts.createSourceFile('temp.tsx', content, extension_1.ts.ScriptTarget.Latest, true, scriptKind);
    function visit(node) {
        if (isNakedText(node)) {
            const start = node.getStart();
            const end = node.getEnd();
            const trimmedStart = content.substring(start).search(/\S/);
            const trimmedEnd = content.substring(0, end).match(/\S\s*$/)?.index;
            if (trimmedStart !== -1 && trimmedEnd !== undefined) {
                const text = content.substring(start + trimmedStart, end - (end - trimmedEnd) + 1);
                const startPosition = sourceFile.getLineAndCharacterOfPosition(start + trimmedStart);
                const endPosition = sourceFile.getLineAndCharacterOfPosition(end - (end - trimmedEnd) + 1);
                const range = new vscode.Range(new vscode.Position(startPosition.line, startPosition.character), new vscode.Position(endPosition.line, endPosition.character));
                nakedTexts.push({ text, range });
            }
        }
        extension_1.ts.forEachChild(node, visit);
    }
    extension_1.ts.forEachChild(sourceFile, visit);
    return nakedTexts;
}
const hasAtLeastOneJSXAncestor = (node) => {
    if (!extension_1.ts) {
        throw new Error('TypeScript not found in your workspace. Please install it.');
    }
    if (extension_1.ts.isJsxElement(node) || extension_1.ts.isJsxSelfClosingElement(node)) {
        return true;
    }
    if (node.parent) {
        return hasAtLeastOneJSXAncestor(node.parent);
    }
    return false;
};
const isNotAPartOfProps = (node) => {
    if (!extension_1.ts) {
        throw new Error('TypeScript not found in your workspace. Please install it.');
    }
    if (extension_1.ts.isJsxAttribute(node)) {
        return false;
    }
    if (node.parent) {
        return isNotAPartOfProps(node.parent);
    }
    return true;
};
const isOneOfTheseTags = (node, tags) => {
    const tagPattern = /<([^\/\s>]+)/;
    const nodeTag = tagPattern.exec(node.getText())?.[1] ?? null;
    if (nodeTag && tags.includes(nodeTag)) {
        return true;
    }
    else {
        if (node.parent) {
            return isOneOfTheseTags(node.parent, tags);
        }
    }
    return false;
};
//# sourceMappingURL=jsx.js.map