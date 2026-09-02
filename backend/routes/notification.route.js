import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../controllers/notification.controller.js";
const router=express.Router();router.use(protectRoute);router.get("/",getNotifications);router.patch("/read-all",markAllNotificationsRead);router.patch("/:id/read",markNotificationRead);export default router;
