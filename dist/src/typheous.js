"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const events_1 = require("events");
const generic_pool_1 = require("generic-pool");
const utils_1 = require("./utils");
class Typheous extends events_1.EventEmitter {
    constructor(opts = {}) {
        super();
        this.opts = opts;
        this.opts.retryTimeout = this.opts.retryTimeout || 3000;
        this.opts.acquire = opts.acquire || (r => r);
        this.opts.release = opts.release || (r => r);
        if (opts.rateLimit) {
            opts.concurrency = 1,
                opts.rateLimit = opts.rateLimit;
        }
        this.pool = generic_pool_1.createPool({
            create: opts.create || Math.random,
            destroy: opts.destroy || console.log,
        }, {
            max: opts.concurrency || 10,
            priorityRange: opts.priorityRange || 10,
            Promise: opts.Promise || global.Promise
        });
        this.queueItemSize = 0;
        this.plannedQueueCalls = 0;
        this.on('pool:release', opts => this.release(opts));
        this.on('pool:drain', opts => { if (opts.drain) {
            opts.drain();
        } });
    }
    release(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            this.queueItemSize -= 1;
            try {
                yield this.pool.release(opts._poolReference);
                if (this.queueItemSize + this.plannedQueueCalls == 0) {
                    this.emit('pool:drain', opts);
                }
            }
            catch (ex) {
                console.log('released callback error:', ex);
            }
            finally {
                return opts.result;
            }
        });
    }
    queue(opts) {
        return Promise.all(utils_1.castArray(opts).map((x) => __awaiter(this, void 0, void 0, function* () { return yield this.acquire(x); })));
    }
    acquire(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            this.queueItemSize += 1;
            try {
                opts._poolReference = yield this.pool.acquire(opts.priority);
                opts.result = yield (opts.acquire || this.opts.acquire)(opts);
                this.emit('pool:release', opts);
                return (opts.release || this.opts.release)(opts);
            }
            catch (ex) {
                this.emit('pool:release', opts);
                return this.retry(opts, ex);
            }
        });
    }
    retry(opts, ex) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`retry: ${opts.retryTimes || 1} times`);
            opts.retryTimes ? opts.retryTimes += 1 : opts.retryTimes = 1;
            return new Promise((resolve, reject) => {
                if (opts.retryTimes >= 3) {
                    resolve(this.error(opts, ex));
                }
                else {
                    opts.priority = 0;
                    setTimeout((opts) => __awaiter(this, void 0, void 0, function* () {
                        return resolve(yield this.acquire(opts));
                    }), opts.retryTimeout || this.opts.retryTimeout, opts);
                }
            });
        });
    }
    error(opts, error) {
        if (opts.error) {
            return opts.error(error, opts);
        }
        else {
            return console.log("error:", error);
        }
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Typheous;
//# sourceMappingURL=typheous.js.map