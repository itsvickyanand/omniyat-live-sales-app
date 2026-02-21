// const { fetchPaymentHistory } = require("../services/ccavenueLookup.service");
const { fetchPaymentHistory } = require("../services/ccavenueLookup.service");

const getPaymentHistory = async (req, res) => {
  try {
    const { fromDate, toDate, status, page } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        message: "fromDate and toDate are required (DD-MM-YYYY)",
      });
    }

    const data = await fetchPaymentHistory({
      fromDate,
      toDate,
      status,
      page: page ? Number(page) : 1,
    });

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch payment history",
    });
  }
};

module.exports = {
  getPaymentHistory,
};
