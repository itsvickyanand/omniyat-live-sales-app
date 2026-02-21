// const axios = require("axios");
// const qs = require("querystring");
// const { encrypt, decrypt } = require("../utils/ccavenue");

// const CCA_URL = "https://login.ccavenue.ae/apis/servlet/DoWebTrans";

// const fetchPaymentHistory = async ({ fromDate, toDate, status, page = 1 }) => {
//   try {
//     /*
//     1️⃣ Build payload (BEFORE encryption)
//     */
//     // const payload = {
//     //   from_date: fromDate, // DD-MM-YYYY
//     //   to_date: toDate, // DD-MM-YYYY
//     //   order_status: status || "",
//     //   page_number: page,
//     // };

//     /*
//     2️⃣ Encrypt request
//     */
//     // const encRequest = encrypt(
//     //   qs.stringify(payload),
//     //   process.env.CCAV_WORKING_KEY
//     // );

//     /*
// Build STRING format manually (STRICT ORDER as per CCAvenue doc)
// */

//     const payloadString =
//       `|` + // reference_no
//       `|` + // order_no
//       `${fromDate}|` + // from_date
//       `${toDate}|` + // to_date
//       `${status || ""}|` + // order_status
//       `|` + // order_bill_tel
//       `|` + // order_country
//       `|` + // order_email
//       `|` + // order_fraud_status
//       `|` + // order_max_amount
//       `|` + // order_min_amount
//       `|` + // order_name
//       `|` + // order_payment_type
//       `|` + // order_type
//       `|` + // order_currency
//       `${page || 1}|`; // page_number (IMPORTANT: must end with |)

//     const encRequest = encrypt(payloadString, process.env.CCAV_WORKING_KEY);

//     /*
//     3️⃣ Build API body
//     */
//     const body = {
//       enc_request: encRequest,
//       access_code: process.env.CCAV_ACCESS_CODE,
//       command: "orderLookup",
//       request_type: "STRING",
//       response_type: "STRING",
//       version: "1.1",
//     };

//     /*
//     4️⃣ Call CCAvenue
//     */
//     const response = await axios.post(CCA_URL, qs.stringify(body), {
//       headers: {
//         "Content-Type": "application/x-www-form-urlencoded",
//       },
//       timeout: 15000,
//     });

//     const parsed = qs.parse(response.data);

//     /*
//     5️⃣ Handle API error
//     */
//     if (parsed.status !== "0") {
//       throw new Error(parsed.enc_response || "CCAvenue error");
//     }

//     /*
//     6️⃣ Decrypt response
//     */
//     const decrypted = decrypt(
//       parsed.enc_response,
//       process.env.CCAV_WORKING_KEY
//     );

//     const finalData = qs.parse(decrypted);

//     return finalData;
//   } catch (err) {
//     console.error("CCAvenue Lookup Error:", err.message);
//     throw err;
//   }
// };

// module.exports = {
//   fetchPaymentHistory,
// };

const axios = require("axios");
const qs = require("querystring");
const { encrypt, decrypt } = require("../utils/ccavenue");

const CCA_URL = "https://login.ccavenue.ae/apis/servlet/DoWebTrans";

// const fetchPaymentHistory = async ({ fromDate, toDate, status, page = 1 }) => {
//   try {
//     /*
//     1️⃣ Build STRING payload (STRICT ORDER required by CCAvenue)
//     */

//     const payloadString =
//       `|` + // reference_no
//       `|` + // order_no
//       `${fromDate}|` + // from_date
//       `${toDate}|` + // to_date
//       `${status || ""}|` + // order_status
//       `|` + // order_bill_tel
//       `|` + // order_country
//       `|` + // order_email
//       `|` + // order_fraud_status
//       `|` + // order_max_amount
//       `|` + // order_min_amount
//       `|` + // order_name
//       `|` + // order_payment_type
//       `|` + // order_type
//       `|` + // order_currency
//       `${page || 1}|`; // page_number (MUST end with |)

//     const encRequest = encrypt(payloadString, process.env.CCAV_WORKING_KEY);

//     /*
//     2️⃣ Build API body
//     */

//     const body = {
//       enc_request: encRequest,
//       access_code: process.env.CCAV_ACCESS_CODE,
//       command: "orderLookup",
//       request_type: "STRING",
//       response_type: "STRING",
//       version: "1.1",
//     };

