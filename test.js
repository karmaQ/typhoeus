import Typheous from "./index"
let ty = new Typheous
let genPrm = ()=>{
  return new Promise((resolve, reject)=>{
    setTimeout(()=>{
      console.log(new Date())
      resolve()
    }, 3000)
  })
}

ty.queue([1,2,3,4,5,6]
         .map( x =>
               return {processor: genPrm}
             )
        )
