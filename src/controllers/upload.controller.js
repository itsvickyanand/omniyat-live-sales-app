const {
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
} = require("@azure/storage-blob");

const getUploadSasUrls = async (req, res) => {
  try {
    const { files } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "files array is required",
      });
    }

    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    const containerName = process.env.AZURE_CONTAINER_NAME;

    const sharedKeyCredential = new StorageSharedKeyCredential(
      accountName,
      accountKey
    );

    const data = files.map((f) => {
      const blobName = `products/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}-${f.fileName}`;

      const sas = generateBlobSASQueryParameters(
        {
          containerName,
          blobName,
          permissions: BlobSASPermissions.parse("cw"), // create + write
          expiresOn: new Date(Date.now() + 10 * 60 * 1000),
          contentType: f.fileType,
        },
        sharedKeyCredential
      ).toString();

      const uploadUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}?${sas}`;
      const fileUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}`;

      return { uploadUrl, fileUrl };
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate SAS URLs",
      error: err.message,
    });
  }
};

const getDeleteSasUrl = async (req, res) => {
  try {
    const { fileUrl } = req.body;

    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        message: "fileUrl is required",
      });
    }

    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    const containerName = process.env.AZURE_CONTAINER_NAME;

    const sharedKeyCredential = new StorageSharedKeyCredential(
      accountName,
      accountKey
    );

    // ✅ Extract blobName from URL
    // fileUrl format:
    // https://<account>.blob.core.windows.net/<container>/<blobName>
    const parts = fileUrl.split(`${containerName}/`);
    const blobName = parts[1];

    if (!blobName) {
      return res.status(400).json({
        success: false,
        message: "Invalid fileUrl",
      });
    }

    const sas = generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse("d"), // ✅ delete permission
        expiresOn: new Date(Date.now() + 10 * 60 * 1000),
      },
      sharedKeyCredential
    ).toString();

    const deleteUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}?${sas}`;

    return res.status(200).json({
      success: true,
      deleteUrl,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate delete SAS URL",
      error: err.message,
    });
  }
};

module.exports = { getUploadSasUrls, getDeleteSasUrl };
