const fetch = require('node-fetch');

async function testDownload() {
  try {
    const url = 'https://drive.google.com/uc?export=download&id=1QCx8JNiVG8CDHtaobv9P6law-ew6Jbiz';
    const res = await fetch(url);
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response starts with:", text.substring(0, 100));
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

testDownload();
