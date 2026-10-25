import express from "express";
import { setPassword, sendWelcomeMail } from "./mailController.js";

const router = express.Router();

router.post("/set-password", setPassword);
router.post("/send-welcome-mail", sendWelcomeMail);

export default router;
