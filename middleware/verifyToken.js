const jwt = require('jsonwebtoken')
const User = require('../model/user')

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
        console.log('auth error', error)
        res.status(403).send("token invalid or expired")
    }
    // hide the password
}

module.exports = {verifyToken}
