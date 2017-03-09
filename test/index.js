import { expect } from 'chai'

import Typhoeus from "../index"

let getPromise = ()=>{
  // if(Math.random()*50 > 45) {
  //   throw new Error('hahaha error')
  // }
  return new Promise((resolve, reject)=>{
    setTimeout(()=>{
      resolve(42)
    }, Math.floor(Math.random()* 1000))
  })
}

let typhoeus = new Typhoeus({
    concurrency: 5,
    acquire: getPromise, 
    release: (x, y)=>{ return x },
    error: (error, opts)=> { console.log(opts) },
    maxRetryTimes: 1
})


// let re = async ()=> {
//   // await ty.queue([1,2,3,4,5,6,1,2,3,4,5,6].map( x => { return {acquire: genPrm, release: (x)=>{
//   //   return x + '2'
//   // }} }))
//   let arr = [], i = 0
//   while(i++ < 100){ arr.push(i) }
//   let res = await ty.queue(arr)
//   console.log(res)
//   // let res2 = await Typhoeus.map(arr, genPrm, 3)
//   // console.log(res2)

//   // let res3 = await ty.map(arr, genPrm, 3)
//   // console.log(res3)

//   // res2.forEach(console.log)
// }
// re();
// (function wait () {
//    if (true) setTimeout(wait, 1000);
// })()


describe('使用 Typhoeus 控制并发,', function(){
  it('快捷 map 启动', async function() {
    let arr = [], i = 0
    while(i++ < 10){ arr.push(i) }
    let ret = await Typhoeus.map(arr, getPromise, 3)
    expect(ret).to.be.eql([ 42, 42, 42, 42, 42, 42, 42, 42, 42, 42 ])
  })

  // it('map 启动', async function() {
  //   let arr = [], i = 0
  //   while(i++ < 10){ arr.push(i) }
  //   let ty = new Typhoeus()
  //   let ret = await ty.queue(arr, getPromise, 3)
  //   expect(ret).to.be.eql([ 42, 42, 42, 42, 42, 42, 42, 42, 42, 42 ])
  // })
});

