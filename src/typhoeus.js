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
        create: this._opts.create || Math.random ,
        destroy: this._opts.destroy || console.log,
      }, {
        max: this._opts.concurrent,
        priorityRange: this._opts.priorityRange || 1,
        Promise: this._opts.Promise || global.Promise
      }
    )

    this.queueItemSize = 0
    this.plannedQueueCalls = 0
    this._pause = false
    this.neededRelease = []
    this.on('pool:release', this.release)
    this.on('pool:drain', opts => {if(opts.drain) { opts.drain() }} )
  }

  async release(opts) {
    try {
      if(this._pause) {
        this.neededRelease.push(opts)
      } else {
        this.queueItemSize -= 1
        await this.pool.release(opts._poolReference)
        if(this.queueItemSize + this.plannedQueueCalls == 0) {
          this.emit('pool:drain', opts)
        }
      }
    } catch(ex) {
      console.log('released callback error:')
      console.log(ex)
    }
  }

  pause() {
    this.pause = true
  }

  resume() {
    this._pause = false
    let neededRelease = this.neededRelease
    this.neededRelease = []
    for(let nr of neededRelease) {
      this.emit('pool:release', nr)
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
    retopts.concurrent = opts.concurrent || this._opts.concurrent || 10
    retopts.priorityRange = opts.priorityRange || this._opts.priorityRange || 1
    let rateLimit = opts.rateLimit || this._opts.rateLimit
    if(rateLimit) {
      retopts.concurrent = 1,
      retopts.rateLimit = rateLimit
    }
    return retopts
  }

  async queue(items, opts) {
    let tile = {resolved:[], rejected: []}
    opts = items.opts ? items.opts : opts
    if(isArray(items)) {
      return await Promise.all(items.map(async (x) => await this.acquire(this.defaultOpts(opts, x, tile))))
        .then((value)=>{
          value[tileSym] = tile
          return value
        }
      )
    } else {
      return this.acquire(this.defaultOpts(opts, items, tile))
    }
  }

  static rejected(result) {
    return result[tileSym].rejected
  }

  static resolved(result) {
    return result[tileSym].resolved
  }

  async acquire(opts) {
    let result
    this.queueItemSize += 1
    opts._poolReference = await this.pool.acquire(opts.priority)
    try {
      result = await opts.acquire(opts.item)
      if(opts.rateLimit) {
        setTimeout(()=>{ 
          opts.tile.resolved.push(opts.item)
          this.emit('pool:release', opts) 
        }, opts.rateLimit)
      } else {
        opts.tile.resolved.push(opts.item)
        this.emit('pool:release', opts)
      }
      
    } catch(error) {
      this.emit('pool:release', opts)
      return this.retry(opts, error)
    }
    try {
      return opts.release(result, opts.item) 
    } catch(err) {
      this.error(opts, err)
    }
  }

  /**
   * 
   * @param {Object} opts - The options
   * @param {Object} error - The error
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
      opts.tile.rejected.push(opts.item)
      return opts.error(error, opts.item)
    } else {
      return console.log("error:", error)
    }
  }

  map(items, acquire, opts = 10) {
    if(typeof(opts) === 'number') {
      opts = { concurrent: opts }
    }
    opts.acquire = acquire
    return this.queue(items, opts)
  }

  static map(items, acquire, opts = 10) {
    if(typeof(opts) === 'number') {
      opts = { concurrent: opts }
    }
    opts.acquire = acquire
    return __typhoeus.queue(items, opts)
  }
}
__typhoeus = new Typhoeus()

export default Typhoeus
