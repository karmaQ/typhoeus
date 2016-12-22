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
class Typheous extends events_1.EventEmitter {
    constructor(opts) {
        super();
        this.options = {
            concurrency: opts.concurrency || 10,
            onDrain: false,
            priority: 5
        };
        if (opts.gap) {
            this.options.concurrency = 1,
                this.options.gap = opts.gap;
        }
        this.pool = generic_pool_1.Pool({
            name: 'pool',
            max: this.options.concurrency,
            priorityRange: 10,
            create: cb => cb(1),
            destroy: () => { }
        });
        this.queueItemSize = 0;
        this.plannedQueueCalls = 0;
        this.on('pool:release', opts => this.release(opts));
        this.on('pool:drain', opts => {
            if (opts.onDrain) {
                opts.onDrain();
            }
        });
    }
    release(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            this.queueItemSize -= 1;
            try {
                this.pool.release(opts._poolReference);
                if (this.queueItemSize + this.plannedQueueCalls == 0) {
                    this.emit('pool:drain', opts);
                }
                opts.release && (yield opts.release(opts.result));
            }
            catch (ex) {
                console.log('released callback error:', ex);
            }
        });
    }
    queue(opts) {
        if (!Array.isArray(opts)) {
            opts = [opts];
        }
        opts.map((x) => this.queuePush(x));
    }
    queuePush(opts) {
        this.queueItemSize += 1;
        this.pool.acquire((error, poolReference) => __awaiter(this, void 0, void 0, function* () {
            opts._poolReference = poolReference;
            if (error) {
                console.error('pool acquire error:', error);
            }
            try {
                opts.result = yield opts.processor(error, opts);
                this.emit('pool:release', opts);
            }
            catch (ex) {
                this.onError(opts, ex);
            }
        }), opts.priority || 5);
    }
    onError(opts, error) {
        if (opts.onError) {
            opts.onError(error);
        }
        else {
            console.log("error:", error);
        }
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Typheous;
//# sourceMappingURL=typheous.js.map