const mongoose = require("mongoose");
const { Schema } = mongoose;

const bookingSchema = new Schema({
  meetingDate: {
    type: String,
    // require:true
  },
  startTime: {
    type: Number,
    require: true,
  },
  endTime: {
    type: Number,
    require: true,
  },
  roomId: {
    type: mongoose.Types.ObjectId,
    ref: "room",
  },
  owner: {
    type: mongoose.Types.ObjectId,
    ref: "user",
  },
  logDate: {
    type: String,
    // require:true
  },
  PayMethod: {
    type: mongoose.Types.ObjectId,
    ref: "payMethod",
  },
  url: {
    type: String,
  },
  bookValue: {
    type: Number,
  },
  bookValue: {
    type: Number,
  },
  payedFrom: {
    purchased: { type: Number },
    monthly: { type: Number },
    creditCard: { type: Number },
  },
});
module.exports = mongoose.model("booking", bookingSchema);
