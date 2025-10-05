"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniquedArray = exports.areAllValuesUnique = exports.onlyStringArray = exports.isStringArray = void 0;
const string_1 = require("./string");
const isStringArray = (arr) => {
    return arr.every((item) => (0, string_1.isString)(item));
};
exports.isStringArray = isStringArray;
const onlyStringArray = (arr) => {
    return arr.filter((item) => Boolean(item) && (0, string_1.isString)(item));
};
exports.onlyStringArray = onlyStringArray;
const areAllValuesUnique = (arr) => {
    return arr.length === new Set(arr).size;
};
exports.areAllValuesUnique = areAllValuesUnique;
const uniquedArray = (arr) => {
    return [...new Set(arr)];
};
exports.uniquedArray = uniquedArray;
//# sourceMappingURL=array.js.map