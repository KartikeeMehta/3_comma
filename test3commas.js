const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();

const APIKEY = process.env.THREE_COMMA_API_KEY;
const APISECRET = process.env.THREE_COMMA_API_SECRET;

const path = "/public/api/ver1/accounts";
const url = "https://api.3commas.io" + path;

const signature = crypto
  .createHmac("sha256", APISECRET)
  .update(path)
  .digest("hex");

axios
  .get(url, {
    headers: {
      APIKEY: APIKEY,
      Signature: signature,
    },
  })
  .then((res) => {
    console.log(res.data);
  })
  .catch((err) => {
    console.error(err.response ? err.response.data : err.message);
  });
