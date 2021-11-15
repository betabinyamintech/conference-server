var express = require('express')
var router = express.Router()
const User = require('../model/user')
const jwt = require('jsonwebtoken')
const Room = require('../model/room')
const Booking = require('../model/booking')
var moment = require('moment'); // require




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

router.post('/getAvailableBookings', async (req, res) => {
    const { date, fromTime, toTime, numberOfParticipants } = req.body.fieldsValue
    console.log("date: ", date, "fromTime: ", fromTime, "toTime", toTime,
        "numberOfParticipants", numberOfParticipants)
    let reqFromTime = moment(fromTime).get('hour') * 60 + moment(fromTime).get('minutes')
    let reqToTime = moment(toTime).format("hh") * 60 + moment(toTime).get('minutes')
    try {
        let sameTimeBooking = []
        let i = 0
        const rooms = await Room.find({ maxOfPeople: { $gte: numberOfParticipants } }).exec()
        rooms.sort((a, b) => (a.maxOfPeople < b.maxOfPeople ? -1 : 1))

        const bookingsFunc = async () => {
            return await Booking.find(
                { date: date },
                function (roomId) {
                    rooms.includes({ roomId })
                }
            ).clone().catch(function (err) { console.log(err) })
        }
        const bookings = await bookingsFunc()
        do {
            sameTimeBooking = bookings.filter((booking) =>
            (booking.endTime > reqFromTime && booking.startTime < reqToTime
                && rooms[i] == booking._ID))
            i++

        } while (sameTimeBooking.length != 0 && i < rooms.length)
        if (sameTimeBooking.length == 0) {
            console.log("bookingsvvvvvvvvvvvv", rooms[i - 1])
            return res.json(rooms[i - 1]);
        }

        //אם לא מצאנו חדר מתאים פנוי
        let options = []
        let numOfTrys = 1
        let optionFromTime = reqFromTime
        let optionToTime = reqToTime
        while (options.length < 3 && numOfTrys <= 16) {
            console.log("numOfTrys++", numOfTrys)
            console.log("options.length", options.length)
            if (numOfTrys % 2 == 0) {
                optionFromTime = optionFromTime + 15 * numOfTrys
                optionToTime = optionToTime + 15 * numOfTrys
            }
            else {
                optionFromTime = optionFromTime - 15 * numOfTrys
                optionToTime = optionToTime - 15 * numOfTrys
            }
            for (i = 0; i < rooms.length; i++) {
                sameTimeBooking = bookings.filter((booking) =>
                (booking.endTime > optionFromTime && booking.startTime < optionToTime
                    && rooms[i] == booking._ID))
                if (!sameTimeBooking) {
                    let roomFound = rooms[i]
                    options.push({ optionFromTime, optionToTime, date, roomFound })
                }
            }
            numOfTrys++
        }
        if (options.length == 0) {
            console.log("options[]")
            res.status(400).send("no alternatives options")
            return;
        }
        return options;

    } catch (error) {
        console.log("Error: ", error)
        res.status(500).send(error)
    }
})


router.post('/bookingOfUserRequest', async (req, res) => {
    console.log("I am trying the server")
    console.log(req.body.user)
    try {
        const bookingOfUser = await Booking.find({ owner: req.body.user })
        console.log("bookingOfUser",bookingOfUser)
        res.send(bookingOfUser);
        // console.log('res.body',res);
         return res
    }
    catch (err) {
         return res.status(500).send(" an error was  found while searching for booking ", err)
    }

})


module.exports = router