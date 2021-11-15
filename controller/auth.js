var express = require('express')
var router = express.Router()
const User = require('../model/user')
const jwt = require('jsonwebtoken')
const Room = require('../model/room')
const Booking = require('../model/booking')
var moment = require('moment'); // require
const { $where } = require('../model/user')




const verifyToken = async (req, res, next) => {
    // console.log('verify token', req.headers)
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

router.post('/bookingcommitRequest', async (req, res) => {

    const { bookingDetails } = req.body
    const newBooking = await Booking.create(bookingDetails)
        .then(res.send("booking created"))
        .catch((err) => {
            res.send(" an error was  found while creating the booking", err)
        })
    return res.ok
})

router.post('/getAvailableBookings', async (req, res) => {
    const { date, fromTime, toTime, numberOfParticipants } = req.body.fieldsValue
    console.log(date)
    let reqFromTime = moment(fromTime).get('hour') * 60 + moment(fromTime).get('minutes')
    let reqToTime = moment(toTime).get('hour') * 60 + moment(toTime).get('minutes')
    try {
        let sameTimeBooking = []
        let i = 0
        const rooms = await Room.find({ maxOfPeople: { $gte: numberOfParticipants } }).exec()
        rooms.sort((a, b) => (a.maxOfPeople <= b.maxOfPeople ? -1 : 1))
        const bookingsFunc = async () => {
            let meetings = await Booking.find({}).exec();
            meetings = meetings.filter((d) => (
                moment(d.meetingDate).format('l') == moment(date).format('l')
            ))
            console.log("meetings: ", meetings.length)
            return meetings;
        }
        //פה זה הוציא את כל הפגישות שבאותו תאריך
        const bookings = await bookingsFunc()
        console.log("bookings", bookings)
        //לולאה שבודקת אם הזמן של הפגישה פנוי
        //זה עובד ומחזיר או חדר פנוי או מערך אלטרנטיבי


        // console.log("booking.endTime >= reqFromTime", booking.endTime, "--", reqFromTime, "response", booking.endTime >= reqFromTime)
        // console.log("booking.startTime <= reqToTime", booking.startTime, "--", reqToTime, "response", booking.startTime <= reqToTime)
        // console.log("rooms[", i, "]._id == booking.roomId", rooms[i]._id.toString(), "--", booking.roomId, "response", rooms[i]._id.toString() == booking.roomId.toString())
        // console.log("all", booking.endTime >= reqFromTime && booking.startTime <= reqToTime
        //     && rooms[i]._id.toString() == booking.roomId.toString())


        if (bookings.length != 0) {
            do {
                sameTimeBooking = bookings.filter((booking) => (
                    booking.endTime >= reqFromTime && booking.startTime <= reqToTime
                    && rooms[i]._id.toString() == booking.roomId.toString()
                ))
                i++
            } while (sameTimeBooking.length != 0 && i < rooms.length)
            i--
        }
        if (sameTimeBooking.length == 0) {
            const toTime = reqToTime
            const fromTime = reqFromTime
            const roomFound = rooms[i]
            const subResponse = { date, fromTime, toTime, roomFound }
            const response = { exact: subResponse, alternatives: null }
            console.log("response", response)
            return res.json(response);
        }
        //}
        //אם לא מצאנו חדר מתאים פנוי
        let options = []
        let numOfTrys = 1
        let optionFromTime = reqFromTime
        let optionToTime = reqToTime
        console.log("FromTime", optionFromTime, "ToTime", optionToTime)
        while (options.length < 3 && numOfTrys <= 16) {
            if (numOfTrys % 2 == 0) {//אי זוגי
                optionFromTime = optionFromTime + 15 * numOfTrys
                optionToTime = optionToTime + 15 * numOfTrys
            }
            else {//זוגי
                optionFromTime = optionFromTime - 15 * numOfTrys
                optionToTime = optionToTime - 15 * numOfTrys
            }
            console.log("optionFromTime", optionFromTime, "optionToTime", optionToTime)
            for (i = 0; i < rooms.length; i++) {

                optionBooking = bookings.filter((booking) => (
                    (booking.endTime < optionFromTime && booking.endTime < optionToTime)
                    ||
                    (booking.startTime > optionFromTime && booking.startTime > optionToTime)
                    && rooms[i]._id.toString() == booking.roomId.toString()
                ))
                console.log("optionBooking", optionBooking)
                if (optionBooking.length != 0) {
                    let roomFound = rooms[i]
                    options.push({ optionFromTime, optionToTime, date, roomFound })
                }
            }
            numOfTrys++
            console.log("options", options)
        }

        if (options.length == 0) {
            res.status(400).send("no alternatives options")
            return;
        }
        else {
            const response = { exact: null, alternatives: options }
            return res.json(response);
        }

    } catch (error) {
        res.status(500).send(error)
    }
})


module.exports = router