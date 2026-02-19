const { Artist, sequelize } = require("../models");

/*
Create Artist
*/
const createArtistService = async (payload) => {
  try {
    const { name, image, description } = payload;

    let imageUrl = image;
    if (!name || !name.trim()) {
      return {
        ok: false,
        statusCode: 400,
        message: "Artist name is required",
      };
    }

    const artist = await Artist.create({
      name: name.trim(),
      imageUrl: imageUrl || null,
      description: description || null,
    });

    return {
      ok: true,
      statusCode: 201,
      message: "Artist created successfully",
      data: artist,
    };
  } catch (err) {
    return {
      ok: false,
      statusCode: 500,
      message: "Failed to create artist",
      error: err.message,
    };
  }
};

/*
Get all Artists
*/
const getAllArtistsService = async () => {
  try {
    const artists = await Artist.findAll({
      order: [["createdAt", "DESC"]],
    });

    return {
      ok: true,
      statusCode: 200,
      data: artists,
    };
  } catch (err) {
    return {
      ok: false,
      statusCode: 500,
      message: "Failed to fetch artists",
      error: err.message,
    };
  }
};

/*
Get Artist by ID
*/
const getArtistByIdService = async (artistId) => {
  try {
    const artist = await Artist.findByPk(artistId);

    if (!artist) {
      return {
        ok: false,
        statusCode: 404,
        message: "Artist not found",
      };
    }

    return {
      ok: true,
      statusCode: 200,
      data: artist,
    };
  } catch (err) {
    return {
      ok: false,
      statusCode: 500,
      message: "Failed to fetch artist",
      error: err.message,
    };
  }
};

/*
Update Artist
*/
const updateArtistService = async (artistId, payload) => {
  try {
    const artist = await Artist.findByPk(artistId);

    if (!artist) {
      return {
        ok: false,
        statusCode: 404,
        message: "Artist not found",
      };
    }

    await artist.update({
      name: payload.name ?? artist.name,
      imageUrl: payload.imageUrl ?? artist.imageUrl,
      description: payload.description ?? artist.description,
    });

    return {
      ok: true,
      statusCode: 200,
      message: "Artist updated successfully",
      data: artist,
    };
  } catch (err) {
    return {
      ok: false,
      statusCode: 500,
      message: "Failed to update artist",
      error: err.message,
    };
  }
};

/*
Delete Artist (RESTRICT safe delete)
*/
const deleteArtistService = async (artistId) => {
  const transaction = await sequelize.transaction();

  try {
    const artist = await Artist.findByPk(artistId, {
      transaction,
    });

    if (!artist) {
      await transaction.rollback();

      return {
        ok: false,
        statusCode: 404,
        message: "Artist not found",
      };
    }

    await artist.destroy({ transaction });

    await transaction.commit();

    return {
      ok: true,
      statusCode: 200,
      message: "Artist deleted successfully",
    };
  } catch (err) {
    await transaction.rollback();

    if (err.name === "SequelizeForeignKeyConstraintError") {
      return {
        ok: false,
        statusCode: 400,
        message: "Cannot delete artist with existing products",
      };
    }

    return {
      ok: false,
      statusCode: 500,
      message: "Failed to delete artist",
      error: err.message,
    };
  }
};

module.exports = {
  createArtistService,
  getAllArtistsService,
  getArtistByIdService,
  updateArtistService,
  deleteArtistService,
};