//     /*
//     3️⃣ Call CCAvenue
//     */

//     const response = await axios.post(CCA_URL, qs.stringify(body), {
//       headers: {
//         "Content-Type": "application/x-www-form-urlencoded",
//       },
//       timeout: 15000,
//     });

//     const parsed = qs.parse(response.data);

//     /*
//     4️⃣ Handle API-level error
//     */

//     if (parsed.status !== "0") {
//       throw new Error(parsed.enc_response || "CCAvenue error");
//     }

//     /*
//     5️⃣ Decrypt response
//     */

//     const decrypted = decrypt(
//       parsed.enc_response,
//       process.env.CCAV_WORKING_KEY
//     );

//     /*
//     Expected format:
//     totalRecords|pageCount|record1^record2^record3
//     */

//     const firstPipe = decrypted.indexOf("|");
//     const secondPipe = decrypted.indexOf("|", firstPipe + 1);

//     if (firstPipe === -1 || secondPipe === -1) {
//       throw new Error("Unexpected CCAvenue response format");
//     }

//     const totalRecords = decrypted.substring(0, firstPipe);
//     const pageCount = decrypted.substring(firstPipe + 1, secondPipe);

//     // Everything after second pipe is records block
//     const recordsBlock = decrypted.substring(secondPipe + 1);

//     const recordsRaw = recordsBlock.split("^").filter((r) => r.trim() !== "");

//     // const records = recordsRaw.map((record) => {
//     //   const fields = record.split("$");

//     //   return {
//     //     reference_no: fields[0] || null,
//     //     order_no: fields[1] || null,
//     //     amount: fields[2] || null,
//     //     status: fields[3] || null,
//     //     bank_ref_no: fields[4] || null,
//     //     bank_response: fields[5] || null,
//     //     payment_method: fields[6] || null,
//     //     currency: fields[7] || null,
//     //     date_time: fields[8] || null,
//     //     billing_name: fields[13] || null,
//     //     billing_city: fields[15] || null,
//     //     billing_country: fields[17] || null,
//     //     billing_tel: fields[19] || null,
//     //     billing_email: fields[20] || null,
//     //   };
//     // });
//     const records = recordsRaw.map((record) => {
//       const f = record.split("$");

//       return {
//         reference_no: f[0] || null,
//         order_no: f[1] || null,
//         order_amount: f[2] || null,
//         order_status: f[3] || null,
//         bank_ref_no: f[4] || null,
//         bank_response: f[5] || null,
//         payment_mode: f[6] || null,
//         currency: f[7] || null,
//         trans_date: f[8] || null,

//         merchant_param1: f[9] || null,
//         merchant_param2: f[10] || null,
//         merchant_param3: f[11] || null,

//         customer_ip: f[12] || null,

//         billing_name: f[13] || null,
//         billing_address: f[14] || null,
//         billing_city: f[15] || null,
//         billing_state: f[16] || null,
//         billing_country: f[17] || null,
//         billing_zip: f[18] || null,
//         billing_tel: f[19] || null,
//         billing_email: f[20] || null,

//         delivery_name: f[21] || null,
//         delivery_address: f[22] || null,
//         delivery_city: f[23] || null,
//         delivery_state: f[24] || null,
//         delivery_country: f[25] || null,
//         delivery_zip: f[26] || null,
//         delivery_tel: f[27] || null,

//         merchant_param4: f[28] || null,
//         merchant_param5: f[29] || null,

//         vault: f[30] || null,
//         offer_type: f[31] || null,
//         offer_code: f[32] || null,

//         discount_value: f[33] || null,
//         tax: f[34] || null,
//         service_charge: f[35] || null,
//         convenience_fee: f[36] || null,

//         emi_tenure: f[37] || null,
//         emi_interest: f[38] || null,
//         emi_amount: f[39] || null,
//       };
//     });
//     return {
//       totalRecords: Number(totalRecords),
//       pageCount: Number(pageCount),
//       records,
//     };
//   } catch (err) {
//     console.error("CCAvenue Lookup Error:", err.message);
//     throw err;
//   }
// };

// const fetchPaymentHistory = async ({ fromDate, toDate, status, page = 1 }) => {
//   try {
//     const payloadString =
//       `|` +
//       `|` +
//       `${fromDate}|` +
//       `${toDate}|` +
//       `${status || ""}|` +
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
//       `${page}|`;

