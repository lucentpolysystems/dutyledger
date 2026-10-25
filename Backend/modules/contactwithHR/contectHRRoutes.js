import express from "express";
import { createRequest, getRequests, getRequestById, updateRequestStatus } from "./contectHRController.js";
import authenticateToken from "../../middlewares/authMiddleware.js";

const router = express.Router();

// Employee submits request
router.post("/", createRequest);

// HR gets all requests
router.get("/", getRequests);

// HR gets single request
router.get("/:id", getRequestById);

// HR updates request status
router.patch("/:id/status", authenticateToken, updateRequestStatus);

export default router;
