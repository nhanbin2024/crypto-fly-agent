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
exports.StateOfEditor = exports.ApiFields = exports.Mode = exports.global_intent = void 0;
exports.state_of_editor = state_of_editor;
exports.state_of_document = state_of_document;
exports.switch_mode = switch_mode;
exports.back_to_normal = back_to_normal;
exports.keyboard_events_on = keyboard_events_on;
exports.on_text_edited = on_text_edited;
exports.estate_init = estate_init;
exports.save_intent = save_intent;
const vscode = __importStar(require("vscode"));
const interactiveDiff = __importStar(require("./interactiveDiff"));
const completionProvider = __importStar(require("./completionProvider"));
const fetchAPI = __importStar(require("./fetchAPI"));
exports.global_intent = "Fix";
var Mode;
(function (Mode) {
    Mode[Mode["Normal"] = 0] = "Normal";
    Mode[Mode["Highlight"] = 1] = "Highlight";
    Mode[Mode["Diff"] = 2] = "Diff";
    Mode[Mode["DiffWait"] = 3] = "DiffWait";
    Mode[Mode["Dispose"] = 4] = "Dispose";
})(Mode || (exports.Mode = Mode = {}));
;
class ApiFields {
    constructor() {
        this.scope = "";
        this.positive = false;
        this.url = "";
        this.model = "";
        this.function = "";
        this.intent = "";
        this.sources = {};
        this.cursor_file = "";
        this.cursor_pos0 = 0;
        this.cursor_pos1 = 0;
        this.de_facto_model = "";
        this.results = {}; // filled for diff
        this.grey_text_explicitly = ""; // filled for completion
        this.grey_text_edited = ""; // user changed something within completion
        this.messages = []; // filled for chat
        this.ts_req = 0;
        this.ts_presented = 0;
        this.ts_reacted = 0;
        this.serial_number = 0;
        this.accepted = false;
        this.rejected_reason = "";
    }
}
exports.ApiFields = ApiFields;
;
class StateOfEditor {
    get_mode() {
        return this._mode;
    }
    // public data_feedback_candidate: ApiFields|undefined = undefined;
    constructor(editor) {
        this._mode = Mode.Normal;
        this.last_used_ts = 0;
        this.fn = "";
        this.highlight_json_backup = undefined;
        this.highlight_function = "";
        this.highlight_model = "";
        this.highlight_thirdparty = false;
        this.highlights = [];
        this.sensitive_ranges = [];
        this.diff_changing_doc = false;
        this.diffDecos = [];
        this.diffDeletedLines = [];
        this.diffAddedLines = [];
        this.diff_lens_pos = Number.MAX_SAFE_INTEGER;
        this.completion_lens_pos = Number.MAX_SAFE_INTEGER;
        this.completion_longthink = 0;
        this.completion_reset_on_cursor_movement = false;
        this.showing_diff_move_cursor = false;
        this.showing_diff_for_range = undefined;
        this.showing_diff_for_function = undefined;
        this.showing_diff_for_model = undefined;
        this.showing_diff_thirdparty = true;
        this.diff_load_animation_head = 0;
        this.diff_load_animation_mid = "";
        this.cursor_move_event = undefined;
        this.text_edited_event = undefined;
        this.editor = editor;
    }
    cache_clear() {
        // call on text edited, intent change
        // this.area2cache.clear();
        this.highlight_json_backup = undefined;
        this.sensitive_ranges.length = 0;
        this.highlights.length = 0;
    }
}
exports.StateOfEditor = StateOfEditor;
;
let editor2state = new Map();
function state_of_editor(editor, reqfrom) {
    if (!editor) {
        return undefined;
    }
    if (editor2state.size > 3) {
        let oldest_ts = Number.MAX_SAFE_INTEGER;
        let oldest_state = undefined;
        for (let [_, state] of editor2state) {
            if (state.last_used_ts < oldest_ts) {
                oldest_ts = state.last_used_ts;
                oldest_state = state;
            }
        }
        if (!oldest_state) {
            throw new Error("Internal error");
        }
        // console.log(["forget state of", oldest_state.editor.document.fileName, oldest_state.fn]);
        switch_mode(oldest_state, Mode.Dispose);
        editor2state.delete(oldest_state.editor);
    }
    let state = editor2state.get(editor);
    if (!state) {
        let current_editor = vscode.window.activeTextEditor;
        for (const [other_editor, other_state] of editor2state) {
            if (other_editor.document === editor.document) {
                if (other_state.editor === current_editor) {
                    console.log([reqfrom, "state return other AKA current", other_state.fn]);
                    return other_state;
                }
                if (editor === current_editor) {
                    console.log([reqfrom, "state delete/add AKA new is current", other_state.fn]);
                    editor2state.delete(other_editor);
                    editor2state.set(editor, other_state);
                    state = other_state;
                    state.editor = editor;
                    break;
                }
            }
        }
    }
    else {
        // console.log([reqfrom, "found", state.fn]);
    }
    if (!state) {
        state = new StateOfEditor(editor);
        state.last_used_ts = Date.now();
        state.fn = editor.document.fileName;
        editor2state.set(editor, state);
        console.log([reqfrom, "state create new", state.fn]);
    }
    state.last_used_ts = Date.now();
    return state;
}
function state_of_document(doc) {
    let candidates_list = [];
    for (const [editor, state] of editor2state) {
        if (editor.document === doc) {
            candidates_list.push(state);
        }
    }
    if (candidates_list.length === 0) {
        return undefined;
    }
    if (candidates_list.length === 1) {
        return candidates_list[0];
    }
    console.log(["multiple editors/states for the same document, taking the most recent...", doc.fileName]);
    let most_recent_ts = 0;
    let most_recent_state = undefined;
    for (let state of candidates_list) {
        if (state.last_used_ts > most_recent_ts) {
            most_recent_ts = state.last_used_ts;
            most_recent_state = state;
        }
    }
    return most_recent_state;
}
async function switch_mode(state, new_mode) {
    let old_mode = state._mode;
    console.log(["switch mode", old_mode, new_mode]);
    state._mode = new_mode;
    if (old_mode === Mode.Diff) {
        await interactiveDiff.dislike_and_rollback(state.editor);
        vscode.commands.executeCommand('setContext', 'sixth.runTab', false);
        vscode.commands.executeCommand('setContext', 'sixth.runEsc', false);
    }
    else if (old_mode === Mode.Highlight) {
        // highlight.hl_clear(state.editor);
    }
    else if (old_mode === Mode.DiffWait) {
        // highlight.hl_clear(state.editor);
    }
    if (new_mode === Mode.Diff) {
        if (state.showing_diff_modif_doc !== undefined) {
            await interactiveDiff.present_diff_to_user(state.editor, state.showing_diff_modif_doc, state.showing_diff_move_cursor);
            state.showing_diff_move_cursor = false;
            vscode.commands.executeCommand('setContext', 'sixth.runTab', true);
            vscode.commands.executeCommand('setContext', 'sixth.runEsc', true);
        }
        else {
            console.log(["cannot enter diff state, no diff modif doc"]);
        }
    }
    if (new_mode === Mode.Highlight) {
        state.diff_lens_pos = Number.MAX_SAFE_INTEGER;
        //codeLens.quick_refresh();
        if (state.highlight_json_backup !== undefined) {
            // highlight.hl_show(state.editor, state.highlight_json_backup);
        }
        else {
            console.log(["cannot enter highlight state, no hl json"]);
        }
    }
    // if (new_mode === Mode.Normal) {
    // }
    if (new_mode !== Mode.Dispose) {
        keyboard_events_on(state.editor);
    }
    if (new_mode !== Mode.Normal) {
        vscode.commands.executeCommand('setContext', 'sixth.runEsc', true);
    }
    else {
        // keyboard_events_off(state);
    }
}
async function back_to_normal(state) {
    await switch_mode(state, Mode.Normal);
}
function info2sidebar(ev_editor) {
    // if(global.side_panel !== undefined) {
    //     global.side_panel.editor_inform_how_many_lines_selected(ev_editor);
    // }
}
function keyboard_events_on(editor) {
    let state = state_of_editor(editor, "keyb_on");
    if (!state) {
        return;
    }
    if (state.cursor_move_event) {
        state.cursor_move_event.dispose();
    }
    if (state.text_edited_event) {
        state.text_edited_event.dispose();
    }
    state.cursor_move_event = vscode.window.onDidChangeTextEditorSelection(async (ev) => {
        completionProvider.on_cursor_moved();
        let is_mouse = ev.kind === vscode.TextEditorSelectionChangeKind.Mouse;
        let ev_editor = ev.textEditor;
        let pos1 = ev_editor.selection.active;
        info2sidebar(ev_editor);
        if (!editor || editor !== ev_editor) {
            return;
        }
        await interactiveDiff.on_cursor_moved(editor, pos1, is_mouse);
        if (state && state.completion_reset_on_cursor_movement) {
            state.completion_lens_pos = Number.MAX_SAFE_INTEGER;
            state.completion_longthink = 0;
            //codeLens.quick_refresh();
        }
    });
    state.text_edited_event = vscode.workspace.onDidChangeTextDocument((ev) => {
        completionProvider.on_text_edited();
        let doc = ev.document;
        let ev_doc = editor.document;
        if (doc !== ev_doc) {
            return;
        }
        on_text_edited(editor);
    });
    info2sidebar(vscode.window.activeTextEditor);
}
function keyboard_events_off(state) {
    if (state.cursor_move_event !== undefined) {
        state.cursor_move_event.dispose();
        state.cursor_move_event = undefined;
    }
    if (state.text_edited_event !== undefined) {
        state.text_edited_event.dispose();
        state.text_edited_event = undefined;
    }
}
function on_text_edited(editor) {
    let state = state_of_editor(editor, "text_edited");
    if (!state) {
        return;
    }
    if (state.diff_changing_doc) {
        console.log(["text edited, do nothing"]);
        return;
    }
    if (state._mode === Mode.Diff || state._mode === Mode.DiffWait) {
        console.log(["text edited mode", state._mode, "hands off"]);
        interactiveDiff.hands_off_dont_remove_anything(editor);
        state.highlight_json_backup = undefined;
        state.diff_lens_pos = Number.MAX_SAFE_INTEGER;
        state.completion_lens_pos = Number.MAX_SAFE_INTEGER;
        // state.area2cache.clear();
        switch_mode(state, Mode.Normal);
    }
    else if (state._mode === Mode.Highlight) {
        // highlight.hl_clear(editor);
        state.highlight_json_backup = undefined;
        // state.area2cache.clear();
        switch_mode(state, Mode.Normal);
    }
    else if (state._mode === Mode.Normal) {
        // state.area2cache.clear();
        state.highlight_json_backup = undefined;
    }
}
function on_change_active_editor(editor) {
    if (editor) {
        let state_stored = editor2state.get(editor);
        if (!state_stored) {
            let state = state_of_editor(editor, "change_active");
            if (state) {
                // this does almost nothing, but the state will be there for inline completion to pick up
                switch_mode(state, Mode.Normal);
            }
        }
        fetchAPI.lsp_set_active_document(editor);
    }
    info2sidebar(editor);
}
function estate_init() {
    let disposable9 = vscode.window.onDidChangeActiveTextEditor(on_change_active_editor);
    let current_editor = vscode.window.activeTextEditor;
    if (current_editor) {
        on_change_active_editor(current_editor);
    }
    return [disposable9];
}
function save_intent(intent) {
    if (exports.global_intent !== intent) {
        exports.global_intent = intent;
        for (const [editor, state] of editor2state) {
            // state.area2cache.clear();
            state.highlight_json_backup = undefined;
        }
    }
}
//# sourceMappingURL=estate.js.map