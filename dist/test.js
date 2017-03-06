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
        }, 1000);
    });
};
let ty = new index_1.default({
    concurrency: 10,
    acquire: genPrm,
    release: (x) => { return x; },
    error: (error, opts) => { console.log(opts); }
});
let re = () => __awaiter(this, void 0, void 0, function* () {
    let arr = [], i = 100;
    while (i-- > 0) {
        arr.push(i);
    }
    console.log(yield ty.queue(arr));
    console.log(ty.lastCatched);
});
re();
//# sourceMappingURL=test.js.map