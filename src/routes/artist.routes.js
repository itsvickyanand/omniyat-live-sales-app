const express = require("express");

const {
  createArtist,
  getAllArtists,
  getArtistById,
  updateArtist,
  deleteArtist,
} = require("../controllers/artist.controller");

const router = express.Router();

/*
Create Artist
POST /api/artist
*/
router.post("/", createArtist);

/*
Get All Artists
GET /api/artist
*/
router.get("/", getAllArtists);

/*
Get Artist by ID
GET /api/artist/:id
*/
router.get("/:id", getArtistById);

/*
Update Artist
PUT /api/artist/:id
*/
router.put("/:id", updateArtist);

/*
Delete Artist
DELETE /api/artist/:id
*/
router.delete("/:id", deleteArtist);

module.exports = router;
