import cloudinary from "../config/cloudinary";

export const uploadToCloudinary = (
  fileBuffer: Buffer,
): Promise<{ secure_url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "tellure", resource_type: "image" },
      (error, result) => {
        if (error || !result) {
          return reject(error);
        }
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      },
    );
    uploadStream.end(fileBuffer);
  });
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  const result = await cloudinary.uploader.destroy(publicId);

  if (result.result !== "ok") {
    throw new Error(
      `Gagal menghapus gambar dengan ID ${publicId} dari Cloudinary.`,
    );
  }
};
