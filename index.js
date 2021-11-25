require("dotenv").config()
const express = require('express')
const mongoose = require('mongoose')
const app = express()
const cors = require('cors')

var whitelist = ['https://rooms.binyamintech.co.il', 'http://localhost:3000']
var corsOptionsDelegate = function (req, callback) {
    var corsOptions;
    if (whitelist.indexOf(req.header('Origin')) !== -1) {
        console.log("req.header('Origin')) !== -1")
        corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
    } else {
        console.log("else", req.header('Origin'))
        corsOptions = { origin: false } // disable CORS for this request
    }
    callback(null, corsOptions) // callback expects two parameters: error and options
}
app.use(cors(corsOptionsDelegate))
app.use(express.json())


app.use('/auth', require('./controller/auth'))
app.use('/booking', require('./controller/booking'))
app.use('/manage', require('./controller/manage'))

mongoose.connect(process.env.DATABASE_CONNECTION)
    .then(() => {
        console.log("mongo is connected")
    })
    .catch((err) => {
        console.log("mongo connection error: " + err)
    })

const port = process.env.PORT || 80
const server = app.listen(port, () => {
    console.log("server is listening at port ", port)
})