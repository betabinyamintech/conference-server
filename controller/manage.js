var express = require("express");
var router = express.Router();
const User = require("../model/user");
const Room = require("../model/room");
const Booking = require("../model/booking");
const phoneVerification = require("../model/phoneVerification");
const Subscribers = require("../model/subscribers");
const { verifyToken } = require("../middleware/verifyToken");
const jwt = require("jsonwebtoken");
//////////////////////////////USERS//////////////////////
router.get("/getAllUsers", async (req, res) => {
  try {
    const users = await User.find({}).exec();
    return res.json(users);
  } catch (error) {
    console.log("Error: ", error);
    return res.status(500).send(error);
  }
});
router.put("/updateUser/:userId", async (req, res) => {
  console.log("params", req.params);
  console.log("asdasdxxxxxxxx");
  console.log("body", req.body);
  let { userId } = req.params;
  let updateDetails = req.body;
  let filter = { _id: userId };
  try {
    const user = await User.findOneAndUpdate(filter, updateDetails, {
      omitUndefined: true,
    }).exec();
    console.log("updated user: ", await User.findOne({ _id: userId }));
    return res.json(user);
  } catch (error) {
    console.log("Error: ", error);
    return res.status(500).send(error);
  }
});

//////////////////////////////ROOMS//////////////////////
router.get("/getMeetingRooms", async (req, res) => {
  console.log("getMeetingRooms", req.body);
  try {
    const rooms = await Room.find().sort({ maxOfPeople: 1 }).exec();
    console.log("manage - getMeetingRooms - rooms: ", rooms);
    return res.json({ rooms: rooms });
  } catch (error) {
    console.log("Error: ", error);
    return res.status(500).send(error);
  }
});

router.put("/updateRoom/:roomId", async (req, res) => {
  console.log("params", req.params);
  console.log("body", req.body);
  let { roomId } = req.params;
  let updateDetails = req.body;
  let filter = { _id: roomId };
  try {
    const room = await Room.findOneAndUpdate(filter, updateDetails, {
      omitUndefined: true,
    }).exec();
    console.log("updated room: ", await Room.findOne({ _id: roomId }));
    return res.json({ room });
  } catch (error) {
    console.log("Error: ", error);
    return res.status(500).send(error);
  }
});

module.exports = router;
