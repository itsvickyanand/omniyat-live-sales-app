const qs = require("querystring");
const axios = require("axios");

const { encrypt, decrypt } = require("../utils/ccavenue");

const CCAV_ACCESS_CODE = process.env.CCAV_ACCESS_CODE;
const CCAV_WORKING_KEY = process.env.CCAV_WORKING_KEY;
const CCAV_MERCHANT_ID = process.env.CCAV_MERCHANT_ID;

const CCAV_STATUS_URL = "https://login.ccavenue.ae/apis/servlet/DoWebTrans";

/*
===========================================================
FETCH TRANSACTIONS BETWEEN DATE RANGE
UAE VERSION (CORRECT FORMAT)
===========================================================
*/

const fetchCcavenueTransactions = async (fromDate, toDate) => {
  const formatDateForCCAvenue = (dateStr) => {
    // If already in DD-MM-YYYY, return as is
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      return dateStr;
    }

    // If YYYY-MM-DD convert to DD-MM-YYYY
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split("-");
      return `${day}-${month}-${year}`;
    }

    throw new Error("Invalid date format. Use YYYY-MM-DD or DD-MM-YYYY");
  };

  try {
    if (!fromDate || !toDate) {
      throw new Error("fromDate and toDate required");
    }

    console.log("Fetching CCAvenue transactions");
    console.log("From:", fromDate);
    console.log("To:", toDate);

    /*
    CRITICAL: UAE requires JSON STRING encrypted
    */
    const plainJSON = JSON.stringify({
      merchant_id: CCAV_MERCHANT_ID,
      from_date: formatDateForCCAvenue(fromDate),
      to_date: formatDateForCCAvenue(toDate),
    });

    console.log("Plain JSON:", plainJSON);

    /*
    Encrypt
    */
    const encRequest = encrypt(plainJSON, CCAV_WORKING_KEY);

    /*
    Build request body
    */
    const requestBody = qs.stringify({
      enc_request: encRequest,
      access_code: CCAV_ACCESS_CODE,
      command: "orderStatusTracker",
      request_type: "JSON",
      response_type: "JSON",
      version: "1.2",
    });

    /*
    Call CCAvenue
    */
    const response = await axios.post(CCAV_STATUS_URL, requestBody, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 20000,
    });

    console.log("Raw response:", response.data);

    /*
    Parse
    */
    const parsed = qs.parse(response.data);

    if (parsed.status !== "0") {
      console.log("CCAvenue returned error:", parsed);
      return parsed;
    }

    /*
    Decrypt response
    */
    const decrypted = decrypt(parsed.enc_response, CCAV_WORKING_KEY);

    console.log("Decrypted:", decrypted);

    /*
    Parse JSON result
    */
    const result = JSON.parse(decrypted);

    return result;
  } catch (error) {
    console.error("CCAvenue fetch transactions error:", error.message);
    return null;
  }
};

module.exports = {
  fetchCcavenueTransactions,
};
