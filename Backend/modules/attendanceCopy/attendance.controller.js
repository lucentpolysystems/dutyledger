import { getDB } from "../../config/db.js";

// Helper to format Date in 12-hour AM/PM format
const formatTimeAMPM = (dateObj) => {
  if (!dateObj) return null;
  const d = new Date(dateObj);
  let hours = d.getUTCHours();
  let minutes = d.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strMinutes = minutes < 10 ? '0' + minutes : minutes;
  const strHours = hours < 10 ? '0' + hours : hours;
  return `${strHours}:${strMinutes} ${ampm}`;
};

// ✅ GET /attendance/:userId
export const getTodayAttendance = async (req, res) => {
  const db = getDB();
  const user_id = String(req.params.userId);
  const nowIST = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
  const today = nowIST.toISOString().split("T")[0];

  try {
    const data = await db.collection("Attendance").findOne({ user_id, date: today });
    if (!data) {
      return res.status(200).json({ status: "Absent", in_time: null, out_time: null });
    } else {
      return res.status(200).json({
        status: data.status || "Present",
        in_time: data.in_time || formatTimeAMPM(data.time),
        out_time: data.out_time || null,
        total_hours: data.total_hours || null,
        work_duration: data.work_duration || null,
      });
    }
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "DB error" });
  }
};

// ✅ POST /mark-attendance
export const markAttendance = async (req, res) => {
  try {
    const db = getDB();
    const { username, location, id, punchType } = req.body;
    console.log("📥 Request body:", req.body);

    // 1. Find user (flexible by user_id or username)
    const user = await db.collection("users").findOne({
      $or: [
        { user_id: String(id) },
        { username: username },
      ],
    });
    if (!user) return res.status(404).json({ message: "❌ User not found in database" });

    const canonicalUserId = user.user_id || String(id);
    const canonicalUsername = user.username || username;

    // 2. Check location against office coordinates
    const office = { lat: 22.816958, lng: 72.473781 };
    const distance = (loc1, loc2) => {
      const R = 6371;
      const toRad = (deg) => (deg * Math.PI) / 180;
      const dLat = toRad(loc1.lat - loc2.lat);
      const dLon = toRad(loc1.lng - loc2.lng);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(loc1.lat)) *
          Math.cos(toRad(loc2.lat)) *
          Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    let punchLocation = location || office;
    if (location && location.lat && location.lng) {
      const dist = distance(location, office);
      console.log("📍 Distance from office:", dist.toFixed(2), "km");
      // Enforce strict geofence only in production when bypass is not enabled
      if (dist > 3 && !location.bypassGeofence && process.env.NODE_ENV === "production") {
        return res.status(403).json({
          message: `⛔ Not at office location! Distance (${dist.toFixed(1)} km) exceeds 3km tolerance.`,
        });
      }
    }

    // 3. Get IST time
    const utcNow = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(utcNow.getTime() + istOffset);

    const hours = istNow.getUTCHours();
    const minutes = istNow.getUTCMinutes();
    const totalMinutes = hours * 60 + minutes;
    const today = istNow.toISOString().split("T")[0];
    const timeFormatted = formatTimeAMPM(istNow);

    // 4. Check existing record for today
    const existing = await db.collection("Attendance").findOne({
      user_id: canonicalUserId,
      date: today,
    });

    const isPunchIn = punchType === "IN" || (!punchType && !existing);
    const isPunchOut = punchType === "OUT" || (!punchType && existing);

    if (isPunchIn) {
      if (existing) {
        return res.status(200).json({
          message: `ℹ️ Already checked in today at ${existing.in_time || "earlier"}.`,
          record: existing,
          alreadyCheckedIn: true,
          in_time: existing.in_time,
          out_time: existing.out_time,
          status: existing.status,
        });
      }

      // First punch of the day: Check-In (IN)
      let status = "Late Absent";
      if (totalMinutes <= 615) {
        status = "Present";
      } else if (totalMinutes <= 645) {
        status = "Late";
      }

      const newRecord = {
        user_id: canonicalUserId,
        username: canonicalUsername,
        location: punchLocation,
        time: istNow,
        in_time_raw: istNow,
        in_time: timeFormatted,
        out_time: null,
        out_time_raw: null,
        work_duration: null,
        total_hours: null,
        date: today,
        status,
        punch_type: "IN",
        punches: [{ type: "IN", time: istNow, timeFormatted, location: punchLocation }],
      };

      await db.collection("Attendance").insertOne(newRecord);
      return res.status(200).json({
        message: `✅ Check-in recorded at ${timeFormatted} (Status: '${status}')`,
        record: newRecord,
        status,
        in_time: timeFormatted,
        out_time: null,
      });
    } else if (isPunchOut) {
      if (!existing) {
        return res.status(400).json({
          message: "❗ You must check in (Punch IN) first before checking out.",
        });
      }

      // Check-Out (OUT)
      const inTimeRaw = existing.in_time_raw || existing.time || istNow;
      const diffMs = Math.max(0, istNow.getTime() - new Date(inTimeRaw).getTime());
      const totalWorkMinutes = Math.floor(diffMs / (1000 * 60));
      const durHours = Math.floor(totalWorkMinutes / 60);
      const durMins = totalWorkMinutes % 60;
      const work_duration = `${durHours}h ${durMins}m`;
      const total_hours = (totalWorkMinutes / 60).toFixed(2);

      let finalStatus = existing.status || "Present";
      if (durHours < 4 && finalStatus === "Present") {
        finalStatus = "Half Day";
      }

      await db.collection("Attendance").updateOne(
        { _id: existing._id },
        {
          $set: {
            out_time: timeFormatted,
            out_time_raw: istNow,
            work_duration,
            total_hours,
            status: finalStatus,
            punch_type: "OUT",
          },
          $push: {
            punches: { type: "OUT", time: istNow, timeFormatted, location: punchLocation },
          },
        }
      );

      return res.status(200).json({
        message: `✅ Check-out recorded at ${timeFormatted} (Total Shift: ${work_duration})`,
        out_time: timeFormatted,
        in_time: existing.in_time,
        work_duration,
        total_hours,
        status: finalStatus,
        punch_type: "OUT",
      });
    }
  } catch (error) {
    console.error("❌ Error in markAttendance:", error);
    res.status(500).json({ message: "Internal Server Error. Please try again later." });
  }
};

