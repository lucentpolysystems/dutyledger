import express from "express";
import authenticateToken from "../../middlewares/authMiddleware.js";
import { createAnnouncement, getAnnouncements, updateAnnouncement } from "./announcements.controller.js";

const router = express.Router();

router.get("/announcements", getAnnouncements);
router.post("/announcements", authenticateToken, createAnnouncement);
router.put("/announcements/:id", authenticateToken, updateAnnouncement);

export default router;
