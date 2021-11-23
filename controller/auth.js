var express = require('express')
var router = express.Router()
const User = require('../model/user')
const Room = require('../model/room')
const Booking = require('../model/booking')
const phoneVerification = require('../model/phoneVerification')
const Subscribers = require('../model/subscribers')
const { verifyToken } = require('../middleware/verifyToken')
const jwt = require('jsonwebtoken')





router.post('/register', async (req, res) => {
    try {
        console.log("auth - register: body: req.body", { body: req.body })
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
        const existingEmail = await User.findOne({ email }).exec()
        if (existingEmail) {
            return res.status(400).send("User with this e-mail already exists")
        }
        console.log("creaeting user", req.body)
        const newUser = await User.create(req.body)
        //jwt - Json web token  מצפין האימייל בתוקן
        res.json({ token: jwt.sign({ phone }, process.env.SECRET, { expiresIn: "2h" }) })
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
        const { phone } = existingUser
        res.json({ token: jwt.sign({ phone }, process.env.SECRET, { expiresIn: "2h" }) })
    } catch (error) {
        console.log("Error: ", error)
        res.status(500).send(error)
    }
})

router.post('/loginOtp', async (req, res) => {
    console.log("loginOtp", req.body)
    try {
        const { phone, code } = req.body
        if (!verifyPhoneCode(phone, code)) {
            res.status(400).send("phone verification failed")
            return;
        }
        res.json({ token: jwt.sign({ phone }, process.env.SECRET, { expiresIn: "2h" }) })
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

router.post('/checkIfSubscriberRequest', verifyToken, async (req, res) => {

    const { bookingDetails } = req.body
    let subscriber = ""
    const userDetails = await User.find({ _id: req.user._id })
    if (userDetails)
        subscriber = await Subscribers.find({ phone: userDetails.phone })
    else
        return
    res.send("error. not found user", err)

    if (subscriber)
        return res.json(subscriber.coinsBalance)
    else
        return res.json(-1)

})

router.post('/IfSubscriberPay', verifyToken, async (req, res) => {
    const { bookingDetails } = req.body
    let subscriber = []
    console.log("IfSubscriberPay", bookingDetails)
    const { roomId } = bookingDetails
    const userDetails = await User.find({ _id: req.user._id })
    if (userDetails) {
        subscriber = await Subscribers.find({ phone: userDetails[0].phone })
    }
    else
        return res.send("error. not found user", err)
    if (subscriber.length != 0) {
        console.log("no", subscriber)
        const room = await Room.find({ _id: roomId })
        console.log("room", room)
        if (room)
            if (room[0].value <= subscriber[0].coinsBalance) {
                let coins = subscriber[0].coinsBalance - room[0].value
                await Subscribers.updateOne(
                    { _id: subscriber[0]._id },
                    {
                        $set: { "coinsBalance": coins }
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

function pad(num, size) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
}

//send password to phone
router.get('/sendVerification', async (req, res) => {
    console.log("auth - sendVerification: req.query", req.query)
    const { phone } = req.query
    //מגריל מספר כלשהו בין 0 ל1 ואז כשמכפילים אותו ב10000 זה מעביר 4 ספרות ללפני הנקודה ואח"כ מוחקים את הספרות שאחרי הנקודה
    let code = Math.floor((Math.random() * 10000)+1000)
   
    const message= code+ " הוא קוד האימות שלך. \nהקוד ישמש אותך בהמשך התהליך. בנימין טק."
    // "0528693039"
    Sms019.sendMessage(message,phone)
    // מוסיף את הפלאפון והסיסמה לטבלת פונ וריפיכישנ
    await phoneVerification.create({ phone, code })
    console.log("auth - sendVerification: add the code: ", code, "to database. with phone: ", phone)
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


const Sms019= {
   

    sendMessage: async (message, toNumber) => {

        let postBody = `
          <?xml version="1.0" encoding="UTF-8"?>
          <sms>
          <user>
          <username>חבלבנימין</username>
          <password>Binyamin1234</password>
          </user>
          <source>Clinic Team</source>
          <destinations>
          <phone>${toNumber}</phone>
      </destinations>
      <message>${message}</message>
          </sms>`;
    
        let config = {
          headers: { "Content-Type": "text/xml" },
        };
    
        return axios.post("https://www.019sms.co.il/api", postBody, config);
      },
    
      sendMessageDinamic: async (message, toNumber) => {
        let postBody = `
          <?xml version="1.0" encoding="UTF-8"?>
          <sms>
          <user>
          <username>חבלבנימין</username>
          <password>Binyamin1234</password>
          </user>
          <source>Clinic Team</source>
          <destinations>
          <phone>${toNumber}</phone>
          </destinations>
          <message>${message}</message>
          </sms>`;
    
        let config = {
          headers: { "Content-Type": "text/xml" },
        };
    
        return axios.post("https://www.019sms.co.il/api", postBody, config);
      },

}




module.exports = router