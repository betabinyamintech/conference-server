const mongoose=require('mongoose')
const {Schema}= mongoose

const phoneVerificationSchema=new Schema({
    
    phone: String,
    code: String,
    timestamp: { type: Date, default: Date.now }
})


module.exports=mongoose.model('phoneVerification',phoneVerificationSchema)