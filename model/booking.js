const mongoose=require('mongoose')
const {Schema}= mongoose

const bookingSchema=new Schema({
    meetingDate:{
        type:String,
        // require:true
    } ,
    startTime:{
        type:String,
        // require:true
    },
    endTime:{
        type:String,
        // require:true  
    },
    roomId:{
        type:mongoose.Types.ObjectId,
        ref:'room'
    },
    owner:{
        type:mongoose.Types.ObjectId,
        ref:'user'
    },
    logDate:{
        type:String,
        // require:true
    },
    PayMethod:{
        type:mongoose.Types.ObjectId,
        ref:'payMethod'
    }
}) 
module.exports=mongoose.model('booking',bookingSchema)