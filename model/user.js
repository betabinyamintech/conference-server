const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    require: true,
  },
  password: {
    type: String,
    require: true,
  },
  email: {
    type: String,
    require: true,
  },
  phone: {
    type: String,
    require: true,
  },
  isAdmin: {
    type: Boolean,
  },
  registerDate: {
    type: String,
  },
  createdDate: {
    type: String,
    require: true,
  },
  isSubscribed: {
    type: Boolean,
  },
  isRegistered: {
    type: Boolean,
  },
  monthlyCoins: {
    type: Number,
  },
  purchasedCoins: {
    type: Number,
  },
});
module.exports = mongoose.model("user", userSchema);
