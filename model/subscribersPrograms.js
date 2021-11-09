const mongoose = require('mongoose')
const { Schema } = mongoose

const subscribersProgram = new Schema({
    name: {
        type: String
    },
    SumOfTokens: {
        type: Number
    },
    renewPerMonth: {
        type: Boolean
    },
    deleteBalance: {
        type: Boolean
    },
    discountPercent: {
        type: Number
    }

})