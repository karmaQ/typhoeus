"use strict";
exports.isKind = (val, kind) => {
    return '[object ' + kind + ']' === Object.prototype.toString.call(val);
};
exports.isRegExp = (val) => {
    return exports.isKind(val, 'RegExp');
};
exports.isArray = (val) => {
    return exports.isKind(val, 'Array');
};
exports.isFunction = (val) => {
    return typeof val === 'function';
};
exports.castArray = (val) => {
    return exports.isArray(val) ? val : [val];
};
//# sourceMappingURL=utils.js.map