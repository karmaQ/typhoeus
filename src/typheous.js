import { EventEmitter } from "events"
import { createPool } from "generic-pool"
import { castArray } from "./utils"

class Typheous extends EventEmitter {
  constructor(opts = {}) {
    super()

    if(opts.rateLimit) {
      opts.concurrency = 1,
      opts.rateLimit = opts.rateLimit
    }    
    this.pool = createPool({
        create: async (r) => {return Math.random()*100000000} ,
        destroy: () => Promise.resolve()
      }, {
        max: opts.concurrency || 10,
        priorityRange: opts.priorityRange || 10,
        Promise: opts.Promise || global.Promise
      })

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
      opts.release && (await opts.release(opts.result))
    } catch(ex) {
      console.log('released callback error:', ex)
    }
  }

  queue(opts) {
    return Promise.all(castArray(opts).map(async (x) => await this.queuePush(x)))
  }

  async queuePush(opts) {
    this.queueItemSize += 1
    try {
      opts._poolReference = await this.pool.acquire(opts.priority)
      opts.result = await opts.acquire(opts)
    } catch(ex) {
      this.error(opts, ex)
    } finally {
      this.emit('pool:release', opts)
      return opts.result
    }
  }

  async error(opts, error) {
    if(opts.error) {
      await opts.error(error)
    } else {
      console.log("error:", error)
    }
  }
}
export default Typheous
