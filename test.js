import Typheous from "./index"
let ty = new Typheous
let genPrm = ()=>{
  return new Promise((resolve, reject)=>{
    setTimeout(()=>{
      resolve(new Date())
    }, 1000)
  })
}



let re = async ()=> {
  console.log(await ty.queue([1,2,3,4,5,6].map( x => { return {acquire: genPrm} })))
  console.log(await ty.queue([3,4,5,5,6].map( x => { return {acquire: genPrm} })))
}
re()