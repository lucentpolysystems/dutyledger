const express = require("express");
const {
  getTodayAttendance,
  markAttendance,
  getAllAttendance,
  getAllAttendanceByMonthofuser,
  getAllAttendanceByMonth,
} = require("./attendance.controller");

const router = express.Router();

router.get("/attendance/:userId", getTodayAttendance);
router.post("/mark-attendance", markAttendance);
router.get("/all-attendance", getAllAttendance);
router.get("/getAllAttendanceByMonthofuser/:userId/:month", getAllAttendanceByMonthofuser);
router.get("/all-attendance-by-month/:month", getAllAttendanceByMonth);

module.exports = router;
