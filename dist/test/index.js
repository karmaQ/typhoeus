"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const chai_1 = require("chai");
const index_1 = require("../index");
let getPromise = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(42);
        }, Math.floor(Math.random() * 3000));
    });
};
let typhoeus = new index_1.default({
    concurrency: 5,
    acquire: getPromise,
    release: (x, y) => { return x; },
    error: (error, opts) => { console.log(opts); },
    maxRetryTimes: 1
});
describe('使用 Typhoeus 控制并发,', function () {
    it('快捷 map 启动', function () {
        return __awaiter(this, void 0, void 0, function* () {
            let arr = [], i = 0;
            while (i++ < 10) {
                arr.push(i);
            }
            let ret = yield index_1.default.map(arr, getPromise, 1);
            chai_1.expect(ret).to.be.eql([42, 42, 42, 42, 42, 42, 42, 42, 42, 42]);
        });
    });
});
//# sourceMappingURL=index.js.map