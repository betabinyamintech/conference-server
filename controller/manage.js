var express = require('express')
var router = express.Router()
const User = require('../model/user')
const Room = require('../model/room')
const Booking = require('../model/booking')
const phoneVerification = require('../model/phoneVerification')
const Subscribers = require('../model/subscribers')
const { verifyToken } = require('../middleware/verifyToken')
const jwt = require('jsonwebtoken')

router.get('/getMeetingRooms', async (req, res) => {
    console.log("getMeetingRooms", req.body)
    try {

        const rooms = await Room.find().sort({ maxOfPeople: 1 }).exec()
        console.log("manage - getMeetingRooms - rooms: ",rooms);
        return res.json({rooms:rooms });  

    } catch (error) {
        console.log("Error: ", error)
       return res.status(500).send(error)
    }
})

module.exports = router