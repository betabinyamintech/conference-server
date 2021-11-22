var express = require('express')
var router = express.Router()

const axios = require("axios");

const Sms019 = {
   
//   sendMessage: async (message, toNumber) => {
    sendMessage: async () => {
    let postBody = `
      <?xml version="1.0" encoding="UTF-8"?>
      <sms>
      <user>
      <username>חבלבנימין</username>
      <password>Binyamin1234</password>
      </user>
      <source>Clinic Team</source>
      <destinations>
      <phone>0584619403</phone>
      </destinations>
      <message>היי</message>
      </sms>`;

    let config = {
      headers: { "Content-Type": "text/xml" },
    };

    return axios.post("https://www.019sms.co.il/api", postBody, config);
  },

  sendMessageDinamic: async () => {
    let postBody = `
      <?xml version="1.0" encoding="UTF-8"?>
      <sms>
      <user>
      <username>חבלבנימין</username>
      <password>Binyamin1234</password>
      </user>
      <source>Clinic Team</source>
      <destinations>
      <phone>0584619403</phone>
      </destinations>
      <message>היי</message>
      </sms>`;

    let config = {
      headers: { "Content-Type": "text/xml" },
    };

    return axios.post("https://www.019sms.co.il/api", postBody, config);
  },
};

export default Sms019;


// module.exports = router