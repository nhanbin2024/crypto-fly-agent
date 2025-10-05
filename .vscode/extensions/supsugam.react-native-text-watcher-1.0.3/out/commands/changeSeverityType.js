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
exports.getSeverityTypeAsString = exports.getSeverityType = exports.changeSeverityType = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const constants_1 = require("../utils/constants");
const string_1 = require("../helpers/string");
const changeSeverityType = async (newSeverityType) => {
    try {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder open.');
        }
        // Create .vscode directory if it doesn't exist
        const vscodeDirectory = path.join(workspaceFolder.uri.fsPath, constants_1.VSCodeDirs.vscode);
        if (!fs.existsSync(vscodeDirectory)) {
            fs.mkdirSync(vscodeDirectory);
        }
        // Create settings.json file if it doesn't exist
        const settingsJsonPath = path.join(vscodeDirectory, constants_1.VSCodeDirs.settingsJson);
        if (!fs.existsSync(settingsJsonPath)) {
            fs.writeFileSync(settingsJsonPath, '{}');
        }
        const settingsJson = fs.readFileSync(settingsJsonPath, 'utf8');
        const settings = JSON.parse(settingsJson);
        settings[constants_1.extensionSettings.severityType] = newSeverityType;
        fs.writeFileSync(settingsJsonPath, JSON.stringify(settings, null, 2));
        vscode.window.showInformationMessage(`Successfully Updated Severity Type to ${newSeverityType}.`);
        return true;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to Update Severity Type';
        vscode.window.showErrorMessage(errorMessage);
        return false;
    }
};
exports.changeSeverityType = changeSeverityType;
const getSeverityType = () => {
    try {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder open.');
        }
        const settingsJsonPath = path.join(workspaceFolder.uri.fsPath, constants_1.VSCodeDirs.vscode, constants_1.VSCodeDirs.settingsJson);
        if (!fs.existsSync(settingsJsonPath)) {
            return undefined;
        }
        const settingsJson = fs.readFileSync(settingsJsonPath, 'utf8');
        const settings = JSON.parse(settingsJson);
        const severityType = settings[constants_1.extensionSettings.severityType];
        if (!severityType || !(0, string_1.isString)(severityType)) {
            return undefined;
        }
        return vscode.DiagnosticSeverity[severityType];
    }
    catch (error) {
        return undefined;
    }
};
exports.getSeverityType = getSeverityType;
const getSeverityTypeAsString = (severity) => {
    return vscode.DiagnosticSeverity[severity];
};
exports.getSeverityTypeAsString = getSeverityTypeAsString;
//# sourceMappingURL=changeSeverityType.js.map