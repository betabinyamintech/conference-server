var express = require('express')
var router = express.Router()

router.post('/bookingRequestToServer', async (req, res) => {
    const { date, fromTime, toTime, numberOfParticipants } = req.body
    try {
        const findRoom = await Room
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