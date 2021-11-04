const mongoose=require('mongoose')
const {Schema}= mongoose

const adminSchema=new Schema({
  name: {
     type:String,
     require:true 
   },
   password:{
       type:String,
       require:true
   },
   users:[{
    type:mongoose.Types.ObjectId,
    ref:'user'
  }],
  bokkings:[{
    type:mongoose.Types.ObjectId,
    ref:'booking'
  }],


})    
module.exports=mongoose.model('admin',adminSchema)