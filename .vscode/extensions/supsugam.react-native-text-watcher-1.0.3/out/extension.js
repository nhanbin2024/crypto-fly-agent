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
exports.ts = void 0;
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const validator_1 = require("./helpers/validator");
const constants_1 = require("./utils/constants");
const ActionEnum_1 = require("./enum/ActionEnum");
const manageTextComponent_1 = require("./commands/manageTextComponent");
const changeSeverityType_1 = require("./commands/changeSeverityType");
function getUserTypescript(project) {
    try {
        const tsPath = path.join(project, 'node_modules', 'typescript');
        if (fs.existsSync(tsPath)) {
            return require(tsPath);
        }
        return null;
    }
    catch (error) {
        console.error("Could not load user's TypeScript:", error);
        return null;
    }
}
// Usage
exports.ts = null;
async function activate(context) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder open.');
        throw new Error('No workspace folder open.');
    }
    const project = await getReactNativeProject(workspaceFolders);
    if (!project)
        return;
    exports.ts = getUserTypescript(project);
    if (!exports.ts) {
        vscode.window.showErrorMessage('TypeScript not found in your workspace. Please install it.');
        throw new Error('TypeScript not found in your workspace. Please install it.');
    }
    const diagnosticsCollection = vscode.languages.createDiagnosticCollection(constants_1.extensionId);
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument((document) => {
        if (document.languageId === 'typescriptreact') {
            (0, validator_1.startValidating)(document, exports.ts.ScriptKind.TSX, diagnosticsCollection);
        }
        if (document.languageId === 'javascriptreact') {
            (0, validator_1.startValidating)(document, exports.ts.ScriptKind.JSX, diagnosticsCollection);
        }
    }), vscode.workspace.onDidChangeTextDocument((event) => {
        if (event.document.languageId === 'typescriptreact') {
            (0, validator_1.startValidating)(event.document, exports.ts.ScriptKind.TSX, diagnosticsCollection);
        }
        if (event.document.languageId === 'javascriptreact') {
            (0, validator_1.startValidating)(event.document, exports.ts.ScriptKind.JSX, diagnosticsCollection);
        }
    }), vscode.workspace.onDidSaveTextDocument((document) => {
        if (document.languageId === 'typescriptreact') {
            (0, validator_1.startValidating)(document, exports.ts.ScriptKind.TSX, diagnosticsCollection);
        }
        if (document.languageId === 'javascriptreact') {
            (0, validator_1.startValidating)(document, exports.ts.ScriptKind.JSX, diagnosticsCollection);
        }
    }), vscode.commands.registerCommand(constants_1.commands.manageCustomTextComponents, async () => {
        try {
            const action = await vscode.window.showQuickPick(Object.values(ActionEnum_1.ActionEnum), { placeHolder: 'Select an action, Add or Remove Components.' });
            if (!action)
                return;
            const success = await (0, manageTextComponent_1.onManageTextComonentAction)(action);
            if (success) {
                for (const document of vscode.workspace.textDocuments) {
                    if (document.languageId === 'typescriptreact') {
                        (0, validator_1.startValidating)(document, exports.ts.ScriptKind.TSX, diagnosticsCollection);
                    }
                    if (document.languageId === 'javascriptreact') {
                        (0, validator_1.startValidating)(document, exports.ts.ScriptKind.JSX, diagnosticsCollection);
                    }
                }
            }
        }
        catch (error) {
            vscode.window.showErrorMessage('Failed to manage custom text components');
        }
    }), vscode.commands.registerCommand(constants_1.commands.changeSeverityType, async () => {
        const severityType = await vscode.window.showQuickPick(constants_1.DiagnosticSeverityAsString, {
            placeHolder: 'Select a New Severity Type',
            title: 'Severity Type for RN Text Warnings',
        });
        if (!severityType)
            return;
        const success = await (0, changeSeverityType_1.changeSeverityType)(severityType);
        if (success) {
            for (const document of vscode.workspace.textDocuments) {
                if (document.languageId === 'typescriptreact') {
                    (0, validator_1.startValidating)(document, exports.ts.ScriptKind.TSX, diagnosticsCollection);
                }
                if (document.languageId === 'javascriptreact') {
                    (0, validator_1.startValidating)(document, exports.ts.ScriptKind.JSX, diagnosticsCollection);
                }
            }
        }
    }), diagnosticsCollection);
}
async function getReactNativeProject(workspaceFolders) {
    if (!workspaceFolders?.length)
        return null;
    const rootPath = workspaceFolders[0].uri.fsPath;
    const paths = [rootPath];
    try {
        const items = fs.readdirSync(rootPath, { withFileTypes: true });
        items.forEach((item) => {
            if (item.isDirectory() && !item.name.startsWith('.')) {
                paths.push(path.join(rootPath, item.name));
            }
        });
    }
    catch (err) {
        console.error('Error reading directory:', err);
    }
    for (const folder of paths) {
        const packageJsonPath = vscode.Uri.file(path.join(folder, 'package.json'));
        try {
            const packageJsonContent = await vscode.workspace.fs.readFile(packageJsonPath);
            const packageJson = JSON.parse(packageJsonContent.toString());
            if (packageJson.dependencies?.['react-native'] &&
                packageJson.devDependencies?.['typescript']) {
                return folder; // Found a React Native project
            }
        }
        catch (err) {
            // Ignore missing package.json files
        }
    }
    return null;
}
function deactivate() { }
//# sourceMappingURL=extension.js.map