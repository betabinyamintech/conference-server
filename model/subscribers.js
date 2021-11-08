const mongoose = require('mongoose')
const { Schema } = mongoose
const subscribersSchema = new Schema({
    name: {
        type: String,
        require: true
    },
    phone: {
        type: String,
        require: true,
        unique: true
    },
    program: {
        type: mongoose.Types.ObjectId,
        ref: 'programs'
    },
   coinsBlance: {
        type: Number
    }

})
module.exports = mongoose.model('subscribers', subscribersSchema)