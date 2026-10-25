import express from "express";
import { setPassword, sendWelcomeMail } from "./mailController.js";
import { validateRequest, setPasswordSchema } from "../../middlewares/validateRequest.js";

const router = express.Router();

router.post("/set-password", validateRequest(setPasswordSchema), setPassword);
router.post("/send-welcome-mail", sendWelcomeMail);

export default router;
