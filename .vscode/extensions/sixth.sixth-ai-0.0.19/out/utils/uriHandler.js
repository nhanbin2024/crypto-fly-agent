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
exports.SixthUriHandler = void 0;
const vscode = __importStar(require("vscode"));
const extension_1 = require("../extension");
const projectUtils_1 = require("./projectUtils");
const network_1 = require("./network");
const mainMenuProvider_1 = require("../mainMenu/mainMenuProvider");
class SixthUriHandler {
    // This function will get run when something redirects to VS Code
    // with your extension id as the authority.
    handleUri(uri) {
        let message = "";
        if (uri.query.includes("command=")) {
            message = uri.query.replace("command=", "");
        }
        if (message === "auth-jira") {
            extension_1.jiraProvider.postMessage("show_auth", "");
        }
        if (message === "payment-success") {
            (0, network_1.getUserSubscriberInfo)(async () => {
                if ((0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.ADDED_BILLING, "")) {
                    await (0, projectUtils_1.saveDataToCache)((0, extension_1.getExtensionContext)(), projectUtils_1.JWT, "1234567890");
                    if (extension_1.menuProvider) {
                        extension_1.menuProvider.dispose();
                    }
                    if (extension_1.authPanel) {
                        extension_1.authPanel.dispose();
                    }
                    var newMenuProvider = new mainMenuProvider_1.mainMenuProvider(true);
                    newMenuProvider.initWebview();
                    //await indexAllFiles()
                    extension_1.jiraProvider.getCurrentOnboardingStep();
                    vscode.window.showInformationMessage("Billing information added successfully and user has been logged in, welcome to the Sixth 😊!!", { modal: false });
                    if (extension_1.globalSidebar)
                        extension_1.globalSidebar.sendMessage({
                            "command": "upgrade_tier",
                            "value": "upgrade_tier"
                        });
                }
                else {
                    vscode.window.showInformationMessage("Something went wrong", { modal: false });
                }
            });
        }
    }
}
exports.SixthUriHandler = SixthUriHandler;
//# sourceMappingURL=uriHandler.js.map