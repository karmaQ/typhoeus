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
let tileSym = Symbol('tile');
let __typhoeus;
class Typhoeus extends events_1.EventEmitter {
    constructor(opts = {}) {
        super();
        this._opts = {};
        this._opts = this.defaultOpts(opts);
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
    defaultOpts(opts = {}, item, tile) {
        let retopts = {};
        if (tile) {
            retopts.tile = tile;
        }
        if (item !== undefined) {
            retopts.item = item;
        }
        retopts.retryTimeout = opts.retryTimeout || this._opts.retryTimeout || 3000;
        retopts.acquire = opts.acquire || this._opts.acquire || (x => x);
        retopts.release = opts.release || this._opts.release || (x => x);
        retopts.error = opts.error || this._opts.error || console.log;
        retopts.maxRetryTimes = this._opts.maxRetryTimes || 3;
        let rateLimit = opts.rateLimit || this._opts.rateLimit;
        if (rateLimit) {
            retopts.concurrency = 1,
                retopts.rateLimit = rateLimit;
        }
        return retopts;
    }
    queue(items, opts) {
        let tile = { resolved: [], rejected: [] };
        if (utils_1.isArray(items)) {
            return Promise.all(items.map((x) => __awaiter(this, void 0, void 0, function* () { return yield this.acquire(this.defaultOpts(opts, x, tile)); }))).then((value) => {
                value[tileSym] = tile;
                return value;
            });
        }
        else {
            return this.acquire(this.defaultOpts(opts, items, tile));
        }
    }
    static rejected(result) {
        return result[tileSym].rejected;
    }
    static resolved(result) {
        return result[tileSym].resolved;
    }
    acquire(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            this.queueItemSize += 1;
            try {
                opts._poolReference = yield this.pool.acquire(opts.priority);
                let result = yield opts.acquire(opts.item);
                if (opts.rateLimit) {
                    setTimeout(function () { this.emit('pool:release', opts); }, opts.rateLimit);
                }
                else {
                    this.emit('pool:release', opts);
                }
                opts.tile.resolved.push(opts.item);
                return opts.release(result, opts.item);
            }
            catch (error) {
                this.emit('pool:release', opts);
                return this.retry(opts, error);
            }
        });
    }
    retry(opts, error) {
        return __awaiter(this, void 0, void 0, function* () {
            opts.retryTimes ? opts.retryTimes += 1 : opts.retryTimes = 1;
            console.log(`retry: [${opts.retryTimes}/${opts.maxRetryTimes}] times`);
            return new Promise((resolve, reject) => {
                if (opts.retryTimes >= opts.maxRetryTimes) {
                    resolve(this.error(opts, error));
                }
                else {
                    opts.priority = 0;
                    setTimeout((opts) => __awaiter(this, void 0, void 0, function* () {
                        return resolve(yield this.acquire(opts));
                    }), opts.retryTimeout, opts);
                }
            });
        });
    }
    error(opts, error) {
        if (opts.error) {
            delete opts._poolReference;
            opts.tile.rejected.push(opts.item);
            return opts.error(error, opts.item);
        }
        else {
            return console.log("error:", error);
        }
    }
    map(items, acquire, opts = {}) {
        if (typeof (opts) === 'number') {
            opts = { concurrency: opts };
        }
        opts.acquire = acquire;
        return this.queue(items, opts);
    }
    static map(items, acquire, opts = 10) {
        if (typeof (opts) === 'number') {
            opts = { concurrency: opts };
        }
        opts.acquire = acquire;
        return __typhoeus.queue(items, opts);
    }
}
__typhoeus = new Typhoeus();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Typhoeus;
//# sourceMappingURL=typhoeus.js.map