require("dotenv").config()
const express = require('express')
const mongoose = require('mongoose')
const app = express()
const cors = require('cors')
app.use(cors())
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

const port = process.env.PORT
const server = app.listen(port, () => {
    console.log("server is listening at port ", port)
})