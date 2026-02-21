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

// const fetchSingleOrderFromCCA = async (orderNo, reqId = "N/A") => {
//   try {
//     console.log(`[${reqId}] 📡 Fetching from CCAvenue →`, orderNo);

//     const payloadString =
//       `|` +
//       `${orderNo}|` +
//       `|` +
//       `|` +
//       `|` +
//       `|` +
//       `|` +
//       `|` +
//       `|` +
//       `|` +
//       `|` +
//       `|` +
//       `|` +
//       `|` +
//       `|` +
//       `1|`;

//     console.log(`[${reqId}] 📄 Payload STRING:`, payloadString);

//     const encRequest = encrypt(payloadString, process.env.CCAV_WORKING_KEY);

//     console.log(`[${reqId}] 🔐 Encrypted request generated`);

//     const body = {
//       enc_request: encRequest,
//       access_code: process.env.CCAV_ACCESS_CODE,
//       command: "orderLookup",
//       request_type: "STRING",
//       response_type: "JSON",
//       version: "1.1",
//     };

//     console.log(`[${reqId}] 📤 Sending request to CCA...`);

//     const response = await axios.post(CCAV_STATUS_URL, qs.stringify(body), {
//       headers: {
//         "Content-Type": "application/x-www-form-urlencoded",
//       },
//       timeout: 15000,
//     });

//     console.log(`[${reqId}] 📥 Raw response:`, response.data);

//     const parsed = qs.parse(response.data);

//     if (parsed.status !== "0") {
//       console.log(`[${reqId}] ❌ CCA returned error`);
//       throw new Error(parsed.enc_response || "CCAvenue error");
//     }

//     const decrypted = decrypt(
//       parsed.enc_response,
//       process.env.CCAV_WORKING_KEY
//     );

//     console.log(`[${reqId}] 🔓 Decrypted response:`, decrypted);

//     const jsonData = JSON.parse(decrypted);

//     console.log(
//       `[${reqId}] 📊 Records returned:`,
//       jsonData.records?.length || 0
//     );

//     return jsonData.records?.[0] || null;
//   } catch (err) {
//     console.error(`[${reqId}] 🔴 Service Error →`, err.message);
//     throw err;
//   }
// };
const fetchSingleOrderFromCCA = async (
  orderNo,
  orderCreatedAt,
  reqId = "N/A"
) => {
  try {
    console.log(`[${reqId}] 📡 Fetching from CCAvenue →`, orderNo);

    // const formatDate = (date) => {
    //   const d = new Date(date);
    //   const day = String(d.getDate()).padStart(2, "0");
    //   const month = String(d.getMonth() + 1).padStart(2, "0");
    //   const year = d.getFullYear();
    //   return `${day}-${month}-${year}`;
    // };

    // const fromDate = formatDate(orderCreatedAt);
    // const toDate = formatDate(new Date());

    const formatDate = (date) => {
      const d = new Date(date);

      const day = String(d.getUTCDate()).padStart(2, "0");
      const month = String(d.getUTCMonth() + 1).padStart(2, "0");
      const year = d.getUTCFullYear();

      return `${day}-${month}-${year}`;
    };

    // 🔥 Create safe date window
    const created = new Date(orderCreatedAt);

    // Subtract 1 day for timezone + gateway batch safety
    created.setUTCDate(created.getUTCDate() - 1);

    const fromDate = formatDate(created);
    const toDate = formatDate(new Date());

    console.log(`[${reqId}] 📅 Using SAFE date range: ${fromDate} → ${toDate}`);

    // console.log(`[${reqId}] 📅 Using date range:`, fromDate, "→", toDate);

    const payloadString =
      `|` + // reference_no
      `${orderNo}|` + // order_no
      `${fromDate}|` + // from_date (REQUIRED)
      `${toDate}|` + // to_date (REQUIRED)
      `|` + // order_status
      `|` + // order_bill_tel
      `|` + // order_country
      `|` + // order_email
      `|` + // order_fraud_status
      `|` + // order_max_amount
      `|` + // order_min_amount
      `|` + // order_name
      `|` + // order_payment_type
      `|` + // order_type
      `|` + // order_currency
      `1|`; // page

    console.log(`[${reqId}] 📄 Payload STRING:`, payloadString);

    const encRequest = encrypt(payloadString, process.env.CCAV_WORKING_KEY);

    const body = {
      enc_request: encRequest,
      access_code: process.env.CCAV_ACCESS_CODE,
      command: "orderLookup",
      request_type: "STRING",
      response_type: "JSON",
      version: "1.1",
    };

    const response = await axios.post(CCAV_STATUS_URL, qs.stringify(body), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 15000,
    });

    console.log(`[${reqId}] 📥 Raw response:`, response.data);

    const parsed = qs.parse(response.data);

    if (parsed.status !== "0") {
      throw new Error("CCAvenue error");
    }

    const decrypted = decrypt(
      parsed.enc_response,
      process.env.CCAV_WORKING_KEY
    );

    console.log(`[${reqId}] 🔓 Decrypted response:`, decrypted);

    const jsonData = JSON.parse(decrypted);

    return jsonData.order_Status_List?.[0] || null;
  } catch (err) {
    console.error(`[${reqId}] 🔴 Service Error →`, err.message);
    throw err;
  }
};

module.exports = {
  fetchCcavenueTransactions,
  fetchSingleOrderFromCCA,
};
