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
exports.seeTerminalProvider = void 0;
const projectUtils_1 = require("../utils/projectUtils");
const extension_1 = require("../extension");
const vscode = __importStar(require("vscode"));
const fileUtils_1 = require("../utils/fileUtils");
const axiosInstance_1 = require("../utils/axiosInstance");
const api = (0, axiosInstance_1.createAxiosInstance)();
class seeTerminalProvider {
    constructor(subscriber) {
        this.subcriber = false;
        this.subcriber = subscriber;
    }
    async getTerminalCommand(prompt, isError) {
        if (!this.subcriber) {
            vscode.window.showErrorMessage("You can't perform this action as a non-subscriber. Subscribe to either our monthly/yearly plan to access this feature.");
            return null;
        }
        try {
            const response = await api.post(`/see_terminal`, {
                user_id: (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, ''),
                user_prompt: prompt,
                error: isError,
            });
            console.log(response.data, "Response from server");
            return (0, fileUtils_1.cleanCodeSnippet)(response.data.data);
        }
        catch (error) {
            console.error("Error while fetching terminal command:", error);
            vscode.window.showErrorMessage("Failed to fetch terminal command. Please try again later.");
            return null;
        }
    }
}
exports.seeTerminalProvider = seeTerminalProvider;
//# sourceMappingURL=seeTerminal.js.map