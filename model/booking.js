const mongoose=require('mongoose')
const {Schema}= mongoose

const bookingSchema=new Schema({
    meetingDate:{
        type:Date,
        require:true
    } ,
    startTime:{
        type:Date,
        require:true
    },
    endTime:{
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
    },
    logDate:{
        type:Date,
        require:true
    },
    PayMethod:{
        type:mongoose.Types.ObjectId,
        ref:'payMethod'
    }
})    
module.exports=mongoose.model('booking',bookingSchema)