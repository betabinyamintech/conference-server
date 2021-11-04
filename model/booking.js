const mongoose=require('mongoose')
const {Schema}= mongoose

const bookingSchema=new Schema({
    date:{
        type:Date,
        require:true
    } ,
    Time:{
        type:Date,
        require:true
    },
    roomId:{
        type:mongoose.Types.ObjectId,
        ref:'room'
    },
    owner:{
        type:mongoose.Types.ObjectId,
        ref:'user'
    }
})    
module.exports=mongoose.model('booking',bookingSchema)