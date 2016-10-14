"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
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
            concurrency: 10,
            onDrain: false,
            priority: 5
        };
        if (opts.gap) {
            this.options.concurrency = 1;
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
        this.queueItemSize -= 1;
        this.pool.release(opts._poolReference);
        if (this.queueItemSize + this.plannedQueueCalls == 0) {
            this.emit('pool:drain', opts);
        }
    }
    queue(opts) {
        if (!Array.isArray(opts))
            opts = [opts];
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
                let retval = yield opts.processor(error, opts);
                opts.after && (yield opts.after(retval));
            }
            catch (ex) {
                this.onError(opts, ex);
            }
            if (opts.gap) {
                setTimeout(() => {
                    this.emit('pool:release', opts);
                }, opts.gap);
            }
            else {
                this.emit('pool:release', opts);
            }
        }), opts.priority);
    }
    onError(opts, ex) {
        console.log("error:", opts, ex);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Typheous;
//# sourceMappingURL=typheous.js.map