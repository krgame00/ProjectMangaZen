import fetch from "node-fetch";

async function testDownload() {
  const fileId = "1xsWyXWvS866KFFbdjjze0rV_p6dYc5tX";
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}&acknowledgeAbuse=true`;
  console.log("Fetching", url);
  const res = await fetch(url);
  console.log("Status:", res.status);
  if (!res.ok) {
    console.log("Error:", await res.text());
  } else {
    console.log("Success! Headers:", res.headers.raw());
  }
}
testDownload();
