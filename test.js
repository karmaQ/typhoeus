import Typhoeus from "./index"

let genPrm = ()=>{
  if(Math.random()*5 > 4) {
    throw new Error('hahaha error')
  }
  return new Promise((resolve, reject)=>{
    setTimeout(()=>{
      resolve(new Date())
    }, 1000)
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
  while(i++ < 10){ arr.push(i) }
  let res = await ty.queue(arr)
  console.log(ty.rejected(res))

}
re();
// (function wait () {
//    if (true) setTimeout(wait, 1000);
// })()