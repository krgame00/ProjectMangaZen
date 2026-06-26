const { google } = require("googleapis");
require("dotenv").config();

const drive = google.drive({
  version: "v3",
  auth: process.env.GOOGLE_DRIVE_API_KEY,
});

async function testThumbnail() {
  const id = "13LUWQJEzSVkO0kL7XrG2CoPMd1JO_Ghj"; // The failing ZIP id from the logs
  try {
    const res = await drive.files.get({
      fileId: id,
      fields: "mimeType,thumbnailLink,hasThumbnail",
    });
    console.log(res.data);
  } catch (e) {
    console.error("Error:", e.message);
  }
}

testThumbnail();
