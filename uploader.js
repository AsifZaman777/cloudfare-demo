import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

// Initialize S3 Client for R2
const s3 = new S3Client({
  region: "auto",
  endpoint: "https://039efa49062abc578c0096b2c923c46b.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "0607965b5c23d9ea662f18d883ca2f76",
    secretAccessKey: "5a68f22e2d75af0bbe165919497e5f7066a36547dcbf33979de55adb56ca672a",
  },
});

// UI Elements
const uploadBtn = document.getElementById("uploadBtn");
const listBtn = document.getElementById("listBtn");
const fileInput = document.getElementById("fileInput");
const uploadStatus = document.getElementById("uploadStatus");
const imageList = document.getElementById("imageList");
const directoryInput = document.getElementById("directory");
const bucketInput = document.getElementById("bucket");

// --- UPLOAD FUNCTION ---
async function uploadFile() {
  const file = fileInput.files[0];
  if (!file) {
    alert("Please select a file first!");
    return;
  }

  const directory = directoryInput.value || "testground/";
  const bucket = bucketInput.value || "homaree";
  const key = directory + file.name;

  if (uploadStatus) uploadStatus.innerText = "Uploading...";
  if (uploadBtn) uploadBtn.disabled = true;

  try {
    // Convert file to Uint8Array for maximum compatibility with SDK in browser
    const arrayBuffer = await file.arrayBuffer();
    const body = new Uint8Array(arrayBuffer);

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: file.type,
      })
    );
    if (uploadStatus) uploadStatus.innerText = `Successfully uploaded: ${key}`;
    listImages(); // Refresh the list
  } catch (error) {
    console.error("Upload Error:", error);
    if (uploadStatus) uploadStatus.innerText = "Upload failed: " + error.message;
  } finally {
    if (uploadBtn) uploadBtn.disabled = false;
  }
}

// --- LIST & READ FUNCTION ---
async function listImages() {
  const directory = directoryInput.value || "testground/";
  const bucket = bucketInput.value || "homaree";

  if (imageList) imageList.innerHTML = "Loading...";

  try {
    const listRes = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: directory,
      })
    );

    if (!listRes.Contents || listRes.Contents.length === 0) {
      if (imageList) imageList.innerHTML = "No images found in this directory.";
      return;
    }

    if (imageList) imageList.innerHTML = "";
    const ul = document.createElement("ul");

    for (const item of listRes.Contents) {
      // Skip directory placeholders
      if (item.Key === directory || item.Key.endsWith('/')) continue;

      const li = document.createElement("li");
      li.innerHTML = `<strong>${item.Key}</strong> (${(item.Size / 1024).toFixed(2)} KB)<br>`;
      
      const imgPlaceholder = document.createElement("div");
      imgPlaceholder.innerText = "Fetching image...";
      li.appendChild(imgPlaceholder);
      ul.appendChild(li);

      // Read the image content
      try {
        const getObjRes = await s3.send(new GetObjectCommand({
          Bucket: bucket,
          Key: item.Key
        }));
        
        // Use transformToByteArray instead of transformToWeb to avoid stream errors
        const byteArray = await getObjRes.Body.transformToByteArray();
        const blob = new Blob([byteArray], { type: getObjRes.ContentType });
        const objectUrl = URL.createObjectURL(blob);
        
        const img = document.createElement("img");
        img.src = objectUrl;
        img.style.maxWidth = "200px";
        img.style.display = "block";
        img.style.marginTop = "5px";
        imgPlaceholder.replaceWith(img);
      } catch (err) {
        console.error("Error reading image:", err);
        imgPlaceholder.innerText = "Error loading image: " + err.message;
      }
    }

    if (imageList) imageList.appendChild(ul);
  } catch (error) {
    console.error("List Error:", error);
    if (imageList) imageList.innerHTML = "Failed to list images: " + error.message;
  }
}

// Event Listeners
if (uploadBtn) uploadBtn.onclick = uploadFile;
if (listBtn) listBtn.onclick = listImages;

// Run initial list if we are in the browser
if (typeof document !== 'undefined') {
  listImages();
}