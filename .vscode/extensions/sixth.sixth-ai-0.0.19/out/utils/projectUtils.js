"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUTO_OPEN_MAIN_MENU = exports.DEFAULT_VECTOR_STORE_ID = exports.DEFAULT_CONTEXT = exports.CURRENT_SELECTED_PROJEcT = exports.JIRA_AUTHENTICATED = exports.CODEFIX_RATING_MADE = exports.JOIN_COMMUNITY = exports.RATING_MADE = exports.SURVEY_MADE = exports.DIAGNOSTICS_USED = exports.CURRENT_CONTEXT = exports.SEEN_USE_CHAT_MODAL = exports.ADDED_BILLING = exports.JWT = exports.PASSWORD = exports.TEMP_APIKEY = exports.TIME_DOWNNLOADED = exports.REGISTERED = exports.LOGGEDIN = exports.REMEMBERME = exports.USERNAME = exports.EMAIL = exports.APIKEY = void 0;
exports.saveDataToCache = saveDataToCache;
exports.getDataFromCache = getDataFromCache;
exports.clearAllCache = clearAllCache;
exports.clearCache = clearCache;
exports.APIKEY = "API_KEY";
exports.EMAIL = "EMAIL";
exports.USERNAME = "USERNAME";
exports.REMEMBERME = "REMEMBER_ME";
exports.LOGGEDIN = "LOGGEDIN";
exports.REGISTERED = "REGISTERED";
exports.TIME_DOWNNLOADED = "TIME_DOWNLOADED";
exports.TEMP_APIKEY = "TEMP_API_KEY";
exports.PASSWORD = "PASSWORD";
exports.JWT = "JWT";
exports.ADDED_BILLING = "ADDED_BILLING";
exports.SEEN_USE_CHAT_MODAL = "SEEN_USE_CHAT_MODAL";
exports.CURRENT_CONTEXT = "CURRENT_CONTEXT";
exports.DIAGNOSTICS_USED = "DIAGNOSTICS_USED";
exports.SURVEY_MADE = "SURVEY_MADE";
exports.RATING_MADE = "RATING_MADE";
exports.JOIN_COMMUNITY = "JOIN_COMMUNITY";
exports.CODEFIX_RATING_MADE = "CODEFIX_RATING_MADE";
exports.JIRA_AUTHENTICATED = 'JIRA_AUTHENTICATED';
exports.CURRENT_SELECTED_PROJEcT = `CURRENT_SELECTED_PROJECT`;
exports.DEFAULT_CONTEXT = 'DEFAULT_CONTEXT';
exports.DEFAULT_VECTOR_STORE_ID = 'DEFAULT_VECTOR_STORE_ID';
exports.AUTO_OPEN_MAIN_MENU = 'AUTO_OPEN_MAIN_MENU';
function saveDataToCache(context, key, data) {
    // Store data in the global state
    context.globalState.update(key, data);
}
function getDataFromCache(context, key, defaultValue) {
    // Retrieve data from the global state
    return context.globalState.get(key, defaultValue);
}
function clearAllCache(context) {
    context.globalState.update(exports.APIKEY, undefined);
    context.globalState.update(exports.EMAIL, undefined);
    context.globalState.update(exports.USERNAME, undefined);
    context.globalState.update(exports.REMEMBERME, undefined);
    context.globalState.update(exports.LOGGEDIN, undefined);
    context.globalState.update(exports.TEMP_APIKEY, undefined);
    context.globalState.update(exports.TIME_DOWNNLOADED, undefined);
    context.globalState.update(exports.REGISTERED, undefined);
    context.globalState.update(exports.ADDED_BILLING, undefined);
    context.globalState.update(exports.DIAGNOSTICS_USED, undefined);
    //context.globalState.update(RATING_MADE, undefined);
    context.globalState.update(exports.SURVEY_MADE, undefined);
    context.globalState.update(exports.PASSWORD, undefined);
    context.globalState.update(exports.JOIN_COMMUNITY, undefined);
    context.globalState.update(exports.SEEN_USE_CHAT_MODAL, undefined);
    context.globalState.update(exports.JIRA_AUTHENTICATED, undefined);
    context.globalState.update(exports.CURRENT_SELECTED_PROJEcT, undefined);
    context.globalState.update(exports.JWT, undefined);
    context.globalState.update("GLYDE_APIKEY", undefined);
}
function clearCache(context, name) {
    context.globalState.update(name, undefined);
}
//# sourceMappingURL=projectUtils.js.map