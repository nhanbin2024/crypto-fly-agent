"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserSubscriberInfo = void 0;
const extension_1 = require("../extension");
const projectUtils_1 = require("./projectUtils");
const axiosInstance_1 = require("../utils/axiosInstance");
const api = (0, axiosInstance_1.createAuthAxiosInstance)();
const getUserSubscriberInfo = (onDone) => {
    api.get(`/payment/get_user_info?id=${(0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, "")}`, {
        headers: {
            "Authorization": `Bearer ${(0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.JWT, "")}`
        }
    })
        .then((response) => {
        (0, projectUtils_1.saveDataToCache)((0, extension_1.getExtensionContext)(), projectUtils_1.ADDED_BILLING, response.data["subscriber"]);
        onDone(response.data["subscriber"]);
    });
};
exports.getUserSubscriberInfo = getUserSubscriberInfo;
//# sourceMappingURL=network.js.map