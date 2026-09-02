import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import { createContactMessage, getContactMessages, subscribe, updateContactStatus } from "../controllers/support.controller.js";

const router = express.Router();

router.post("/subscribe", subscribe);
router.post("/contact", createContactMessage);
router.get("/contact", protectRoute, adminRoute, getContactMessages);
router.patch("/contact/:id", protectRoute, adminRoute, updateContactStatus);

export default router;
