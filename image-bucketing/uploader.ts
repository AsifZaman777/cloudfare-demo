import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

// import helper functions
import { applyTransformations } from "./imageTransformer";
import { TransformationPresets } from "./transformationPreset";
import { formatFileSize, calculateSizeReduction } from "./imageSize";

// initialize s3 client
const s3 = new S3Client({
  region: "auto",
  endpoint: import.meta.env.APP_R2_S3_API,
  credentials: {
    accessKeyId: import.meta.env.APP_R2_ACCESS_ID,
    secretAccessKey: import.meta.env.APP_R2_SECRET_KEY,
  },
});

// UI Elements
const uploadBtn = document.getElementById("uploadBtn") as HTMLButtonElement | null;
const listBtn = document.getElementById("listBtn") as HTMLButtonElement | null;
const fileInput = document.getElementById("fileInput") as HTMLInputElement | null;
const uploadStatus = document.getElementById("uploadStatus") as HTMLDivElement | null;
const imageList = document.getElementById("imageList") as HTMLDivElement | null;
const directoryInput = document.getElementById("directory") as HTMLInputElement | null;
const bucketInput = document.getElementById("bucket") as HTMLInputElement | null;
const originalSizeEl = document.getElementById("originalSize") as HTMLSpanElement | null;
const transformedSizeEl = document.getElementById("transformedSize") as HTMLSpanElement | null;
const sizeReductionEl = document.getElementById("sizeReduction") as HTMLSpanElement | null;

//#region upload bucket
//upload to r2 bucket
async function uploadFile() {
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    alert("Please select a file first!");
    return;
  }

  const file = fileInput.files[0];
  const directory = directoryInput?.value || "testground/";
  const bucket = bucketInput?.value || "homaree";
  const originalName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
  const key = directory + originalName + "_transformed.gif";

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
    ) as Blob;
    const transformedSize = transformedBlob.size;

    // Display size information
    if (transformedSizeEl)
      transformedSizeEl.innerText = formatFileSize(transformedSize);
    
    const reduction = calculateSizeReduction(originalSize, transformedSize);
    if (sizeReductionEl) {
      sizeReductionEl.innerText = `${reduction}% smaller`;
      sizeReductionEl.style.color = parseFloat(reduction) > 0 ? "green" : "red";
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
  } catch (error: any) {
    console.error("Upload Error:", error);
    if (uploadStatus) {
      uploadStatus.innerText = "Upload failed: " + (error?.message || "Unknown error");
      uploadStatus.style.color = "red";
    }
  } finally {
    if (uploadBtn) uploadBtn.disabled = false;
  }
}

//#region list images
// read the images from r2 bucket
async function listImages() {
  const directory = directoryInput?.value || "testground/";
  const bucket = bucketInput?.value || "homaree";

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
      if (!item.Key) continue;
      // Skip directory placeholders
      if (item.Key === directory || item.Key.endsWith("/")) continue;

      const li = document.createElement("li");
      const sizeStr = item.Size ? (item.Size / 1024).toFixed(2) : "0.00";
      li.innerHTML = `<strong>${item.Key}</strong> (${sizeStr} KB)<br>`;

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

        if (!getObjRes.Body) {
          throw new Error("Empty body received");
        }

        // Use transformToByteArray instead of transformToWeb to avoid stream errors
        const byteArray = await (getObjRes.Body as any).transformToByteArray();
        const blob = new Blob([byteArray], { type: getObjRes.ContentType });
        const objectUrl = URL.createObjectURL(blob);

        const img = document.createElement("img");
        img.src = objectUrl;
        img.style.maxWidth = "200px";
        img.style.display = "block";
        img.style.marginTop = "5px";
        imgPlaceholder.replaceWith(img);
      } catch (err: any) {
        console.error("Error reading image:", err);
        imgPlaceholder.innerText = "Error loading image: " + (err?.message || "Unknown error");
      }
    }

    if (imageList) imageList.appendChild(ul);
  } catch (error: any) {
    console.error("List Error:", error);
    if (imageList)
      imageList.innerHTML = "Failed to list images: " + (error?.message || "Unknown error");
  }
}

// Event Listeners
if (uploadBtn) uploadBtn.onclick = uploadFile;
if (listBtn) listBtn.onclick = listImages;

// Run initial list if we are in the browser
if (typeof document !== "undefined") {
  listImages();
}
