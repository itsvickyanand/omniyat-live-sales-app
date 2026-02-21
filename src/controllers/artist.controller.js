const {
  createArtistService,
  getAllArtistsService,
  getArtistByIdService,
  updateArtistService,
  deleteArtistService,
} = require("../services/artist.service");

/*
    Create Artist
    POST /api/artist
    */
const createArtist = async (req, res) => {
  try {
    const result = await createArtistService(req.body);

    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("Create Artist Controller Error:", err);

    return res.status(500).json({
      ok: false,
      message: "Internal server error",
    });
  }
};

/*
    Get All Artists
    GET /api/artist
    */
const getAllArtists = async (req, res) => {
  try {
    const result = await getAllArtistsService();

    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("Get Artists Controller Error:", err);

    return res.status(500).json({
      ok: false,
      message: "Internal server error",
    });
  }
};

/*
    Get Artist by ID
    GET /api/artist/:id
    */
const getArtistById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await getArtistByIdService(id);

    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("Get Artist Controller Error:", err);

    return res.status(500).json({
      ok: false,
      message: "Internal server error",
    });
  }
};

/*
    Update Artist
    PUT /api/artist/:id
    */
const updateArtist = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await updateArtistService(id, req.body);

    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("Update Artist Controller Error:", err);

    return res.status(500).json({
      ok: false,
      message: "Internal server error",
    });
  }
};

/*
    Delete Artist
    DELETE /api/artist/:id
    */
const deleteArtist = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await deleteArtistService(id);

    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("Delete Artist Controller Error:", err);

    return res.status(500).json({
      ok: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createArtist,
  getAllArtists,
  getArtistById,
  updateArtist,
  deleteArtist,
};
