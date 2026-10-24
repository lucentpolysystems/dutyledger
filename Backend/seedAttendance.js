const { MongoClient } = require("mongodb");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "auth.env") });

const mongoURI = process.env.MONGO_URI;
const dbName = "Attendance";

const holidays2026 = [
  { date: "2026-01-01", reason: "New Year's Day" },
  { date: "2026-01-26", reason: "Republic Day" },
  { date: "2026-03-03", reason: "Holi Festival" },
  { date: "2026-04-03", reason: "Good Friday" },
  { date: "2026-05-01", reason: "Maharashtra Day / Labour Day" },
  { date: "2026-08-15", reason: "Independence Day" },
  { date: "2026-08-28", reason: "Raksha Bandhan" },
  { date: "2026-10-02", reason: "Mahatma Gandhi Jayanti" },
  { date: "2026-10-20", reason: "Dussehra (Vijayadashami)" },
  { date: "2026-11-08", reason: "Diwali (Deepawali)" },
  { date: "2026-11-09", reason: "Govardhan Puja" },
  { date: "2026-12-25", reason: "Christmas Day" },
];

async function seedAttendanceAndHolidays() {
  const client = new MongoClient(mongoURI);
  try {
    await client.connect();
    const db = client.db(dbName);
    console.log("Connected to MongoDB database:", dbName);

    // 1. Seed Holidays
    await db.collection("Holidays").deleteMany({});
    await db.collection("Holidays").insertMany(holidays2026);
    console.log(`Seeded ${holidays2026.length} company holidays into Holidays collection.`);

    // 2. Clear old test attendance records
    await db.collection("Attendance").deleteMany({});

    const office = { lat: 22.816958, lng: 72.473781 };
    const employees = [
      { user_id: "EMP001", username: "John Doe" },
      { user_id: "ADMIN001", username: "Admin User" },
    ];

    const attendanceRecords = [];

    // Helper to generate records for a specific year and month
    const generateMonthAttendance = (year, month, daysInMonth, maxDay = daysInMonth) => {
      for (let day = 1; day <= maxDay; day++) {
        const dayStr = String(day).padStart(2, "0");
        const monthStr = String(month).padStart(2, "0");
        const dateStr = `${year}-${monthStr}-${dayStr}`;

        const dateObj = new Date(year, month - 1, day);
        const dayOfWeek = dateObj.getDay(); // 0 is Sunday

        // Skip Sunday
        if (dayOfWeek === 0) continue;

        // Skip Company Holidays
        const isHoliday = holidays2026.some((h) => h.date === dateStr);
        if (isHoliday) continue;

        for (const emp of employees) {
          // Semi-randomize realistic punch in/out
          let inHour = 9;
          let inMin = 5 + Math.floor(Math.random() * 20); // 9:05 - 9:25
          let status = "Present";

          // Occasional late arrival (every ~6th day)
          if ((day + emp.username.length) % 6 === 0) {
            inMin = 25 + Math.floor(Math.random() * 30); // 9:25 - 9:55
            status = "Late";
          }

          // Occasional half-day (day 14)
          const isHalfDay = day === 14;

          const inTimeFormatted = `${String(inHour).padStart(2, "0")}:${String(inMin).padStart(2, "0")} AM`;

          let outHour = 18; // 6 PM
          let outMin = 10 + Math.floor(Math.random() * 35); // 18:10 - 18:45
          let outTimeFormatted = `${String(outHour - 12).padStart(2, "0")}:${String(outMin).padStart(2, "0")} PM`;

          if (isHalfDay) {
            outHour = 13;
            outMin = 30;
            outTimeFormatted = "01:30 PM";
            status = "Half Day";
          }

          // If today (2026-10-24), show checked-in and active (no out_time yet)
          const isToday = dateStr === "2026-10-24";
          if (isToday) {
            outTimeFormatted = null;
          }

          const inDateObj = new Date(Date.UTC(year, month - 1, day, inHour, inMin));
          const outDateObj = outTimeFormatted
            ? new Date(Date.UTC(year, month - 1, day, outHour, outMin))
            : null;

          const workMinutes = outDateObj ? (outHour - inHour) * 60 + (outMin - inMin) : null;
          const durH = workMinutes ? Math.floor(workMinutes / 60) : null;
          const durM = workMinutes ? workMinutes % 60 : null;
          const work_duration = workMinutes ? `${durH}h ${durM}m` : "In Progress";
          const total_hours = workMinutes ? (workMinutes / 60).toFixed(2) : null;

          attendanceRecords.push({
            user_id: emp.user_id,
            username: emp.username,
            date: dateStr,
            time: inDateObj,
            in_time_raw: inDateObj,
            in_time: inTimeFormatted,
            out_time: outTimeFormatted,
            out_time_raw: outDateObj,
            work_duration,
            total_hours,
            status,
            punch_type: isToday ? "IN" : "OUT",
            location: office,
            punches: [
              { type: "IN", time: inDateObj, timeFormatted: inTimeFormatted, location: office },
              ...(outDateObj
                ? [{ type: "OUT", time: outDateObj, timeFormatted: outTimeFormatted, location: office }]
                : []),
            ],
          });
        }
      }
    };

    // Seed October 2026 (up to today 24th)
    generateMonthAttendance(2026, 10, 31, 24);

    // Seed September 2026 (full month)
    generateMonthAttendance(2026, 9, 30, 30);

    await db.collection("Attendance").insertMany(attendanceRecords);
    console.log(`Seeded ${attendanceRecords.length} attendance records across Sep-Oct 2026.`);

    await client.close();
    console.log("Attendance seeding complete!");
  } catch (err) {
    console.error("Error seeding attendance:", err);
    process.exit(1);
  }
}

seedAttendanceAndHolidays();
