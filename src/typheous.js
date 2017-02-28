import { EventEmitter } from "events"
import { createPool } from "generic-pool"
import { castArray } from "./utils"

class Typheous extends EventEmitter {
  constructor(opts = {}) {
    super()
    this.opts = opts
    this.opts.retryTimeout = this.opts.retryTimeout || 3000
    this.opts.acquire = opts.acquire || (r=>r)
    this.opts.release = opts.release || (r=>r)
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
  queue(opts) {
    return Promise.all(castArray(opts).map(async (x) => await this.acquire(x)))
  }

  async acquire(opts) {
    this.queueItemSize += 1
    try {
      opts._poolReference = await this.pool.acquire(opts.priority)
      // 回调在这里生成
      opts.result = await (opts.acquire || this.opts.acquire)(opts)
      this.emit('pool:release', opts)
      return (opts.release || this.opts.release)(opts) 
    } catch(ex) {
      this.emit('pool:release', opts)
      return this.retry(opts, ex)
    }
  }

  /**
   * 
   * @param {Object} opts - The options
   * @param {Object} ex - The error
   * @returns {Promise} - 
   */
  async retry(opts, ex) {
    console.log(`retry: ${opts.retryTimes || 1} times`)
    opts.retryTimes ? opts.retryTimes += 1 : opts.retryTimes = 1
    return new Promise((resolve, reject)=>{
      if(opts.retryTimes >= 3) {
        resolve(this.error(opts, ex))
      } else {
        opts.priority = 0
        setTimeout(async (opts)=>{
          return resolve(await this.acquire(opts))
        }, opts.retryTimeout || this.opts.retryTimeout, opts)
      }
    })
  }

  error(opts, error) {
    if(opts.error) {
      // delete opts._poolReference
      // delete opts.retryTimes
      // delete opts.retryTimeout
      return opts.error(error, opts)
    } else {
      return console.log("error:", error)
    }
  }
}
export default Typheous
