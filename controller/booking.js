var express = require('express')
var router = express.Router()

router.post('/requestRoom', async (req, res) => {
    const { date, fromTime, toTime, numberOfParticipants } = req.body
})


module.exports = router