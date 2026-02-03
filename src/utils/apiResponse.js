const sendResponse = (
  res,
  statusCode,
  success,
  message,
  data = null,
  error = null
) => {
  return res.status(statusCode).json({
    success,
    statusCode,
    message,
    data,
    error,
  });
};

module.exports = { sendResponse };
