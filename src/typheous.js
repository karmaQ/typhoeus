import { EventEmitter } from "events"
import { Pool } from "generic-pool"

class Typheous extends EventEmitter {
  constructor(opts) {
    super()
    // opts.gap = 3000
    this.options = {
      concurrency: opts.concurrency || 10,
      onDrain: false,
      priority: 5
    }
    if(opts.gap) {
      this.options.concurrency = 1,
      this.options.gap = opts.gap
    }    
    this.pool = Pool({
      name: 'pool',
      max: this.options.concurrency,
      priorityRange: 10,
      create: cb => cb(1),
      destroy: () => {}
    })
    this.queueItemSize = 0
    this.plannedQueueCalls = 0
    this.on('pool:release', opts => this.release(opts))
    this.on('pool:drain', opts => {
      if(opts.onDrain) {
        opts.onDrain()
      }
    })
  }

  async release(opts) {
    this.queueItemSize -= 1
    // console.log(this.queueItemSize + this.plannedQueueCalls, this.pool._inUseObjects)
    this.pool.release(opts._poolReference)
    opts.release && (await opts.release(opts.result))
    if(this.queueItemSize + this.plannedQueueCalls == 0) {
      this.emit('pool:drain', opts)
    }
  }

  queue(opts) {
    // TODO 兼容性!!!
    if(!Array.isArray(opts))
      opts = [ opts ]
    opts.map((x) => this.queuePush(x))
  }

  queuePush(opts) {
    this.queueItemSize += 1
    this.pool.acquire(async (error, poolReference) => {
      opts._poolReference = poolReference
      if(error) {
        console.error('pool acquire error:', error)
      }
      // opts.gap = 3000
      if(opts.gap) {
        try {
          let result = await opts.processor(error, opts)
          // opts.after && (opts.after(result))
          // opts.after && (await opts.after(result))
          opts.result = result
        } catch (ex) {
          opts.retry = opts.retry || 0
          opts.retry += 1
          if(opts.retry < 6) {
            this.queue(opts)
          } else {
            this.onError(opts, ex)
          }
        }
        setTimeout(()=>{
          this.emit('pool:release', opts)
        }, opts.gap)
      } else {
        setImmediate(()=>{
          this.emit('pool:release', opts)
        })
      }
    }, opts.priority || 5)
  }

  onError(opts, error) {
    if(opts.onError) {
      opts.onError(error)
    } else {
      console.log("error:", error)
    }
  }
}
export default Typheous
