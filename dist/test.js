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
let ty = new index_1.default;
let genPrm = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(new Date());
        }, 100);
    });
};
let re = () => __awaiter(this, void 0, void 0, function* () {
    return console.log(yield ty.queue([1, 2, 3, 4, 5, 6].map(x => { return { acquire: genPrm }; })));
});
re();
//# sourceMappingURL=test.js.map