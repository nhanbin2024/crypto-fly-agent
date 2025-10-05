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
exports.global_provider = exports.LensProvider = exports.custom_code_lens = void 0;
exports.save_provider = save_provider;
exports.quick_refresh = quick_refresh;
const vscode = __importStar(require("vscode"));
const estate = __importStar(require("./estate"));
const fetchH2 = __importStar(require("fetch-h2"));
const fetchAPI = __importStar(require("./fetchAPI"));
class ExperimentalLens extends vscode.CodeLens {
    constructor(range, msg, arg0, arg1) {
        super(range, {
            title: msg,
            command: 'sixth.codeLensClicked',
            arguments: [arg0, arg1, range]
        });
    }
}
exports.custom_code_lens = null;
class LensProvider {
    constructor() {
        this.notifyCodeLensesChanged = new vscode.EventEmitter();
        this.onDidChangeCodeLenses = this.notifyCodeLensesChanged.event;
    }
    async provideCodeLenses(document) {
        const codeLensIsEnabled = vscode.workspace.getConfiguration("sixth").get("codeLens") ?? true;
        if (!codeLensIsEnabled) {
            return [];
        }
        const debug = vscode.workspace.getConfiguration("sixth").get("codeLensDebug") ?? false;
        let state = estate.state_of_document(document);
        if (!state) {
            return [];
        }
        let customization = await fetchAPI.get_prompt_customization();
        const url = fetchAPI.rust_url("/v1/code-lens");
        const request = new fetchH2.Request(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                uri: document.uri.toString(),
                debug: debug,
            }),
        });
        const response = await fetchH2.fetch(request);
        let lenses = [];
        if (response.status !== 200) {
            console.log([`${url} http status`, response.status]);
        }
        else if ("code_lens" in customization) {
            exports.custom_code_lens = customization["code_lens"];
            const this_file_lens = await response.json();
            if ("detail" in this_file_lens) {
            }
            if ("code_lens" in this_file_lens) {
                for (let i = this_file_lens["code_lens"].length - 1; i >= 0; i--) {
                    let item = this_file_lens["code_lens"][i];
                    let range = new vscode.Range(item["line1"] - 1, 0, item["line2"] - 1, 0);
                    if (item["spath"] !== "") {
                        for (const [key, lensdict] of Object.entries(exports.custom_code_lens)) {
                            lenses.push(new ExperimentalLens(range, lensdict["label"], `CUSTOMLENS:${key}`, item["spath"]));
                        }
                    }
                    else if (item["debug_string"] !== "") {
                        lenses.push(new ExperimentalLens(range, item["debug_string"], "debug", ""));
                    }
                    else {
                        console.log(["/v1/code-lens error", "no spath or debug_string"]);
                    }
                }
            }
        }
        if (state.diff_lens_pos < document.lineCount) {
            let range = new vscode.Range(state.diff_lens_pos, 0, state.diff_lens_pos, 0);
            lenses.push(new ExperimentalLens(range, "👍 Approve (Tab)", "APPROVE", ""));
            lenses.push(new ExperimentalLens(range, "👎 Reject (Esc)", "REJECT", ""));
            // lenses.push(new ExperimentalLens(range, "↻ Rerun \"" + estate.global_intent + "\" (F1)", "RERUN"));  // 🔃
        }
        state.completion_reset_on_cursor_movement = false;
        return lenses;
    }
}
exports.LensProvider = LensProvider;
exports.global_provider = null;
function save_provider(provider) {
    exports.global_provider = provider;
}
function quick_refresh() {
    if (exports.global_provider) {
        console.log(`[DEBUG]: refreshing code lens!`);
        exports.global_provider.notifyCodeLensesChanged.fire();
    }
}
//# sourceMappingURL=codeLens.js.map