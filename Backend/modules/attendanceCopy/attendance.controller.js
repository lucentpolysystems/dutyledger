import { prisma } from "../../config/db.js";

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

// ✅ GET /attendance/:userId (Native Prisma)
export const getTodayAttendance = async (req, res) => {
  const userId = String(req.params.userId).trim();
  const nowIST = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
  const today = nowIST.toISOString().split("T")[0];

  try {
    const data = await prisma.attendance.findFirst({
      where: {
        userId,
        date: today,
      },
    });

    if (!data) {
      return res.status(200).json({ status: "Absent", in_time: null, out_time: null });
    } else {
      return res.status(200).json({
        status: data.status || "Present",
        in_time: data.inTime || formatTimeAMPM(data.time),
        out_time: data.outTime || null,
        total_hours: data.totalHours || null,
        work_duration: data.workDuration || null,
      });
    }
  } catch (err) {
    console.error("❌ Error fetching today's attendance:", err);
    res.status(500).json({ error: "DB error" });
  }
};

// ✅ POST /mark-attendance (Native Prisma)
export const markAttendance = async (req, res) => {
  try {
    const { username, location, id, punchType } = req.body;

    // 1. Find user by userId or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { userId: String(id).trim() },
          { username: String(username).trim() },
        ],
      },
    });

    if (!user) {
      return res.status(404).json({ message: "❌ User not found in database" });
    }

    const canonicalUserId = user.userId;
    const canonicalUsername = user.username;

    // 2. Geofence check against office coordinates
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
      if (dist > 3 && !location.bypassGeofence && process.env.NODE_ENV === "production") {
        return res.status(403).json({
          message: `⛔ Not at office location! Distance (${dist.toFixed(1)} km) exceeds 3km tolerance.`,
        });
      }
    }

    // 3. IST Timestamp calculation
    const utcNow = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(utcNow.getTime() + istOffset);

    const hours = istNow.getUTCHours();
    const minutes = istNow.getUTCMinutes();
    const totalMinutes = hours * 60 + minutes;
    const today = istNow.toISOString().split("T")[0];
    const timeFormatted = formatTimeAMPM(istNow);

    // 4. Check existing record for today
    const existing = await prisma.attendance.findFirst({
      where: {
        userId: canonicalUserId,
        date: today,
      },
    });

    const isPunchIn = punchType === "IN" || (!punchType && !existing);
    const isPunchOut = punchType === "OUT" || (!punchType && existing);

    if (isPunchIn) {
      if (existing) {
        return res.status(200).json({
          message: `ℹ️ Already checked in today at ${existing.inTime || "earlier"}.`,
          record: existing,
          alreadyCheckedIn: true,
          in_time: existing.inTime,
          out_time: existing.outTime,
          status: existing.status,
        });
      }

      // Determine late / on-time status
      let status = "Late Absent";
      if (totalMinutes <= 615) {
        status = "Present";
      } else if (totalMinutes <= 645) {
        status = "Late";
      }

      const created = await prisma.attendance.create({
        data: {
          userId: canonicalUserId,
          username: canonicalUsername,
          location: punchLocation,
          time: istNow,
          inTimeRaw: istNow,
          inTime: timeFormatted,
          outTime: null,
          outTimeRaw: null,
          workDuration: null,
          totalHours: null,
          date: today,
          status,
          punchType: "IN",
          punches: [{ type: "IN", time: istNow, timeFormatted, location: punchLocation }],
        },
      });

      return res.status(200).json({
        message: `✅ Check-in recorded at ${timeFormatted} (Status: '${status}')`,
        record: created,
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

      // Check-Out calculation
      const inTimeRaw = existing.inTimeRaw || existing.time || istNow;
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

      const currentPunches = Array.isArray(existing.punches) ? existing.punches : [];
      currentPunches.push({ type: "OUT", time: istNow, timeFormatted, location: punchLocation });

      await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          outTime: timeFormatted,
          outTimeRaw: istNow,
          workDuration: work_duration,
          totalHours: total_hours,
          status: finalStatus,
          punchType: "OUT",
          punches: currentPunches,
        },
      });

      return res.status(200).json({
        message: `✅ Check-out recorded at ${timeFormatted} (Total Shift: ${work_duration})`,
        out_time: timeFormatted,
        in_time: existing.inTime,
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

// ✅ GET /all-attendance (Native Prisma)
export const getAllAttendance = async (req, res) => {
  try {
    const nowIST = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
    const today = nowIST.toISOString().split("T")[0];

    const attendance = await prisma.attendance.findMany({
      where: { date: today },
      orderBy: { createdAt: "desc" },
    });

    const mapped = attendance.map((a) => ({
      ...a,
      user_id: a.userId,
      in_time: a.inTime,
      out_time: a.outTime,
      work_duration: a.workDuration,
      total_hours: a.totalHours,
    }));

    res.status(200).json({ attendance: mapped });
  } catch (error) {
    res.status(500).json({ message: "Error fetching attendance in db", error: error.message });
  }
};

// ✅ GET /getAllAttendanceByMonthofuser/:userId/:month
export const getAllAttendanceByMonthofuser = async (req, res) => {
  const { userId, month } = req.params;

  try {
    const attendance = await prisma.attendance.findMany({
      where: {
        userId: String(userId).trim(),
        date: { startsWith: String(month).trim() },
      },
      orderBy: { date: "asc" },
    });

    const formatted = attendance.map((record) => {
      const inTime = record.inTime || (record.time ? formatTimeAMPM(record.time) : "--:--");
      const outTime = record.outTime || null;
      return {
        ...record,
        user_id: record.userId,
        in_time: inTime,
        out_time: outTime,
        work_duration: record.workDuration || (record.totalHours ? `${record.totalHours} hrs` : null),
        total_hours: record.totalHours || null,
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
    const { month } = req.params;

    const attendance = await prisma.attendance.findMany({
      where: {
        date: { startsWith: String(month).trim() },
      },
      orderBy: { date: "asc" },
    });

    const formatted = attendance.map((record) => ({
      ...record,
      user_id: record.userId,
      in_time: record.inTime || (record.time ? formatTimeAMPM(record.time) : "--:--"),
      out_time: record.outTime || null,
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
