import Typhoeus from "./index"

let genPrm = ()=>{
  if(Math.random()*5 > 4) {
    throw new Error('hahaha error')
  }
  return new Promise((resolve, reject)=>{
    setTimeout(()=>{
      resolve(new Date())
    }, Math.floor(Math.random()* 1000))
  })
}

let ty = new Typhoeus({
    concurrency: 5,
    acquire: genPrm, 
    release: (x, y)=>{ return [y, x] },
    error: (error, opts)=> { console.log(opts) },
    maxRetryTimes: 1
})


let re = async ()=> {
  // await ty.queue([1,2,3,4,5,6,1,2,3,4,5,6].map( x => { return {acquire: genPrm, release: (x)=>{
  //   return x + '2'
  // }} }))
  let arr = [], i = 0
  while(i++ < 100){ arr.push(i) }
  // let res = await ty.queue(arr)
  // console.log(res)
  // let res2 = await Typhoeus.map(arr, genPrm, 3)
  // console.log(res2)

  let res3 = await ty.map(arr, genPrm, 3)
  console.log(res3)

  // res2.forEach(console.log)
}
re();
// (function wait () {
//    if (true) setTimeout(wait, 1000);
// })()