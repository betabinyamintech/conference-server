const mongoose=require('mongoose')
const {Schema}= mongoose

const roomSchema=new Schema({
    name:{
        type:String,
        require:true
    } ,
    Value:{
        type:Number,
        require:true
    },
    maxOfPeople:{
        type:Number,
        require:true
    }
})    
module.exports=mongoose.model('room',roomSchema)