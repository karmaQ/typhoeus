"use strict";
const index_1 = require("./index");
let ty = new index_1.default;
let genPrm = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log(new Date());
            resolve();
        }, 3000);
    });
};
//# sourceMappingURL=test.js.map