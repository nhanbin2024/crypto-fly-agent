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
exports.GlydeProvider = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const projectUtils_1 = require("../utils/projectUtils");
const treeNode_1 = require("../sidebars/treeNode");
const authPanel_1 = require("../auth/authPanel");
class GlydeProvider {
    constructor(context) {
        this._context = context;
    }
    provideGlydeView() {
        const extensionContext = this._context;
        const iconPath = vscode.Uri.joinPath(extensionContext.extensionUri, 'waves.png');
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
        }
        else {
            this.panel = vscode.window.createWebviewPanel('glydeView', 'Glyde', vscode.ViewColumn.One, {
                enableScripts: true,
                retainContextWhenHidden: true,
            });
            this.panel.iconPath = iconPath;
            const htmlPath = path.join(extensionContext.extensionPath, 'src', 'glyde', 'glyde.html');
            var html = fs.readFileSync(htmlPath, 'utf-8');
            html = (0, treeNode_1.fillTemplate)(html, (0, projectUtils_1.getDataFromCache)(this._context, "GLYDE_APIKEY", undefined), "GLYDE_APIKEY");
            this.panel.webview.html = html;
            this.panel.webview.onDidReceiveMessage((message) => {
                switch (message.command) {
                    case 'openUrl':
                        console.log("GOT MESSASGE!!! ", message);
                        break;
                    case 'openNewExternalPanel':
                        console.log("NEW URL WAS FOUND ", message);
                        if (message.url) {
                            if (message.url.startsWith("http")) {
                                (0, authPanel_1.openUrl)(message.url);
                            }
                            else {
                                (0, authPanel_1.openUrl)("https:" + message.url);
                            }
                        }
                        return;
                }
            }, undefined, extensionContext.subscriptions);
            this.panel.onDidDispose(() => {
                this.panel = undefined;
            });
        }
    }
}
exports.GlydeProvider = GlydeProvider;
//# sourceMappingURL=glydeProvider.js.map