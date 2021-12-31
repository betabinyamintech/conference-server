var express = require("express");
var router = express.Router();
const User = require("../model/user");
const Booking = require("../model/booking");
const phoneVerification = require("../model/phoneVerification");
const Subscribers = require("../model/subscribers");
const { verifyToken } = require("../middleware/verifyToken");
const jwt = require("jsonwebtoken");
const axios = require("axios");
var nodemailer = require("nodemailer");
var os = require("os");
const bcrypt = require('bcrypt');

router.post("/register", async (req, res) => {
    //שיניתי את הפונקציה הזו לבדוק עם סינון לא של נטפרי!!
    console.log("in server register")
    const { name, phone, email, password, code } = req.body;
    let newUserToSave
    const last_phoneVerification = await phoneVerification
        .findOne({ phone })
        .sort({ timestamp: "descending" });
    if (!last_phoneVerification || last_phoneVerification.code != code)
        return res.status(400).json({ errorText: "אימות טלפון נכשל" });
    // return res.status(400).json({ text: "phone verification failed" });


    else {
        //  delete all phoneVerification with the same phone
        phoneVerification
            .deleteMany({ phone })
            .then(function () {
                console.log(
                    "auth - verifyPhoneCode delete all the same phone succed"
                ); // Success
            })
            .catch(function (error) {
                console.log(
                    "auth - verifyPhoneCode delete all the same phone faile. error:",
                    error
                ); // Failure
            });
    }
    const existingUserByPhone = await User.findOne({ phone }).exec();
    const existingUserByEmail = await User.findOne({ email }).exec();
    if (existingUserByPhone && existingUserByPhone.isRegistered)
        //Check if user registered (subscribed and not subscribed)
        return res.status(400).json({ errorText: "מספר טלפון זה קיים במערכת" });

    if (existingUserByEmail && existingUserByPhone.isRegistered) {
        return res.status(400).json({ errorText: " כתובת מייל זו קיימת במערכת " });
    }
    console.log("creating user", req.body)
    bcrypt.hash(password, 10, (error, hash) => {
        if (error)
            return res.status(500).json({
                error: error
            })
        newUserToSave =
        {
            name: name,
            password: hush,
            email: email,
            phone: phone,
            isRegistered: true
        };
    })
    const newUser = await User.create(newUserToSave);
    return res.json({
        token: jwt.sign({ phone }, process.env.SECRET, { expiresIn: "2h" }),
    });
});

router.post("/login", async (req, res) => {
    // try {
    //     const { email, password } = req.body;
    //     //שיניתי השוואה למוצפן
    //     // let hush = bcrypt.hash(password, 10)
    //     // const existingUser = await User.findOne({ email, hush }).exec();
    //     const existingUser = await User.findOne({ email }).exec();
    //     console.log("existingUser", existingUser);
    //     if (!existingUser)
    //         return res.status(400).send("User or Password Invalid");
    //     if (!existingUser.isRegistered && existingUser.isSubscribed) {
    //         console.log("status 455");
    //         res.status(455).send("Subscribed but not registered -should sign up ");
    //         return;
    //     }
    //     const { phone } = existingUser;
    //     res.json({
    //         token: jwt.sign({ phone }, process.env.SECRET, { expiresIn: "2h" }),
    //     });
    // } catch (error) {
    //     console.log("Error: ", error);
    //     res.status(500).send(error);
    // }

    User.find({ email }).then((users) => {

        if (users.length === 0) {
            return res.status(401).json({
                message: 'אימות נכשל'
            });
        }

        const [user] = users;

        bcrypt.compare(password, user.password, (error, result) => {
            if (error) {
                return res.status(401).json({
                    message: 'אימות נכשל'
                });
            }

            if (result) {
                if (!user.isRegistered &&
                    user.isSubscribed)
                    return res.status(455).json({
                        message: "ברכות! זוהית כמנוי,אנא הירשם תחילה "
                    });
                const [phone] = user
                return res.status(200).json({
                    token: jwt.sign({
                        phone
                    },
                        process.env.SECRET,
                        {
                            expiresIn: "2h"
                        })
                })
            }

            res.status(401).json({
                message: 'Auth failed'
            });
        })
    })
});

router.get("/user", verifyToken, async (req, res) => {
    const subscriber = await Subscribers.findOne({
        phone: req.user.phone,
    }).exec();
    console.log("subscriber", subscriber);
    const subscription = subscriber ? { balance: subscriber.coinsBalance } : null;
    const userDetails = { ...req.user, subscription: subscription };
    console.log("userDetails", userDetails);
    return res.json(userDetails);
});

router.post("/bookingOfUserRequest", async (req, res) => {
    //   console.log("I am trying the server");
    console.log(req.body.user);
    try {
        const bookingOfUser = await Booking.find({ owner: req.body.user });
        console.log("bookingOfUser", bookingOfUser);
        res.send(bookingOfUser);
        // console.log('res.body',res);
        return res;
    } catch (err) {
        return res
            .status(500)
            .send(" an error was  found while searching for booking ", err);
    }
});

