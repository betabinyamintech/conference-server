const mongoose=require('mongoose')
const {Schema}= mongoose

const bookingSchema=new Schema({
    meetingDate:{
        type:String,
        // require:true
    } ,
    startTime:{
        type:Number,
        require:true
    },
    endTime:{
        type:Number,
        require:true  
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