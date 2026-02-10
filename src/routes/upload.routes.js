const express = require("express");
const { getUploadSasUrls } = require("../controllers/upload.controller");
const { getDeleteSasUrl } = require("../controllers/upload.controller");
const protectAdmin = require("../middlewares/protectAdmin");

const router = express.Router();

router.post("/sas", protectAdmin, getUploadSasUrls);
router.post("/delete-sas", protectAdmin, getDeleteSasUrl);

module.exports = router;
