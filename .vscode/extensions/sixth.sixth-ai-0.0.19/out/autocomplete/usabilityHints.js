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
exports.show_message_from_server = show_message_from_server;
const vscode = __importStar(require("vscode"));
async function show_message_from_server(kind_of_message, msg) {
    // Show a message from the server, but only once.
    let context_ = global.global_context;
    if (context_ === undefined) {
        return false;
    }
    let context = context_;
    let already_seen = context.globalState.get(`sixth.servermsg${kind_of_message}`);
    if (already_seen === undefined) {
        already_seen = "";
    }
    if (already_seen === msg) {
        return false;
    }
    if (msg === "") {
        return false;
    }
    //await context.globalState.update(`sixth.servermsg${kind_of_message}`, msg);
    let selection = await vscode.window.showInformationMessage(msg, "OK");
    return "";
}
//# sourceMappingURL=usabilityHints.js.map