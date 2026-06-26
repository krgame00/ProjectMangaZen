require('dotenv/config');
const { google } = require('googleapis');

const drive = google.drive({
  version: 'v3',
  auth: process.env.GOOGLE_DRIVE_API_KEY,
});

async function testDownload() {
  try {
    const res = await drive.files.get(
      { fileId: '1QCx8JNiVG8CDHtaobv9P6law-ew6Jbiz', alt: 'media', acknowledgeAbuse: true },
      { responseType: 'stream' }
    );
    console.log("Download succeeded!");
  } catch (err) {
    console.error("Download failed:", err.message.substring(0, 200));
  }
}

testDownload();
