const { google } = require('googleapis');
const unzipper = require('unzipper');
require('dotenv').config();

const drive = google.drive({
  version: 'v3',
  auth: process.env.GOOGLE_DRIVE_API_KEY,
});

async function extractZipCover(fileId) {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await drive.files.get(
        { fileId: fileId, alt: 'media' },
        { responseType: 'stream' }
      );

      const stream = res.data;
      let found = false;

      stream.pipe(unzipper.Parse())
        .on('entry', async (entry) => {
          if (found) {
            entry.autodrain();
            return;
          }

          if (entry.type === 'File' && entry.path.match(/\.(jpe?g|png|webp|gif)$/i)) {
            found = true;
            console.log("Found cover image:", entry.path);
            const chunks = [];
            entry.on('data', chunk => chunks.push(chunk));
            entry.on('end', () => {
              const buffer = Buffer.concat(chunks);
              console.log("Extracted buffer size:", buffer.length);
              
              // Destroy stream to abort download
              stream.destroy();
              resolve(buffer);
            });
          } else {
            entry.autodrain();
          }
        })
        .on('error', (err) => {
          if (!found) reject(err);
        })
        .on('close', () => {
          if (!found) reject(new Error("No image found in zip"));
        });
    } catch (e) {
      reject(e);
    }
  });
}

// Just pass a known ZIP file ID. Let's find one first if needed.
async function main() {
  const res = await drive.files.list({
    q: "mimeType='application/zip' and trashed=false",
    fields: "files(id, name)"
  });
  if (res.data.files && res.data.files.length > 0) {
     const fileId = res.data.files[0].id;
     console.log("Testing zip:", res.data.files[0].name);
     const buffer = await extractZipCover(fileId);
     console.log("Success! Image size:", buffer.length);
  } else {
     console.log("No ZIP file found.");
  }
}

main().catch(console.error);
