import { EventEmitter } from "events"
import { Pool } from "generic-pool"

class Typheous extends EventEmitter {
  constructor(opts) {
    super()
    this.options = {
      concurrency: 10,
      onDrain: false,
      priority: 5
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
    // setInterval(()=> {
    //   console.log("--->>> pool", this.pool)
    // }, 30000)
  }

  release(opts) {
    this.queueItemSize -= 1
    this.pool.release(opts._poolReference)
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
      try {
        let retval = await opts.processor(error, opts)
        // opts.after && (opts.after(retval))
        opts.after && (await opts.after(retval))
      } catch (ex) {
        this.onError(opts, ex)
      }
      this.emit('pool:release', opts)
    }, opts.priority)
  }

  onError(opts, ex) {
    console.log("error:", opts, ex)
  }
}
export default Typheous
