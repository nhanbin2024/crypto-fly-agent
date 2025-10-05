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
exports.global_inference_url_from_login = exports.PendingRequest = void 0;
exports.wait_until_all_requests_finished = wait_until_all_requests_finished;
exports.anything_still_working = anything_still_working;
exports.cancel_all_requests_and_wait_until_finished = cancel_all_requests_and_wait_until_finished;
exports.save_url_from_login = save_url_from_login;
exports.rust_url = rust_url;
exports.inference_context = inference_context;
exports.fetch_code_completion = fetch_code_completion;
exports.fetch_chat_promise = fetch_chat_promise;
exports.look_for_common_errors = look_for_common_errors;
exports.get_caps = get_caps;
exports.get_prompt_customization = get_prompt_customization;
exports.get_tools = get_tools;
exports.lsp_set_active_document = lsp_set_active_document;
exports.getAutocomplete = getAutocomplete;
const vscode = __importStar(require("vscode"));
const fetchH2 = __importStar(require("fetch-h2"));
const usabilityHints = __importStar(require("./usabilityHints"));
const genUtils_1 = require("../utils/genUtils");
const projectUtils_1 = require("../utils/projectUtils");
const extension_1 = require("../extension");
const axiosInstance_1 = require("../utils/axiosInstance");
let globalSeq = 100;
class PendingRequest {
    constructor(apiPromise, cancelToken) {
        this.streaming_buf = "";
        this.streaming_error = "";
        this.seq = globalSeq++;
        this.apiPromise = apiPromise;
        this.cancelToken = cancelToken;
    }
    set_streaming_callback(callback, end_callback) {
        this.streaming_callback = callback;
        this.streaming_end_callback = end_callback;
    }
    async look_for_completed_data_in_streaming_buf() {
        let to_eat = "";
        while (1) {
            let split_slash_n_slash_n = this.streaming_buf.split("\n\n");
            if (split_slash_n_slash_n.length <= 1) {
                return;
            }
            let first = split_slash_n_slash_n[0];
            this.streaming_buf = split_slash_n_slash_n.slice(1).join("\n\n");
            if (first.substring(0, 6) !== "data: ") {
                console.log("Unexpected data in streaming buf: " + first);
                continue;
            }
            to_eat = first.substring(6);
            if (to_eat === "[DONE]") {
                if (this.streaming_end_callback) {
                    // The normal way to end the streaming
                    let my_cb = this.streaming_end_callback;
                    this.streaming_end_callback = undefined;
                    await my_cb(this.streaming_error);
                }
                break;
            }
            if (to_eat === "[ERROR]") {
                console.log("Streaming error");
                this.streaming_error = "[ERROR]";
                break;
            }
            let json = JSON.parse(to_eat);
            let error_detail = json["detail"];
            if (typeof error_detail === "string") {
                this.streaming_error = error_detail;
                break;
            }
            if (this.streaming_callback) {
                await this.streaming_callback(json);
            }
        }
    }
    supply_stream(h2stream, scope, url) {
        this.streaming_error = "";
        h2stream.catch((error) => {
            let aborted = error && error.message && error.message.includes("aborted");
            if (!aborted) {
                console.log(["h2stream error (1)", error]);
            }
            else {
                // Normal, user cancelled the request.
            }
            return;
        });
        this.apiPromise = new Promise((resolve, reject) => {
            h2stream.then(async (result_stream) => {
                if (this.streaming_callback) {
                    // Streaming is a bit homegrown, maybe read the docs:
                    // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
                    // https://nodejs.org/api/stream.html#stream_readable_readablehighwatermark
                    let readable = await result_stream.readable();
                    readable.on("readable", async () => {
                        // Use readable here because we need to read as much as possible, feed the last
                        // chunk only if model+network is faster than the GUI
                        while (1) {
                            let chunk = readable.read();
                            if (chunk === null) {
                                break;
                            }
                            if (typeof chunk === "string") {
                                this.streaming_buf += chunk;
                                // console.log(["readable data", chunk]);
                            }
                            else {
                                this.streaming_buf += chunk.toString();
                                // console.log(["readable data", chunk.toString()]);
                            }
                            await this.look_for_completed_data_in_streaming_buf();
                        }
                    });
                    readable.on("close", async () => {
                        // console.log(["readable end", this.streaming_buf]);
                        if (this.streaming_buf.startsWith("{")) {
                            // likely a error, because it's not a stream, no "data: " prefix
                            console.log(["looks like a error", this.streaming_buf]);
                            let error_message;
                            try {
                                let j = JSON.parse(this.streaming_buf);
                                error_message = j["detail"];
                                if (typeof error_message !== "string") {
                                    error_message = this.streaming_buf;
                                }
                            }
                            catch (e) {
                                console.log(["error parsing error json", e]);
                                error_message = this.streaming_buf; // as a string
                            }
                            this.streaming_error = error_message;
                            // statusBar.send_network_problems_to_status_bar(false, scope, url, this.streaming_buf, "");
                        }
                        else if (this.streaming_error) {
                            // statusBar.send_network_problems_to_status_bar(false, scope, url, "streaming_error", "");
                        }
                        else {
                            // statusBar.send_network_problems_to_status_bar(true, scope, url, "", "");
                        }
                        // Normally [DONE] produces a callback, but it's possible there's no [DONE] sent by the server.
                        // Wait 500ms because inside VS Code "readable" and "end"/"close" are sometimes called in the wrong order.
                        await new Promise(resolve => setTimeout(resolve, 500));
                        if (this.streaming_end_callback) {
                            let my_cb = this.streaming_end_callback;
                            this.streaming_end_callback = undefined;
                            await my_cb(this.streaming_error);
                        }
                    });
                    resolve("");
                }
                else {
                    // not streaming
                    let json_arrived = await result_stream.json();
                    if (json_arrived.inference_message) {
                        // It's async, potentially two messages might appear if requests are fast, but we don't launch new requests
                        // until the previous one is finished, should be fine...
                        usabilityHints.show_message_from_server("InferenceServer", json_arrived.inference_message);
                    }
                    if (look_for_common_errors(json_arrived, scope, "")) {
                        reject();
                        return;
                    }
                    let model_name = json_arrived["model"];
                    if (typeof json_arrived === "object" && json_arrived.length !== undefined) {
                        model_name = json_arrived[0]["model"];
                    }
                    resolve(json_arrived);
                }
            }).catch(async (error) => {
                let aborted = error && error.message && error.message.includes("aborted");
                if (!aborted) {
                    console.log(["h2stream error (2)", error]);
                }
                if (this.streaming_end_callback) {
                    let my_cb = this.streaming_end_callback;
                    this.streaming_end_callback = undefined;
                    await my_cb(error !== undefined);
                }
                reject();
            });
        }).finally(() => {
            let index = _global_reqs.indexOf(this);
            if (index >= 0) {
                _global_reqs.splice(index, 1);
            }
            if (_global_reqs.length === 0) {
                //global.status_bar.statusbar_spinner(false);
            }
            // console.log(["--pendingRequests", _global_reqs.length, request.seq]);
        }).catch((error) => {
            let aborted = error && error.message && error.message.includes("aborted");
            if (error === undefined) {
                // This is a result of reject() without parameters
                return;
            }
            else if (!aborted) {
                console.log(["h2stream error (3)", error]);
            }
        });
        _global_reqs.push(this);
        // console.log(["++pendingRequests", _global_reqs.length, request.seq]);
    }
}
exports.PendingRequest = PendingRequest;
let _global_reqs = [];
async function wait_until_all_requests_finished() {
    for (let i = 0; i < _global_reqs.length; i++) {
        let r = _global_reqs[i];
        if (r.apiPromise !== undefined) {
            console.log([r.seq, "wwwwwwwwwwwwwwwww"]);
            let tmp = await r.apiPromise;
            r.apiPromise = undefined;
        }
    }
}
function anything_still_working() {
    for (let i = 0; i < _global_reqs.length; i++) {
        let r = _global_reqs[i];
        if (!r.cancelToken.isCancellationRequested) {
            return true;
        }
    }
    return false;
}
async function cancel_all_requests_and_wait_until_finished() {
    for (let i = 0; i < _global_reqs.length; i++) {
        let r = _global_reqs[i];
        if (r.cancellationTokenSource !== undefined) {
            r.cancellationTokenSource.cancel();
        }
    }
    await wait_until_all_requests_finished();
}
exports.global_inference_url_from_login = "";
function save_url_from_login(url) {
    exports.global_inference_url_from_login = url;
}
function rust_url(addthis) {
    return `${genUtils_1.httpBaseUrl}${addthis}`;
}
function inference_context(third_party) {
    // let modified_url = vscode.workspace.getConfiguration().get('sixth.infurl');
    // if (!modified_url) {
    //     // Backward compatibility: codify is the old name
    //     modified_url = vscode.workspace.getConfiguration().get('codify.infurl');
    // }
    // in previous versions, it was possible to skip certificate verification
    return {
        disconnect: fetchH2.disconnect,
        disconnectAll: fetchH2.disconnectAll,
        fetch: fetchH2.fetch,
        onPush: fetchH2.onPush,
        setup: fetchH2.setup,
    };
}
let i = 0;
function fetch_code_completion(cancelToken, sources, multiline, cursor_file, cursor_line, cursor_character, max_new_tokens, no_cache, temperature) {
    let url = "http://127.0.0.1:8000/v1/code-completion";
    if (!url) {
        console.log(["fetch_code_completion: No rust binary working"]);
        return Promise.reject("No rust binary working");
    }
    let third_party = false;
    let ctx = inference_context(third_party);
    let model_name = vscode.workspace.getConfiguration().get("sixth.codeCompletionModel") || "";
    let client_version = "vscode-1.0.0";
    console.log("CLient version is ", client_version);
    // api_fields.scope = "code-completion";
    // api_fields.url = url;
    // api_fields.model = model;
    // api_fields.sources = sources;
    // api_fields.intent = "";
    // api_fields.function = "completion";
    // api_fields.cursor_file = cursor_file;
    // api_fields.cursor_pos0 = -1;
    // api_fields.cursor_pos1 = -1;
    // api_fields.ts_req = Date.now();
    let use_ast = true;
    const post = JSON.stringify({
        "model": model_name,
        "inputs": {
            "sources": sources,
            "cursor": {
                "file": cursor_file,
                "line": cursor_line,
                "character": cursor_character,
            },
            "multiline": multiline,
        },
        "parameters": {
            "temperature": temperature,
            "max_new_tokens": max_new_tokens,
        },
        "no_cache": no_cache,
        "use_ast": use_ast,
        "client": `vscode-${client_version}`,
    });
    const headers = {
        "Content-Type": "application/json",
        // "Authorization": `Bearer ${apiKey}`,
    };
    let req = new fetchH2.Request(url, {
        method: "POST",
        headers: headers,
        body: post,
        redirect: "follow",
        cache: "no-cache",
        referrer: "no-referrer"
    });
    let init = {
        timeout: 20 * 1000,
    };
    if (cancelToken) {
        // let abort = new fetchH2.AbortController();
        // cancelToken.onCancellationRequested(async () => {
        //     console.log("API fetch cancelled", i, );
        //     abort.abort();
        //    // global.side_panel?.chat?.handleStreamEnd();
        //     await fetchH2.disconnectAll();
        // });
        // init.signal = abort.signal;
    }
    let promise = ctx.fetch(req, init);
    return promise;
}
function fetch_chat_promise(cancelToken, scope, messages, model, third_party = false, tools = null) {
    let url = rust_url("/v1/chat");
    if (!url) {
        console.log(["fetch_chat_promise: No rust binary working"]);
        return [Promise.reject("No rust binary working"), scope, ""];
    }
    const apiKey = "any-key-will-work";
    if (!apiKey) {
        return [Promise.reject("No API key"), "chat", ""];
    }
    let ctx = inference_context(third_party);
    // an empty tools array causes issues
    const maybeTools = tools && tools.length > 0 ? { tools } : {};
    const body = JSON.stringify({
        "messages": [], //json_messages,
        "model": model,
        "parameters": {
            "max_new_tokens": 1000,
        },
        "stream": true,
        ...maybeTools
    });
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
    };
    let req = new fetchH2.Request(url, {
        method: "POST",
        headers: headers,
        body: body,
        redirect: "follow",
        cache: "no-cache",
        referrer: "no-referrer"
    });
    let init = {
        timeout: 20 * 1000,
    };
    if (cancelToken) {
        let abort = new fetchH2.AbortController();
        cancelToken.onCancellationRequested(() => {
            console.log(["chat cancelled"]);
            abort.abort();
        });
        init.signal = abort.signal;
    }
    let promise = ctx.fetch(req, init);
    return [promise, scope, ""];
}
function look_for_common_errors(json, scope, url) {
    if (json === undefined) {
        // undefined means error is already handled, do nothing
        return true;
    }
    if (json.detail) {
        //statusBar.send_network_problems_to_status_bar(false, scope, url, json.detail, "");
        return true;
    }
    if (json.retcode && json.retcode !== "OK") {
        //statusBar.send_network_problems_to_status_bar(false, scope, url, json.human_readable_message, "");
        return true;
    }
    if (json.error) {
        if (typeof json.error === "string") {
            //statusBar.send_network_problems_to_status_bar(false, scope, url, json.error, "");
        }
        else {
            //statusBar.send_network_problems_to_status_bar(false, scope, url, json.error.message, "");
        }
    }
    return false;
}
async function get_caps() {
    let url = rust_url("/v1/caps");
    if (!url) {
        return Promise.reject("read_caps no rust binary working, very strange");
    }
    let req = new fetchH2.Request(url, {
        method: "GET",
        redirect: "follow",
        cache: "no-cache",
        referrer: "no-referrer",
    });
    let resp = await fetchH2.fetch(req);
    if (resp.status !== 200) {
        console.log(["read_caps http status", resp.status]);
        return Promise.reject("read_caps bad status");
    }
    let json = await resp.json();
    console.log(["successful read_caps", json]);
    return json;
}
async function get_prompt_customization() {
    const url = rust_url("/v1/customization");
    if (!url) {
        return Promise.reject("unable to get prompt customization");
    }
    const request = new fetchH2.Request(url, {
        method: "GET",
        redirect: "follow",
        cache: "no-cache",
        referrer: "no-referrer",
    });
    const response = await fetchH2.fetch(request);
    if (!response.ok) {
        console.log(["get_prompt_customization http status", response.status]);
        return Promise.reject("unable to get prompt customization");
    }
    const json = await response.json();
    return json;
}
async function fetch_rag_status() {
    const url = rust_url("/v1/rag-status");
    if (!url) {
        return Promise.reject("rag-status no rust binary working, very strange");
    }
    const request = new fetchH2.Request(url, {
        method: "GET",
        redirect: "follow",
        cache: "no-cache",
        referrer: "no-referrer",
    });
    try {
        const response = await fetchH2.fetch(request);
        if (response.status !== 200) {
            console.log(["rag-status http status", response.status]);
        }
        const json = await response.json();
        return json;
    }
    catch (e) {
        // statusBar.send_network_problems_to_status_bar(
        //     false,
        //     "rag-status",
        //     url,
        //     e,
        //     undefined
        // );
    }
    return Promise.reject("rag-status bad status");
}
let ragstat_timeout;
async function get_tools(notes = false) {
    const url = rust_url("/v1/tools");
    if (!url) {
        return Promise.reject("unable to get tools url");
    }
    const request = new fetchH2.Request(url, {
        method: "GET",
        redirect: "follow",
        cache: "no-cache",
        referrer: "no-referrer",
    });
    const response = await fetchH2.fetch(request);
    if (!response.ok) {
        console.log(["tools response http status", response.status]);
        // return Promise.reject("unable to get available tools");
        return [];
    }
    const json = await response.json();
    const tools = notes ?
        json.filter((tool) => tool.function.name === "note_to_self") :
        json.filter((tool) => tool.function.name !== "note_to_self");
    return tools;
}
async function lsp_set_active_document(editor) {
    let url = rust_url("/v1/lsp-set-active-document");
    if (url) {
        const post = JSON.stringify({
            "uri": editor.document.uri.toString(),
        });
        const headers = {
            "Content-Type": "application/json",
        };
        let req = new fetchH2.Request(url, {
            method: "POST",
            headers: headers,
            body: post,
            redirect: "follow",
            cache: "no-cache",
            referrer: "no-referrer"
        });
        fetchH2.fetch(req).then((response) => {
            if (!response.ok) {
                console.log(["lsp-set-active-document failed", response.status, response.statusText]);
            }
            else {
                console.log(["lsp-set-active-document success", response.status]);
            }
        });
    }
}
var api = (0, axiosInstance_1.createAutoCompleteAxiosInstance)();
async function getAutocomplete(data) {
    global.completionProvider.currentRequest = true;
    try {
        data["user_id"] = (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, "not_found");
        data["subscriber"] = (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.ADDED_BILLING, false);
        const response = await api.post("/v1/code-completion", data);
        var data = response.data;
        console.log("Auto complete error isss ", response);
        global.completionProvider.currentRequest = false;
        return [data["choices"][0]["code_completion"], data["snippet_telemetry_id"], "completion", data["action"]];
    }
    catch (e) {
        console.log("Auto complete error isss ", e);
        global.completionProvider.currentRequest = false;
        return ["", -1, "completion", data["action"]];
    }
}
//# sourceMappingURL=fetchAPI.js.map