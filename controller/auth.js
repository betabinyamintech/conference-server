var express = require('express')
var router = express.Router()
const User = require('../model/user')
const Room = require('../model/room')
const Booking = require('../model/booking')
const Subscribers = require('../model/subscribers')
const { verifyToken } = require('../middleware/verifyToken')
const jwt = require('jsonwebtoken')



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




router.post('/bookingOfUserRequest', async (req, res) => {
    console.log("I am trying the server")
    console.log(req.body.user)
    try {
        const bookingOfUser = await Booking.find({ owner: req.body.user })
        console.log("bookingOfUser", bookingOfUser)
        res.send(bookingOfUser);
        // console.log('res.body',res);
        return res
    }
    catch (err) {
        return res.status(500).send(" an error was  found while searching for booking ", err)
    }

})



router.post('/checkIfSubscriberRequest', async (req, res) => {

    const { bookingDetails } = req.body
    const { owner } = bookingDetails
    let subscriber = ""
    const userDetails = await User.find({ _id: owner })
    if (userDetails)
        subscriber = await Subscribers.find({ phone: userDetails.phone })
    else
        return res.send("error. not found user", err)

    if (subscriber)

        return res.json(subscriber)
    else
        return res.json(-1)

})

router.post('/IfSubscriberPay', async (req, res) => {
    const { bookingDetails } = req.body
    console.log("IfSubscriberPay", bookingDetails)
    const { owner, roomId } = bookingDetails
    let subscriber = ""
    const userDetails = await User.find({ _id: owner })

    if (userDetails) {
        subscriber = await Subscribers.find({ phone: userDetails[0].phone })
        console.log(subscriber)
    }
    else
        return res.send("error. not found user", err)

    if (subscriber.length != 0) {
        console.log("no", subscriber)
        const room = await Room.find({ _id: roomId })
        console.log("room", room)
        if (room)
            if (room[0].value <= subscriber[0].coinsBlance) {
                let coins = subscriber[0].coinsBlance - room[0].value
                await Subscribers.updateOne(
                    { _id: subscriber[0]._id },
                    {
                        $set: { "coinsBlance": coins }
                    }
                )
            }
            else
                return res.json("-1")
        else
            return res.send("error. not found user", err)

        return res.json(subscriber)
    }
    else {
        console.log("yes")
        return res.json("-1")
    }

})

module.exports = router