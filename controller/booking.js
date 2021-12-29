var express = require('express')
var router = express.Router()
const User = require('../model/user')
const Booking = require('../model/booking')
const Room = require('../model/room')
var moment = require('moment'); // require
const { verifyToken } = require('../middleware/verifyToken')
var nodemailer = require('nodemailer');


// router.post('/login', async (req, res) => {
//     console.log("login", req.body)
//     try {
//         const { email, password } = req.body
//         const existingUser = await User.findOne({ email, password }).exec()
//         if (!existingUser) {
//             res.status(400).send("User or Password Invalid")
//             return;
//         }

//         res.json({ token: jwt.sign({ email }, process.env.SECRET, { expiresIn: "2h" }) })

//     } catch (error) {
//         console.log("Error: ", error)
//         res.status(500).send(error)
//     }
// })

router.post('/getAvailableBookings', async (req, res) => {
    const { meetingDate, fromTime, toTime, numberOfParticipants } = req.body
    try {
        let fromTimeMoment = moment(meetingDate +"T"+ fromTime)
        let toTimeMoment = moment(meetingDate +"T"+ toTime)
        let beforeAfterHours = 2
        let i = 0
        const rooms = await Room.find({ maxOfPeople: { $gte: numberOfParticipants } })
            .sort({ maxOfPeople: 1 }).exec()
        console.log("date ", meetingDate)
        const bookings = await Booking.find({
            meetingDate: meetingDate,
            fromTime: {
                $lte: toTimeMoment.clone().add(beforeAfterHours, 'h').unix(),
            },
            toTime: {
                $gte: fromTimeMoment.clone().subtract(beforeAfterHours, 'h').unix(),
            },
             roomId: { $in: rooms.map((room) => room._id)}
        }).exec();
        console.log("bookings ",bookings)
        let numOfTrys = 0
        let options = []

        const available = (option) =>
            bookings.find((booking) => (
                booking.endTime > option.startTime && booking.startTime < option.endTime
                && option.roomId == booking.roomId.toString()
            )) == null

        for (i = 0; i < rooms.length; i++) {
            
            while (options.length < 3 && numOfTrys <= beforeAfterHours * (60 / 15) * 2) {
                const direction = numOfTrys % 2 ? 1 : -1
                const option = {
                    roomDetails: rooms[i],
                    roomId: rooms[i]._id,
                    meetingDate: meetingDate,
                    startTime: fromTimeMoment.clone().add(15 * direction * numOfTrys, 'm').unix(),
                    endTime: toTimeMoment.clone().add(15 * direction * numOfTrys, 'm').unix()
                }
                
                if (available(option)) {
                    console.log("options: "+option," i: "+i+ " numOfTrys: "+numOfTrys)
                    if (i == 0 && numOfTrys == 0) {
                        console.log("return")
                        return res.json({ exact: option })
                    }
                    options.push(option)
                }
                
                numOfTrys++
            }
        }

        // if (options.length == 0) {
        //     res.status(400).send("no alternatives options")
        //     return;
        // }
 
        console.log("options: "+options, " numOfTrys: "+numOfTrys)
        return res.json({ alternatives: options });  
    } catch (error) {
        res.status(500).send(error)
    }
})

router.post('/bookingcommitRequest', verifyToken, async (req, res) => {
    const bookingDetails = req.body
    const {meetingDate, url, startTime, endTime, roomId}=bookingDetails
    let stringDate = moment(meetingDate, 'YYYYMMDD').format('l')
    let day = moment(meetingDate, 'YYYYMMDD').format('dddd')
    let fromTime=moment.unix(startTime).format('HHmm')
    let toTime=moment.unix(endTime).format('HHmm')
    let toTimeString=toTime.slice(0, 2) + ":" + toTime.slice(2);
    let fromTimeString=fromTime.slice(0, 2) + ":" + fromTime.slice(2);
    let room= await Room.find({_id:roomId}).populate('name').exec()
    console.log("room",room)
    var os=require('os')
    console.log( "yes i am the user",req.user)
    console.log(bookingDetails)
    try {
        await Booking.create({...bookingDetails, owner: req.user._id, logDate:moment()})
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'binyamintech7@gmail.com',
              pass: process.env.EMAIL_PASSWORD
            }
          });
          
          var mailOptions = {
            from: 'binyamintech7@gmail.com',
            to: req.user.email,
            subject: '!נקבעה לך פגישה בבנימין טק',
            text: 'היי '+ req.user.name + os.EOL+' שריינו לך פגישה ביום '+stringDate+','+day+ os.EOL+' בין השעות: '+fromTimeString+'-'+toTimeString+os.EOL+' בחדר '+room[0].name+os.EOL+'מתרגשים להיפגש!'+os.EOL+os.EOL+"מצורף קישור ליומן גוגל"+os.EOL+ url
          };
          
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log("problem in sending mail ",error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });
        return res.json(bookingDetails.url)
    } catch (err) {
            res.send(" an error was  found while creating the booking", err)
    }
})

router.get('/user',verifyToken, async (req, res) => {
    console.log("I am trying the server")
    console.log("user fromToken:",req.user)
    try {
        const bookingOfUser = await Booking.find({ owner: req.user._id })
        console.log("bookingOfUser", bookingOfUser)
        res.send(bookingOfUser);
        // console.log('res.body',res);
        return res
    }
    catch (err) {
        return res.status(500).send(" an error was  found while searching for booking ", err)
    }

})

router.get('/rooms',verifyToken, async (req, res) => {
    console.log("I am trying rooms")
    console.log("user fromToken:",req.user)
    try {
        const rooms = await rooms.find({})
        console.log("rooms", rooms)
        res.send(rooms);
        // console.log('res.body',res);
        return res
    }
    catch (err) {
        return res.status(500).send(" an error was  found while searching for rooms ", err)
    }

})
module.exports = router




