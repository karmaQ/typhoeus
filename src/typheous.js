import { EventEmitter } from "events"
import { createPool } from "generic-pool"
import { castArray, isArray } from "./utils"

class Typheous extends EventEmitter {
  constructor(opts = {}) {
    super()
    this._opts = opts
    this._opts.retryTimeout = opts.retryTimeout || 3000
    this._opts.acquire = opts.acquire || (r=>r)
    this._opts.release = opts.release || (r=>r)
    this._opts.error = opts.error || (r=>r)
    if(opts.rateLimit) {
      opts.concurrency = 1,
      opts.rateLimit = opts.rateLimit
    }
    this.pool = createPool({
        create: opts.create || Math.random ,
        destroy: opts.destroy || console.log,
      }, {
        max: opts.concurrency || 10,
        priorityRange: opts.priorityRange || 10,
        Promise: opts.Promise || global.Promise
      }
    )

    this.queueItemSize = 0
    this.plannedQueueCalls = 0
    this.catched = []
    this.on('pool:release', opts => this.release(opts))
    this.on('pool:drain', opts => {if(opts.drain) { opts.drain() }} )
  }

  async release(opts) {
    this.queueItemSize -= 1
    try {
      await this.pool.release(opts._poolReference)
      if(this.queueItemSize + this.plannedQueueCalls == 0) {
        this.emit('pool:drain', opts)
      }
    } catch(ex) {
      console.log('released callback error:', ex)
    } finally {
      return opts.result
    }
  }

  /**
   * 
   * @param {Object} opts - The queue options
   */
  
  defaultOpts(opts = {}, item) {
    let retopts = {}
    if(item !== undefined) { retopts.item = item }
    retopts.retryTimeout = opts.retryTimeout || this._opts.retryTimeout || 3000
    retopts.acquire = opts.acquire || this._opts.acquire
    retopts.release = opts.release || this._opts.release
    retopts.error = opts.error || this._opts.error
    retopts.maxRetryTimes = this._opts.maxRetryTimes || 3
    let rateLimit = opts.rateLimit || this._opts.rateLimit
    if(rateLimit) {
      retopts.concurrency = 1,
      retopts.rateLimit = rateLimit
    }
    return retopts
  }

  queue(items, opts) {
    this.lastCatched = []
    if(isArray(items)) {
      return Promise.all(items.map(async (x) => await this.acquire(this.defaultOpts(opts, x))))
    } else {
      return this.acquire(this.defaultOpts(opts, items))
    }
  }

  async acquire(opts) {
    this.queueItemSize += 1
    try {
      // let _poolReference = await this.pool.acquire(opts.priority)
      opts._poolReference = await this.pool.acquire(opts.priority)
      // 回调在这里生成
      // console.log(opts._poolReference, opts)
      opts.result = await opts.acquire(opts)
      if(opts.rateLimit) {
        setTimeout(function(){ this.emit('pool:release', opts) }, opts.rateLimit)
      } else {
        this.emit('pool:release', opts)
      }
      return opts.release(opts.result, opts.item) 
    } catch(error) {
      this.emit('pool:release', opts)
      return this.retry(opts, error)
    }
  }

  /**
   * 
   * @param {Object} opts - The options
   * @param {Object} ex - The error
   * @returns {Promise} - 
   */
  async retry(opts, error) {
    opts.retryTimes ? opts.retryTimes += 1 : opts.retryTimes = 1
    console.log(`retry: [${opts.retryTimes}/${opts.maxRetryTimes}] times`)
    return new Promise((resolve, reject)=>{
      if(opts.retryTimes >= opts.maxRetryTimes) {
        resolve(this.error(opts, error))
      } else {
        opts.priority = 0
        setTimeout(async (opts)=>{
          return resolve(await this.acquire(opts))
        }, opts.retryTimeout, opts)
      }
    })
  }

  error(opts, error) {
    if(opts.error) {
      delete opts._poolReference
      // delete opts.retryTimes
      // delete opts.retryTimeout
      this.catched.push(opts.item)
      this.lastCatched.push(opts.item)
      return opts.error(error, opts.item)
    } else {
      return console.log("error:", error)
    }
  }
}
export default Typheous
