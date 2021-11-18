var express = require('express')
var router = express.Router()
const User = require('../model/user')
const jwt = require('jsonwebtoken')
const Room = require('../model/room')
const Booking = require('../model/booking')
const phoneVerification = require('../model/phoneVerification')


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
//לאחר מספר דקות שהקוד אינו בתוקף יש למחוק אותו מהדתה בייס
router.post('/register', async (req, res) => {
    try {
        console.log({ body: req.body })
        const { phone, email, password, code } = req.body

        if (!verifyPhoneCode(phone, code)) {
            res.status(400).send("phone verification failed")
        }

        if (email == null || password == null) {
            res.status(400).send("email or password missing")
            return res;
        }
        const minChars = 3
        if (password.length < minChars) {
            res.status(400).send(`Password is less than ${minChars} characters`)
            return res;
        }

        const existingPhone = await User.findOne({ phone }).exec()
        if (existingPhone) {
            res.status(400).send("User with this phone Already Exists")
            return res;
        }

        if (await User.findOne({ email}).exec()) {
            return res.status(400).send("User with this e-mail already exists")
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

function pad(num, size) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
}

//send password to phone
router.get('/sendVerification', async (req, res) => {
    console.log("quuery", req.query)
    const { phone } = req.query
    //מגריל מספר כלשהו בין 0 ל1 ואז כשמכפילים אותו ב10000 זה מעביר 4 ספרות ללפני הנקודה ואח"כ מוחקים את הספרות שאחרי הנקודה
    let code = Math.floor(Math.random() * 10000)

    // מוסיף את הפלאפון והסיסמה לטבלת פונ וריפיכישנ
    await phoneVerification.create({ phone, code })
    console.log("add the code :", code, "to database. with phone: ", phone)
    //צריך לעשות פונקציה ששולחת לפאלפון את הסיסמה
    //יש לעשות בדיקה האם זה אכן הצליח לשלוח
    return res.json()
})

// מקבל סיסמה ופלאפון ובודק אם היא זהה לזו ששלח באס אמ אס
async function verifyPhoneCode(phone, code) {
    console.log("auth - verifyCode get the phone: ", phone, " & code: ", code)

    const last_phoneVerification = await phoneVerification.findOne({ phone }).sort({ timestamp: 'descending' })
    console.log("the last_phoneVerification is :", last_phoneVerification)
    if (last_phoneVerification != null && last_phoneVerification.code == code) {
        //  מוחק את כל הסיסמאות ששמורות עם הפאלפון הזה
        phoneVerification.deleteMany({ phone }).then(function () {
            console.log("auth - sendVerification delete all the same phone succed"); // Success
        }).catch(function (error) {
            console.log("auth - sendVerification delete all the same phone faile. error:", error); // Failure
        });

        return true
    }

    //לאחר שהסיסמאות זהות יכול למחוק את כל הסיסמאות מהדתא בייס ששיכות לפאלפון הזה בלבד
    return false

}

module.exports = router