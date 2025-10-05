"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.containsInvalidCharForComponent = exports.isString = exports.startsWithLowerCaseAlphabet = exports.startsWithCapitalAlphabet = exports.startsWithAlphabet = void 0;
const startsWithAlphabet = (str) => {
    return /^[a-zA-Z]/.test(str);
};
exports.startsWithAlphabet = startsWithAlphabet;
const startsWithCapitalAlphabet = (str) => {
    return /^[A-Z]/.test(str);
};
exports.startsWithCapitalAlphabet = startsWithCapitalAlphabet;
const startsWithLowerCaseAlphabet = (str) => {
    return /^[a-z]/.test(str);
};
exports.startsWithLowerCaseAlphabet = startsWithLowerCaseAlphabet;
const isString = (value) => {
    return typeof value === 'string';
};
exports.isString = isString;
const containsInvalidCharForComponent = (str) => {
    return !/^[a-zA-Z0-9_]*$/.test(str);
};
exports.containsInvalidCharForComponent = containsInvalidCharForComponent;
//# sourceMappingURL=string.js.map