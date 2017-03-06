"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const index_1 = require("./index");
let genPrm = () => {
    if (Math.random() * 5 > 4) {
        throw new Error('hahaha error');
    }
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(new Date());
        }, Math.floor(Math.random() * 1000));
    });
};
let ty = new index_1.default({
    concurrency: 5,
    acquire: genPrm,
    release: (x, y) => { return [y, x]; },
    error: (error, opts) => { console.log(opts); },
    maxRetryTimes: 1
});
let re = () => __awaiter(this, void 0, void 0, function* () {
    let arr = [], i = 0;
    while (i++ < 100) {
        arr.push(i);
    }
    let res2 = yield index_1.default.map(arr, genPrm, 3);
    console.log(res2);
});
re();
//# sourceMappingURL=test.js.map