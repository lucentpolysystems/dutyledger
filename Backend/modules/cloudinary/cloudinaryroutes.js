import express from "express";
import { uploadProfilePic } from "./cloudinarycontrollers.js";
import upload from "../../middlewares/upload.js";

const router = express.Router();

router.post("/upload-image", upload.single("image"), uploadProfilePic);

export default router;
