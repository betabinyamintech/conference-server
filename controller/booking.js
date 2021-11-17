var express = require('express')
var router = express.Router()
const booking = require('../model/booking')
const { create } = require('../model/booking')
const Room = require('../model/room')
var moment = require('moment'); // require
const { verifyToken } = require('../middleware/verifyToken')


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

router.post('/getAvailableBookings', async (req, res) => {
    const { date, fromTime, toTime, numberOfParticipants } = req.body
    try {

        let fromTimeMoment = moment(date + fromTime)
        let toTimeMoment = moment(date + toTime)
        let beforeAfterHours = 2
        let i = 0
        const rooms = await Room.find({ maxOfPeople: { $gte: numberOfParticipants } })
            .sort({ maxOfPeople: 1 }).exec()
        const bookings = await Booking.find({
            meetingDate: date,
            fromTime: {
                $lte: toTimeMoment.clone().add(beforeAfterHours, 'h').unix(),
            },
            toTime: {
                $gte: fromTimeMoment.clone().subtract(beforeAfterHours, 'h').unix(),
            },
            roomId: { $in: rooms.map((room) => room._id)}
        }).exec();

        let numOfTrys = 0
        let optionFromTime = reqFromTime
        let optionToTime = reqToTime
        let options = []
        console.log("FromTime", optionFromTime, "ToTime", optionToTime)

        const available = (option) =>
            bookings.find((booking) => (
                booking.endTime > option.startTime && booking.startTime < option.endTime
                && option.roomId == booking.roomId.toString()
            )) == null

        for (i = 0; i < rooms.length; i++) {
            while (options.length < 3 && numOfTrys <= beforeAfterHours * (60 / 15) * 2) {
                const direction = numOfTrys % 2 ? 1 : -1
                const option = {
                    roomDetails: room[i],
                    roomId: rooms[i]._id,
                    date,
                    startTime: fromTimeMoment.clone().add(15 * direction * numOfTrys, 'm').unix(),
                    endTime: endTimeMoment.clone().add(15 * direction * numOFTrys, 'm').unix()
                }
                if (available(option)) {
                    if (i == 0 && numOfTrys == 0) {
                        return res.json({ exact: option })
                    }
                    options.push(option)
                }
                
                numOfTrys++
            }
        }

        if (options.length == 0) {
            res.status(400).send("no alternatives options")
            return;
        }
 
         
        return res.json({ alternatives: options });  
    } catch (error) {
        res.status(500).send(error)
    }
})

router.post('/bookingcommitRequest', verifyToken, async (req, res) => {
    const bookingDetails = req.body
    try {
        await Booking.create({...bookingDetails, owner: req.user._id})
        res.json("booking created")
    } catch (err) {
            res.send(" an error was  found while creating the booking", err)
    }
})

module.exports = router