router.post("/IfSubscriberPay", verifyToken, async (req, res) => {
    const { bookingDetails } = req.body;
    let subscriber = [];
    let updateSubscriber;
    const userDetails = await User.find({ _id: req.user._id });
    console.log("userDetails", userDetails);
    if (userDetails) {
        subscriber = await Subscribers.find({ phone: userDetails[0].phone });
    } else return res.send("error. not found user", err);
    if (subscriber.length != 0) {
        console.log("no", subscriber);
        if (bookingDetails.bookValue <= subscriber[0].coinsBalance) {
            let coins = subscriber[0].coinsBalance - bookingDetails.bookValue;
            updateSubscriber = await Subscribers.findOneAndUpdate(
                { _id: subscriber[0]._id },
                {
                    $set: { coinsBalance: coins },
                },
                {
                    new: true,
                }
            );
            console.log("updateSubscriber", updateSubscriber);
        } else return res.json("-1");
        return res.json(updateSubscriber);
    } else {
        console.log("yes");
        return res.json("-1");
    }
});

function pad(num, size) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
}

//send password to phone
router.get("/sendVerification", async (req, res) => {
    const { phone } = req.query;
    //מגריל מספר כלשהו בין 0 ל1 ואז כשמכפילים אותו ב10000 זה מעביר 4 ספרות ללפני הנקודה ואח"כ מוחקים את הספרות שאחרי הנקודה
    let code = Math.floor(Math.random() * 9000 + 1000);
    const message =
        code + " הוא קוד האימות שלך. \nהקוד ישמש אותך בהמשך התהליך. בנימין טק.";
    Sms019.sendMessage(message, phone);
    await phoneVerification.create({ phone, code });
    console.log(
        "auth - sendVerification: add the code: ",
        code,
        "to database. with phone: ",
        phone
    );
    return res.json();
});
// compares client code to phoneVerification code
router.post("/verifyPhoneCode", async (req, res) => {
    try {
        const { phone, code } = req.body;
        const last_phoneVerification = await phoneVerification
            .findOne({ phone })
            .sort({ timestamp: "descending" });
        if (
            last_phoneVerification != null &&
            last_phoneVerification.code === code
        ) {
            //  delete all phoneVerification with the same phone
            phoneVerification
                .deleteMany({ phone })
                .then(function () {
                    console.log(
                        "auth - verifyPhoneCode delete all the same phone succed"
                    ); // Success
                })
                .catch(function (error) {
                    console.log(
                        "auth - verifyPhoneCode delete all the same phone faile. error:",
                        error
                    ); // Failure
                });
            const userFromDB = await User.find({ phone }).exec();
            let userDetails = userFromDB[0];
            console.log("userDetails", userDetails);
            if (userDetails.isRegistered) {
                console.log("registered");
                return res.json({
                    token: jwt.sign({ phone }, process.env.SECRET, { expiresIn: "2h" }),
                });
            } else if (userDetails.isSubscribed) {
                console.log("registered but not subscribed");
                return res
                    .status(455)
                    .send("Subscribed- should register for the first time");
            }
        } else
            return res.status(402).send({ message: "phone verification failed" });
    } catch (error) {
        console.log("Error: ", error);
        res.status(500).send(error);
    }
});

const Sms019 = {
    sendMessage: async (message, toNumber) => {
        let postBody = `
          <?xml version="1.0" encoding="UTF-8"?>
          <sms>
          <user>
          <username>חבלבנימין</username>
          <password>Binyamin1234</password>
          </user>
          <source>B-Tech</source>
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
          <source>BinyaminTech</source>
          <destinations>
          <phone>${toNumber}</phone>
          </destinations>
          <message>${message}</message>
          </sms>`;

        let config = {
            headers: { "Content-Type": "text/xml" },
        };

    }
}
router.post('/resetPass', async (req, res) => {
    const email = req.body.email
    console.log("email", email)
    let userExist = await User.find({ email: email })
    if (userExist.length < 1) {
        console.log("userExist", userExist)
        return res.status(400).send("user is not exist")
    }
    console.log("userExist", userExist)
    let randomPassword = Math.random().toString(36).slice(-8);
    console.log('randomPassword', randomPassword)
    let newUser = await User.findByIdAndUpdate(userExist[0]._id, { password: randomPassword }, { new: true })
    console.log("newUser", newUser)
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "binyamintech7@gmail.com",
            pass: "bootcamp123",
        },
    });

    var mailOptions = {
        from: "binyamintech7@gmail.com",
        to: userExist[0].email,
        subject: "שכחת סיסמא?",
        text:
            "לא נורא " +
            "," +
            os.EOL +
            " זה קורה לטובים ביותר " +
            "!" +
            os.EOL +
            "מצורפת הסיסמא החדשה שלך " +
            " :" +
            randomPassword +
            os.EOL +
            "מחכים לך" +
            os.EOL +
            "צוות בנימיןטק"

    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log("problem in sending mail ", error);
        } else {
            console.log("Email sent: " + info.response);
        }
    });
    return res;


})

module.exports = router;