// ✅ GET /all-attendance
export const getAllAttendance = async (req, res) => {
  try {
    const db = getDB();
    const nowIST = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
    const today = nowIST.toISOString().split("T")[0];

    const attendance = await db
      .collection("Attendance")
      .find({ date: today })
      .sort({ time: -1 })
      .toArray();

    res.status(200).json({ attendance });
  } catch (error) {
    res.status(500).json({ message: "Error fetching attendance in db", error });
  }
};

// ✅ GET /getAllAttendanceByMonthofuser/:userId/:month
export const getAllAttendanceByMonthofuser = async (req, res) => {
  const db = getDB();
  const { userId, month } = req.params;

  try {
    const attendance = await db
      .collection("Attendance")
      .find({
        user_id: String(userId),
        date: { $regex: `^${month}` },
      })
      .sort({ date: 1 })
      .toArray();

    const formatted = attendance.map((record) => {
      const inTime = record.in_time || (record.time ? formatTimeAMPM(record.time) : "--:--");
      const outTime = record.out_time || null;
      return {
        ...record,
        in_time: inTime,
        out_time: outTime,
        work_duration: record.work_duration || (record.total_hours ? `${record.total_hours} hrs` : null),
        total_hours: record.total_hours || null,
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error("❌ Error fetching attendance:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ GET /all-attendance-by-month/:month
export const getAllAttendanceByMonth = async (req, res) => {
  try {
    const db = getDB();
    const { month } = req.params;

    const attendance = await db
      .collection("Attendance")
      .find({
        date: { $regex: `^${month}` },
      })
      .sort({ date: 1 })
      .toArray();

    const formatted = attendance.map((record) => ({
      ...record,
      in_time: record.in_time || (record.time ? formatTimeAMPM(record.time) : "--:--"),
      out_time: record.out_time || null,
    }));

    res.status(200).json({ attendance: formatted });
  } catch (err) {
    console.error("❌ Error fetching all monthly attendance:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export default {
  getTodayAttendance,
  markAttendance,
  getAllAttendance,
  getAllAttendanceByMonthofuser,
  getAllAttendanceByMonth,
};
