import Typheous from "./index"
let ty = new Typheous
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



let re = async ()=> {
  // await ty.queue([1,2,3,4,5,6,1,2,3,4,5,6].map( x => { return {acquire: genPrm, release: (x)=>{
  //   return x + '2'
  // }} }))
  let arr = [], i = 100
  while(i-- >0){ arr.push(i) }
  console.log(await ty.queue(arr.map( x => { return {
    acquire: genPrm, 
    release: (x)=>{ return x },
    error: (error, opts)=> { console.log(opts) }
  } })))
}
re();
// (function wait () {
//    if (true) setTimeout(wait, 1000);
// })()