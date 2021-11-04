var express = require('express')
var router = express.Router()
const User = require('../model/user')
const jwt = require('jsonwebtoken')


router.post('/register', async (req, res) => {
    try {
        console.log(req.body)
        const { email, password } = req.body

        if (email == null || password == null) {
            console.log("error")
            res.status(400).send("Missing data")
            return res;
        }
        if (password.length < 6 || email.length < 6 || email.indexOf('@') == -1 || email.indexOf('.') == -1) {
            console.log("error")
            res.status(400).send("Password is less than 8 characters")
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

module.exports = router