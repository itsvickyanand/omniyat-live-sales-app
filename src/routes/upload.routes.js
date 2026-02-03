const express = require("express");
const { getUploadSasUrls } = require("../controllers/upload.controller");
const { getDeleteSasUrl } = require("../controllers/upload.controller");

const router = express.Router();

router.post("/sas", getUploadSasUrls);
router.post("/delete-sas", getDeleteSasUrl);

module.exports = router;
