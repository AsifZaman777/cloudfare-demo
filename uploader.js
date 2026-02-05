import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

// Import image transformation utilities
import {
  applyTransformations,
  formatFileSize,
  calculateSizeReduction,
  TransformationPresets,
} from "./imageTransformer.js";

// Initialize S3 Client for R2
const s3 = new S3Client({
  region: "auto",
  endpoint: "https://039efa49062abc578c0096b2c923c46b.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "0607965b5c23d9ea662f18d883ca2f76",
    secretAccessKey:
      "5a68f22e2d75af0bbe165919497e5f7066a36547dcbf33979de55adb56ca672a",
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
const originalSizeEl = document.getElementById("originalSize");
const transformedSizeEl = document.getElementById("transformedSize");
const sizeReductionEl = document.getElementById("sizeReduction");

// --- UPLOAD FUNCTION ---
async function uploadFile() {
  const file = fileInput.files[0];
  if (!file) {
    alert("Please select a file first!");
    return;
  }

  const directory = directoryInput.value || "testground/";
  const bucket = bucketInput.value || "homaree";
  const originalName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
  const key = directory + originalName + "_transformed.jpg";

  if (uploadStatus) uploadStatus.innerText = "Applying transformations...";
  if (uploadBtn) uploadBtn.disabled = true;

  try {
    // Get original file size
    const originalSize = file.size;
    if (originalSizeEl) originalSizeEl.innerText = formatFileSize(originalSize);

    // Apply transformation algorithm
    if (uploadStatus)
      uploadStatus.innerText =
        "Transforming image (width: 1000px, quality: 35%)...";
    const transformedBlob = await applyTransformations(
      file,
      TransformationPresets.MEDIUM_QUALITY,
    );
    const transformedSize = transformedBlob.size;

    // Display size information
    if (transformedSizeEl)
      transformedSizeEl.innerText = formatFileSize(transformedSize);
    const reduction = calculateSizeReduction(originalSize, transformedSize);
    if (sizeReductionEl) {
      sizeReductionEl.innerText = `${reduction}% smaller`;
      sizeReductionEl.style.color = reduction > 0 ? "green" : "red";
    }

    if (uploadStatus)
      uploadStatus.innerText = `Uploading transformed image (${formatFileSize(transformedSize)})...`;

    // Convert blob to Uint8Array for maximum compatibility with SDK in browser
    const arrayBuffer = await transformedBlob.arrayBuffer();
    const body = new Uint8Array(arrayBuffer);

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: "image/jpeg",
      }),
    );
    if (uploadStatus) {
      uploadStatus.innerText = `✓ Successfully uploaded: ${key}\nOriginal: ${formatFileSize(originalSize)} → Transformed: ${formatFileSize(transformedSize)} (${reduction}% reduction)`;
      uploadStatus.style.color = "green";
    }
    listImages(); // Refresh the list
  } catch (error) {
    console.error("Upload Error:", error);
    if (uploadStatus) {
      uploadStatus.innerText = "Upload failed: " + error.message;
      uploadStatus.style.color = "red";
    }
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
      }),
    );

    if (!listRes.Contents || listRes.Contents.length === 0) {
      if (imageList) imageList.innerHTML = "No images found in this directory.";
      return;
    }

    if (imageList) imageList.innerHTML = "";
    const ul = document.createElement("ul");

    for (const item of listRes.Contents) {
      // Skip directory placeholders
      if (item.Key === directory || item.Key.endsWith("/")) continue;

      const li = document.createElement("li");
      li.innerHTML = `<strong>${item.Key}</strong> (${(item.Size / 1024).toFixed(2)} KB)<br>`;

      const imgPlaceholder = document.createElement("div");
      imgPlaceholder.innerText = "Fetching image...";
      li.appendChild(imgPlaceholder);
      ul.appendChild(li);

      // Read the image content
      try {
        const getObjRes = await s3.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: item.Key,
          }),
        );

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
    if (imageList)
      imageList.innerHTML = "Failed to list images: " + error.message;
  }
}

// Event Listeners
if (uploadBtn) uploadBtn.onclick = uploadFile;
if (listBtn) listBtn.onclick = listImages;

// Run initial list if we are in the browser
if (typeof document !== "undefined") {
  listImages();
}
