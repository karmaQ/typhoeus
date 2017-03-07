import { EventEmitter } from "events"
import { createPool } from "generic-pool"
import { castArray, isArray } from "./utils"
let tileSym = Symbol('tile')
let __typhoeus
class Typhoeus extends EventEmitter {
  constructor(opts = {}) {
    super()
    this._opts = {}
    this._opts = this.defaultOpts(opts)

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
  
  defaultOpts(opts = {}, item, tile) {
    let retopts = {}
    if(tile) { retopts.tile = tile }
    if(item !== undefined) { retopts.item = item }
    retopts.retryTimeout = opts.retryTimeout || this._opts.retryTimeout || 3000
    retopts.acquire = opts.acquire || this._opts.acquire || (x=> x)
    retopts.release = opts.release || this._opts.release || (x=> x)
    retopts.error = opts.error || this._opts.error || console.log
    retopts.maxRetryTimes = this._opts.maxRetryTimes || 3
    let rateLimit = opts.rateLimit || this._opts.rateLimit
    if(rateLimit) {
      retopts.concurrency = 1,
      retopts.rateLimit = rateLimit
    }
    return retopts
  }

  queue(items, opts) {
    let tile = {resolved:[], rejected: []}
    if(isArray(items)) {
      return Promise.all(items.map(async (x) => await this.acquire(this.defaultOpts(opts, x, tile)))).then((value)=>{
        value[tileSym] = tile
        return value
      })
    } else {
      return this.acquire(this.defaultOpts(opts, items))
    }
  }

  static rejected(result) {
    return result[tileSym].rejected
  }

  static resolved(result) {
    return result[tileSym].resolved
  }

  async acquire(opts) {
    this.queueItemSize += 1
    try {
      // let _poolReference = await this.pool.acquire(opts.priority)
      opts._poolReference = await this.pool.acquire(opts.priority)
      // 回调在这里生成
      // console.log(opts._poolReference, opts)
      let result = await opts.acquire(opts)
      if(opts.rateLimit) {
        setTimeout(function(){ this.emit('pool:release', opts) }, opts.rateLimit)
      } else {
        this.emit('pool:release', opts)
      }
      opts.tile.resolved.push(opts.item)
      return opts.release(result, opts.item) 
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
      opts.tile.rejected.push(opts.item)
      return opts.error(error, opts.item)
    } else {
      return console.log("error:", error)
    }
  }

  map(items, acquire, opts = {}) {
    if(typeof(opts) === 'number') {
      opts = { concurrency: opts }
    }
    opts.acquire = acquire
    return this.queue(items, opts)
  }

  static map(items, acquire, opts = 10) {
    if(typeof(opts) === 'number') {
      opts = { concurrency: opts }
    }
    opts.acquire = acquire
    return __typhoeus.queue(items, opts)
  }
}
__typhoeus = new Typhoeus()

export default Typhoeus
