import express from "express";
import {
  getTodayAttendance,
  markAttendance,
  getAllAttendance,
  getAllAttendanceByMonthofuser,
  getAllAttendanceByMonth,
} from "./attendance.controller.js";

const router = express.Router();

router.get("/attendance/:userId", getTodayAttendance);
router.post("/mark-attendance", markAttendance);
router.get("/all-attendance", getAllAttendance);
router.get("/getAllAttendanceByMonthofuser/:userId/:month", getAllAttendanceByMonthofuser);
router.get("/all-attendance-by-month/:month", getAllAttendanceByMonth);

export default router;
