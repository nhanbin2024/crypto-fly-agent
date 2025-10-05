"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SEVERITY_TYPE = exports.DiagnosticSeverityAsString = exports.DEFAULT_TEXT_COMPONENT = exports.VSCodeDirs = exports.extensionSettings = exports.commands = exports.extensionId = void 0;
const vscode_1 = require("vscode");
exports.extensionId = 'react-native-text-watcher';
exports.commands = {
    manageCustomTextComponents: `${exports.extensionId}.manageCustomTextComponents`,
    changeSeverityType: `${exports.extensionId}.changeSeverityType`,
};
exports.extensionSettings = {
    customTextComponents: `${exports.extensionId}.customTextComponents`,
    severityType: `${exports.extensionId}.severityType`,
};
exports.VSCodeDirs = {
    vscode: '.vscode',
    settingsJson: 'settings.json',
};
exports.DEFAULT_TEXT_COMPONENT = 'Text';
exports.DiagnosticSeverityAsString = Object.values(vscode_1.DiagnosticSeverity).filter((key) => typeof key === 'string');
exports.DEFAULT_SEVERITY_TYPE = vscode_1.DiagnosticSeverity.Warning;
//# sourceMappingURL=constants.js.map