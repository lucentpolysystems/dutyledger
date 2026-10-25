import cloudinary from "../../config/cloudinary.js";
import streamifier from "streamifier";
import { getDB } from "../../config/db.js";

export const uploadProfilePic = async (req, res) => {
  const user_id = req.body.user_id;
  console.log("Received user_id:", user_id);

  if (!user_id || !req.file) {
    return res.status(400).json({ message: "Missing file or userId" });
  }

  const uploadStream = cloudinary.uploader.upload_stream(
    { folder: "profile_pictures" },
    async (err, result) => {
      if (err) {
        console.error("Cloudinary Upload Error:", err);
        return res.status(500).json({ message: "Cloudinary error" });
      }

      const db = getDB();
      const update = await db.collection("users").updateOne(
        { user_id: user_id },
        { $set: { profileImage: result.secure_url, profilePic: result.secure_url } }
      );

      if (update.modifiedCount === 1) {
        res.json({ message: "✅ Image uploaded", imageUrl: result.secure_url });
      } else {
        res.status(404).json({ message: "❌ User not found" });
      }
    }
  );

  streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
};

export default { uploadProfilePic };
