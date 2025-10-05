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
exports.GPT3QuickAction = exports.curDocument = exports.gptDiagnostics = void 0;
exports.updateGptDiagnostics = updateGptDiagnostics;
exports.resetMessageStatus = resetMessageStatus;
exports.WebSocketListner = WebSocketListner;
exports.createGPTListener = createGPTListener;
const vscode = __importStar(require("vscode"));
const stringUtils_1 = require("../utils/stringUtils");
const extension_1 = require("../extension");
const projectUtils_1 = require("../utils/projectUtils");
const sidebarUtils_1 = require("../utils/sidebarUtils");
const globalTimestamps = {
    "start": 0
};
const globalErrorToggles = {
    "start": false
};
exports.gptDiagnostics = [];
var prevGptDiagnostics = [];
function updateGptDiagnostics(newDiags, sixthDiagnostics, document) {
    exports.gptDiagnostics = [];
    exports.gptDiagnostics = [...newDiags];
}
function reSizeDiagnostics(newDiags) {
    const updatedLocDiags = [];
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        exports.curDocument = editor.document;
    }
    try {
        for (let i = 0; i <= newDiags.length - 1; i++) {
            const curDiag = newDiags[i];
            const location = (0, stringUtils_1.findMultilineSubstring)(exports.curDocument, curDiag.source);
            if (location !== null) {
                const range = new vscode.Range(new vscode.Position(location.start, 0), new vscode.Position(location.end, 0));
                const newDiagnostics = {
                    code: "GPT3",
                    message: curDiag.message,
                    range: range,
                    severity: vscode.DiagnosticSeverity.Information,
                    source: exports.curDocument.getText(range),
                    relatedInformation: [
                        new vscode.DiagnosticRelatedInformation(new vscode.Location(exports.curDocument.uri, range), curDiag.fix_instruction)
                    ],
                    fix: curDiag.fix
                };
                const isDuplicate = exports.gptDiagnostics.some(existingObject => {
                    // Implement your custom comparison logic here
                    // For simplicity, we are comparing the 'id' property
                    return existingObject.range === newDiagnostics.range;
                });
                if (!isDuplicate) {
                    updatedLocDiags.push(newDiagnostics);
                }
            }
        }
    }
    catch (e) {
    }
    return updatedLocDiags;
}
function resetMessageStatus() {
    globalTimestamps[exports.curDocument.fileName] = 0;
}
function createFileSenderCOnnector(context, websocket) {
    setInterval(() => {
        const editor = vscode.window.activeTextEditor;
        var apiKey;
        const realApikey = (0, projectUtils_1.getDataFromCache)(context, projectUtils_1.APIKEY, "");
        const tempApikey = (0, projectUtils_1.getDataFromCache)(context, projectUtils_1.TEMP_APIKEY, "");
        if (realApikey) {
            apiKey = realApikey;
        }
        else {
            apiKey = tempApikey;
        }
        if (editor) {
            exports.curDocument = editor.document;
        }
        if (exports.curDocument && exports.curDocument.fileName.endsWith("py")
            || exports.curDocument.fileName.endsWith("js")
            || exports.curDocument.fileName.endsWith("jsx")
            || exports.curDocument.fileName.endsWith("go")
            || exports.curDocument.fileName.endsWith("ts")
            || exports.curDocument.fileName.endsWith("tsx")
            || exports.curDocument.fileName.endsWith("php")
            || exports.curDocument.fileName.endsWith("php3")
            || exports.curDocument.fileName.endsWith("php4")
            || exports.curDocument.fileName.endsWith("php5")
            || exports.curDocument.fileName.endsWith("inc")) {
            if (globalTimestamps[exports.curDocument.fileName] !== undefined) {
                if ((new Date().getTime() - globalTimestamps[exports.curDocument.fileName]) > 60000) {
                    // globalWss.send(JSON.stringify({
                    //     "command":"PREDICT",
                    //     "code": curDocument.getText(), 
                    //     "filename": curDocument.fileName, 
                    //     "apikey": apiKey, 
                    //     "vscode_version": "0.1.30"
                    // }));
                    globalTimestamps[exports.curDocument.fileName] = new Date().getTime();
                    vscode.window.showInformationMessage(`Detecting security vulnerabilities in ${exports.curDocument.fileName} hold on...`);
                }
                else {
                }
            }
            else {
                var apiKey;
                const realApikey = (0, projectUtils_1.getDataFromCache)(context, projectUtils_1.APIKEY, "");
                const tempApikey = (0, projectUtils_1.getDataFromCache)(context, projectUtils_1.TEMP_APIKEY, "");
                if (realApikey) {
                    apiKey = realApikey;
                }
                else {
                    apiKey = tempApikey;
                }
                createGPTListener(websocket, exports.curDocument, extension_1.sixthDiagnostics);
                //    globalWss.send(JSON.stringify({
                //         "command":"PREDICT",
                //         "code": curDocument.getText(),
                //         "filename": curDocument.fileName, 
                //         "apikey": apiKey, 
                //         "vscode_version": "0.1.30"
                //     }));
                globalTimestamps[exports.curDocument.fileName] = new Date().getTime();
                //vscode.window.showInformationMessage(`Detecting security vulnerabilities in ${curDocument.fileName} hold on...`);
            }
        }
    }, 10000);
}
function WebSocketListner(websocket, context, sixthDiagnostics) {
    setInterval(() => {
        if (exports.curDocument !== null) {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                exports.curDocument = editor.document;
            }
            sixthDiagnostics.set(exports.curDocument.uri, reSizeDiagnostics(exports.gptDiagnostics));
            (0, extension_1.setSideBarDiag)((0, sidebarUtils_1.gptDiagnosticsToSideNav)(exports.gptDiagnostics));
            //vscode.window.showInformationMessage(`Vulnerability Detection Done for ${vscode.window.activeTextEditor?.document.fileName}`);
        }
        else {
        }
    }, 2000);
    createFileSenderCOnnector(context, websocket);
    vscode.workspace.onDidOpenTextDocument(doc => {
        exports.curDocument = doc;
    });
}
function createGPTListener(ws, document, collection) {
    ws.onmessage = (event) => {
        const json = JSON.parse(event.data.toString());
        if (json["flag"] === "ERROR") {
            globalErrorToggles[document.fileName] = true;
        }
        else {
            if (json["needs_modal"] === true || json["flag"] === "INFO") {
                const header = "Update The Vscode Extension";
                const options = {
                    detail: json["message"],
                    modal: true,
                };
                vscode.window
                    .showInformationMessage(header, options, ...["update"])
                    .then((item) => {
                    if (item === "update") {
                        var updateURL = "https://marketplace.visualstudio.com/items?itemName=Sixth.sixth&ssr=false#overview";
                        vscode.env.openExternal(vscode.Uri.parse(updateURL));
                    }
                });
            }
            globalErrorToggles[document.fileName] = false;
        }
        const parsedData = json["message"];
        try {
            if (parsedData.fix.replace(/\s/g, "") !== "NO" && parsedData.fix.replace(/\s/g, "") !== "#NO") {
                const range = new vscode.Range(new vscode.Position(parsedData.start_line, 0), new vscode.Position(parsedData.end_line, 0));
                const newDiagnostics = {
                    funcName: parsedData.function_name,
                    fileName: parsedData.filename,
                    code: "GPT3",
                    message: parsedData.cause + "\n" + parsedData.fix_instruction,
                    range: range,
                    severity: vscode.DiagnosticSeverity.Information,
                    source: exports.curDocument.getText(range),
                    relatedInformation: [
                        new vscode.DiagnosticRelatedInformation(new vscode.Location(document.uri, range), parsedData.cause + "\n" + parsedData.fix_instruction)
                    ],
                    fix: parsedData.fix
                };
                const isDuplicate = exports.gptDiagnostics.some(existingObject => {
                    // Implement your custom comparison logic here
                    // For simplicity, we are comparing the 'id' property
                    return existingObject.range === newDiagnostics.range;
                });
                if (!isDuplicate) {
                    const editor = vscode.window.activeTextEditor;
                    if (editor) {
                        exports.curDocument = editor.document;
                        if (parsedData.filename === exports.curDocument.fileName) {
                            exports.gptDiagnostics.push(newDiagnostics);
                        }
                    }
                }
            }
        }
        catch (e) {
        }
    };
}
class GPT3QuickAction {
    provideCodeActions(document, range, context) {
        const actualDiag = exports.gptDiagnostics.filter(diagnostic => diagnostic.source === document.getText(range))[0];
        const codeActions = [];
        if (actualDiag) {
            try {
                const gptFix = this.createSixthGPTFix(document, range, actualDiag.fix, extension_1.sixthDiagnostics, actualDiag.funcName);
                codeActions.push(gptFix);
            }
            catch (e) {
            }
        }
        return codeActions;
    }
    createSixthGPTFix(document, range, acutalFix, collection, funcName) {
        const fix = new vscode.CodeAction(`Sixth's code recommendation to fix vulnerability`, vscode.CodeActionKind.QuickFix);
        fix.command = { command: `UPDATE_PREV_DIAGNOSTICS`, title: 'Reload diagnostics', tooltip: '', arguments: [{ gptDiagnostics: exports.gptDiagnostics, range: range, document: document, collection: collection, code: document.getText(range), acutalFix: acutalFix, funcName: funcName }] };
        return fix;
    }
}
exports.GPT3QuickAction = GPT3QuickAction;
GPT3QuickAction.providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix
];
//# sourceMappingURL=socketListener.js.map