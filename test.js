import Typheous from "./index"
let ty = new Typheous
let genPrm = ()=>{
  return new Promise((resolve, reject)=>{
    setTimeout(()=>{
      resolve(new Date())
    }, 100)
  })
}



let re = async ()=> {
  return console.log(await ty.queue([1,2,3,4,5,6].map( x => { return {acquire: genPrm} })))
}
re()