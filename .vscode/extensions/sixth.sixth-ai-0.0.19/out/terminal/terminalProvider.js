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
exports.TerminalViewProvider = void 0;
const fs = __importStar(require("fs"));
const terminal_1 = require("./terminal");
class TerminalViewProvider {
    constructor(context) {
        this.context = context;
        this._extensionUri = context.extensionUri;
    }
    async resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        var html = fs.readFileSync(__dirname + "/index.html", 'utf-8');
        webviewView.webview.html = html;
        webviewView.webview.onDidReceiveMessage(async (data) => {
            if (data["command"] === "kill") {
                (0, terminal_1.sendControlC)();
            }
            if (data["command"] === "run_command") {
                (0, terminal_1.runCommand)(data['value'], (type, flag, data) => {
                    webviewView.webview.postMessage({
                        command: type,
                        value: {
                            data: data,
                            flag: flag
                        }
                    });
                });
            }
            if (data["command"] === "log_event") {
                console.log("Log Event Received ", data["value"]);
            }
        });
    }
}
exports.TerminalViewProvider = TerminalViewProvider;
TerminalViewProvider.viewType = 'sixth-terminal';
//# sourceMappingURL=terminalProvider.js.map