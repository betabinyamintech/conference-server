var express = require('express')
var router = express.Router()
const User = require('../model/user')
const jwt = require('jsonwebtoken')
const Room = require('../model/room')
const Booking = require('../model/booking')


const verifyToken = async (req, res, next) => {
    console.log('verify token', req.headers)

    const token = req.headers.authorization
    try {
        const decoded = jwt.verify(token, process.env.SECRET)
        const user = await User.findOne({ email: decoded.email }).exec()
        delete user.password
        req.user = user
        console.log('authorization user', req.user)
        next()
    } catch (error) {
        res.status(403).send("token invalid or expired")
    }
    // hide the password
}

router.post('/register', async (req, res) => {
    try {
        console.log({ body: req.body })
        const { email, password } = req.body

        if (email == null || password == null) {
            res.status(400).send("email or password missing")
            return res;
        }
        const minChars = 3
        if (password.length < minChars) {
            res.status(400).send(`Password is less than ${minChars} characters`)
            return res;
        }

        const existingUser = await User.findOne({ email }).exec()
        console.log({ existingUser })
        if (existingUser) {
            res.status(400).send("User Already Exists")
            return res;
        }
        console.log("creaeting user", req.body)
        const newUser = await User.create(req.body)
        res.json({ token: jwt.sign({ email }, process.env.SECRET, { expiresIn: "2h" }) })
        return res;
    }

    catch (error) {
        console.log("Error: ", error)
        res.status(500).send(error)
    }
})

router.post('/login', async (req, res) => {
    console.log("login", req.body)
    try {
        const { email, password } = req.body
        const existingUser = await User.findOne({ email, password }).exec()
        if (!existingUser) {
            res.status(400).send("User or Password Invalid")
            return;
        }

        res.json({ token: jwt.sign({ email }, process.env.SECRET, { expiresIn: "2h" }) })

    } catch (error) {
        console.log("Error: ", error)
        res.status(500).send(error)
    }
})

router.get('/user', verifyToken, async (req, res) => {
    res.json(req.user)
})

router.get('/', verifyToken, async (req, res) => {
    return res.json(req.user)
})

router.post('/bookingRequestToServer', async (req, res) => {
    const { date, fromTime, toTime, numberOfParticipants } = req.body
    console.log("date: ", date, "fromTime: ", fromTime, "toTime", toTime,
        "numberOfParticipants", numberOfParticipants)

    try {
        const findRoom = await Room.find({}).exec()
        if (!findRoom) {
            res.status(400).send("Somthing wrong...")
            return;
        }
        roomMatchPeople = findRoom.filter((room) => (room.maxOfPeople >= numberOfParticipants))
        console.log("findRoom", roomMatchPeople)
        roomMatchPeople.sort((a, b) => (a.maxOfPeople < b.maxOfPeople && a.value < b.value ? -1 : 1))
        let allBooking = [];
        let matchingRoom = "";
        for (i = 0; i < roomMatchPeople.length; i++) {
            matchingRoom = roomMatchPeople[i]
            // && {meetingDate:date}
            allBooking = await Booking.find({ roomId: matchingRoom._id })
            const sameTimeBooking = allBooking.filter((booking) =>
                (booking.endTime > fromTime && booking.startTime < toTime))
            if (!sameTimeBooking) {
                break;
            }
        }
        if (i < roomMatchPeople.length)
            return matchingRoom;
        else {
            // roomMatchPeople=roomMatchPeople.filter((room)=>roomMatchPeople[0].value==room.value)
            // allOptions=[]
            // for (i = 0; i < roomMatchPeople.length; i++) {
            //     matchingRoom = roomMatchPeople[i]
            //     // && {meetingDate:date}
            //     allBooking = await Booking.find({ roomId: matchingRoom._id })
            //     const sameTimeBooking = allBooking.filter((booking) =>
            //         (booking.endTime > fromTime && booking.startTime < toTime))
            //     if (!sameTimeBooking) {
            //         // allOptions.push(matchingRoom)
            //         break;
            //     }
            // }
        }

    } catch (error) {
        console.log("Error: ", error)
        res.status(500).send(error)
    }
})

module.exports = router