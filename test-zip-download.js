const { google } = require("googleapis");
require("dotenv").config();

const drive = google.drive({
  version: "v3",
  auth: process.env.GOOGLE_DRIVE_API_KEY,
});

async function testDownloadZip() {
  const id = "13LUWQJEzSVkO0kL7XrG2CoPMd1JO_Ghj";
  try {
    const res = await drive.files.get(
      { fileId: id, alt: "media", acknowledgeAbuse: true },
      { responseType: "stream" }
    );
    console.log("Success! Status:", res.status);
  } catch (e) {
    console.error("Error Status:", e.code);
    console.error("Error Message:", e.message);
    if (e.response && e.response.data) {
       console.error("Data:");
       e.response.data.on('data', chunk => console.error(chunk.toString()));
    }
  }
}

testDownloadZip();
