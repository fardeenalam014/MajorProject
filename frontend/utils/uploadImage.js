// src/utils/uploadImage.js
// Uploads a base64 image to Cloudinary and returns the secure URL.
// Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your .env

const CLOUD_NAME   = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET; // unsigned preset

export async function uploadToCloudinary(base64DataUrl) {
  // If it's already a URL (previously uploaded), return as-is
  if (!base64DataUrl || !base64DataUrl.startsWith("data:")) return base64DataUrl;

  const formData = new FormData();
  formData.append("file", base64DataUrl);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) throw new Error("Cloudinary upload failed");
  const data = await res.json();
  return data.secure_url; // e.g. "https://res.cloudinary.com/..."
}