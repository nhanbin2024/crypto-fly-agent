"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketBaseUrl = exports.httpBaseUrl = exports.TEN_SECOND_TEST_DELAY = exports.ONE_MINUTE_DELAY = exports.FOUR_HOURS_DELAY = void 0;
exports.delay = delay;
exports.getFullContext = getFullContext;
exports.checkAndRemoveSubstring = checkAndRemoveSubstring;
const axiosInstance_1 = require("../utils/axiosInstance");
const api = (0, axiosInstance_1.createAxiosInstance)();
function delay(milliseconds) {
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}
;
async function getFullContext(user_id) {
    try {
        // Construct the URL
        const userId = user_id;
        const url = `/get_full_context?user_id=${userId}`;
        // Make the GET request
        const response = await api.get(url);
        // Check if the response data is null
        if (response.data !== null) {
            return response.data;
        }
        else {
            console.log('Response data is null.');
            return null;
        }
    }
    catch (error) {
        console.error('Error fetching full context:', error);
        return null;
    }
}
function checkAndRemoveSubstring(str, substring) {
    if (str.includes(substring)) {
        return str.replace(substring, ""); // Remove the substring
    }
    return str; // Return the original string if substring doesn't exist
}
//export const FOUR_HOURS_DELAY=4 * 60 * 60 * 1000;
//export const ONE_MINUTE_DELAY=1 * 60 * 1000;
exports.FOUR_HOURS_DELAY = 4 * 60 * 60 * 1000;
exports.ONE_MINUTE_DELAY = 1 * 60 * 1000;
exports.TEN_SECOND_TEST_DELAY = 10 * 1000;
//  https://standard.trysixth.com
exports.httpBaseUrl = "https://standard.trysixth.com";
exports.socketBaseUrl = "wss://standard.trysixth.com";
//# sourceMappingURL=genUtils.js.map