import { expect } from 'chai'

import Typhoeus from "../index"

let getPromise = ()=>{
  if(Math.random()*50 > 40) {
    throw new Error('hahaha error')
  }
  return new Promise((resolve, reject)=>{
    setTimeout(()=>{
      resolve(42)
    }, Math.floor(Math.random()* 3000))
  })
}

let typhoeus = new Typhoeus({
    concurrent: 5,
    acquire: getPromise, 
    release: (x, y)=>{ return x },
    // error: (error, opts)=> { console.log(opts) },
    maxRetryTimes: 3
})

describe('使用 Typhoeus 控制并发,', function(){
  // it('快捷 map 启动', async function() {
  //   let arr = [], i = 0
  //   while(i++ < 10){ arr.push(i) }
  //   let ret = await Typhoeus.map(arr, getPromise, 1)
  //   expect(ret).to.be.eql([ 42, 42, 42, 42, 42, 42, 42, 42, 42, 42 ])
  // })

  it('queue 启动', async function() {
    let arr = [], i = 0
    while(i++ < 10){ arr.push(i) }
    let typhoeus = new Typhoeus({
        concurrent: 1,
        acquire: getPromise, 
        release: (x, y)=>{ return x },
        // error: (error, opts)=> { console.log(opts) },
        maxRetryTimes: 3
    })
    let ret = await typhoeus.queue(arr, 3)
    expect(ret).to.be.eql([ 42, 42, 42, 42, 42, 42, 42, 42, 42, 42 ])
  })
});

