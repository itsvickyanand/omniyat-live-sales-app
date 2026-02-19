const qs = require("querystring");
const axios = require("axios");

const { encrypt, decrypt } = require("../utils/ccavenue");

const CCAV_ACCESS_CODE = process.env.CCAV_ACCESS_CODE;
const CCAV_WORKING_KEY = process.env.CCAV_WORKING_KEY;
const CCAV_MERCHANT_ID = process.env.CCAV_MERCHANT_ID;

const CCAV_STATUS_URL = "https://login.ccavenue.ae/apis/servlet/DoWebTrans";

const checkCcavenueStatus = async (order) => {
  try {
    if (!order.gatewayOrderId) {
      throw new Error("gatewayOrderId missing");
    }

    console.log("Checking CCAvenue status for:", order.gatewayOrderId);

    /*
    UAE REQUIRES JSON STRING INSIDE ENCRYPTION
    */
    const plainObject = {
      merchant_id: CCAV_MERCHANT_ID,
      order_id: order.gatewayOrderId,
    };

    const plain = JSON.stringify(plainObject);

    console.log("Plain JSON:", plain);

    const encRequest = encrypt(plain, CCAV_WORKING_KEY);

    const requestBody = qs.stringify({
      enc_request: encRequest,
      access_code: CCAV_ACCESS_CODE,
      command: "orderStatusTracker",
      request_type: "JSON",
      response_type: "JSON",
      version: "1.2",
    });

    const response = await axios.post(CCAV_STATUS_URL, requestBody, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 20000,
    });

    console.log("Raw response:", response.data);

    const parsed = qs.parse(response.data);

    if (parsed.status !== "0") {
      console.log("CCAvenue error:", parsed);
      return null;
    }

    /*
    Decrypt JSON response
    */
    const decrypted = decrypt(parsed.enc_response, CCAV_WORKING_KEY);

    console.log("Decrypted JSON:", decrypted);

    const finalParsed = JSON.parse(decrypted);

    return finalParsed;
  } catch (error) {
    console.error("CCAvenue status check error:", error.message);
    return null;
  }
};

module.exports = {
  checkCcavenueStatus,
};
