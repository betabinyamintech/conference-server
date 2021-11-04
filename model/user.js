const mongoose=require('mongoose')
const {Schema}= mongoose

const userSchema=new Schema({
    name:{
        type:String,
        require:true
    } ,
    password:{
        type:String,
        require:true
    },
    email:{
      type:String,
      require:true
    } ,
    phone:{
        type:String,
        require:true
    },
    myTokens:{
        type:Number
    },
     lastBookingId:[{
      type:mongoose.Types.ObjectId,
      ref:'booking'
    }],
    nextBookingId:[{
        type:mongoose.Types.ObjectId,
        ref:'booking'
      }]
})
module.exports=mongoose.model('user',userSchema)