//     const encRequest = encrypt(payloadString, process.env.CCAV_WORKING_KEY);

//     const body = {
//       enc_request: encRequest,
//       access_code: process.env.CCAV_ACCESS_CODE,
//       command: "orderLookup",
//       request_type: "STRING",
//       response_type: "STRING",
//       version: "1.1",
//     };

//     const response = await axios.post(CCA_URL, qs.stringify(body), {
//       headers: {
//         "Content-Type": "application/x-www-form-urlencoded",
//       },
//     });

//     const parsed = qs.parse(response.data);

//     if (parsed.status !== "0") {
//       throw new Error(parsed.enc_response || "CCAvenue error");
//     }

//     const decrypted = decrypt(
//       parsed.enc_response,
//       process.env.CCAV_WORKING_KEY
//     );

//     // Split header
//     const firstPipe = decrypted.indexOf("|");
//     const secondPipe = decrypted.indexOf("|", firstPipe + 1);

//     const totalRecords = decrypted.substring(0, firstPipe);
//     const pageCount = decrypted.substring(firstPipe + 1, secondPipe);

//     const recordsBlock = decrypted.substring(secondPipe + 1);

//     const recordsRaw = recordsBlock.split("^").filter(Boolean);

//     const records = recordsRaw.map((record) => {
//       const f = record.split("$");

//       console.log(firstPipe);

//       return {
//         reference_no: f[0] || null,
//         order_no: f[1] || null,
//         order_amount: f[2] || null,
//         order_status: f[3] || null,
//         bank_ref_no: f[4] || null,
//         bank_response: f[5] || null,
//         payment_mode: f[6] || null,
//         currency: f[7] || null,
//         trans_date: f[8] || null,
//         merchant_param1: f[9] || null,
//         merchant_param2: f[10] || null,
//         merchant_param3: f[11] || null,
//         customer_ip: f[12] || null,
//         billing_name: f[13] || null,
//         billing_address: f[14] || null,
//         billing_city: f[15] || null,
//         billing_state: f[16] || null,
//         billing_country: f[17] || null,
//         billing_zip: f[18] || null,
//         billing_tel: f[19] || null,
//         billing_email: f[20] || null,
//       };
//     });

//     return {
//       totalRecords: Number(totalRecords),
//       pageCount: Number(pageCount),
//       records,
//     };
//   } catch (err) {
//     console.error("CCAvenue Lookup Error:", err.message);
//     throw err;
//   }
// };

const fetchPaymentHistory = async ({
  fromDate,
  toDate,
  status = "",
  page = 1,
}) => {
  try {
    /*
    🔥 Always send full day time range
    */
    const from = `${fromDate} 00:00:00`;
    const to = `${toDate} 23:59:59`;

    /*
    STRING FORMAT EXACTLY AS DOC (Page 39)
    */
    const payloadString =
      `|` + // reference_no
      `|` + // order_no
      `${from}|` + // from_date
      `${to}|` + // to_date
      `${status}|` + // order_status
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
      `${page}|`; // page_number

    const encRequest = encrypt(payloadString, process.env.CCAV_WORKING_KEY);

    const body = {
      enc_request: encRequest,
      access_code: process.env.CCAV_ACCESS_CODE,
      command: "orderLookup",
      request_type: "STRING",
      response_type: "JSON", // keep JSON (better)
      version: "1.1",
    };

    const response = await axios.post(CCA_URL, qs.stringify(body), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 20000,
    });

    const parsed = qs.parse(response.data);

    if (parsed.status !== "0") {
      throw new Error(parsed.enc_response);
    }

    const decrypted = decrypt(
      parsed.enc_response,
      process.env.CCAV_WORKING_KEY
    );

    const json = JSON.parse(decrypted);

    return {
      totalRecords: Number(json.total_records || 0),
      pageCount: Number(json.page_count || 0),
      records: json.order_Status_List || [],
      raw: json,
    };
  } catch (err) {
    console.error("CCAvenue Lookup Error:", err.message);
    throw err;
  }
};

module.exports = {
  fetchPaymentHistory,
};

module.exports = {
  fetchPaymentHistory,
};

module.exports = {
  fetchPaymentHistory,
};

module.exports = {
  fetchPaymentHistory,
};
