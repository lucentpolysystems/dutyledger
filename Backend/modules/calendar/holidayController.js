import { prisma } from '../../config/db.js';

export const addHoliday = async (req, res) => {
  try {
    const { date, reason } = req.body;

    if (!date || !reason) {
      return res.status(400).json({ message: "Date and reason are required" });
    }

    const newHoliday = await prisma.holiday.create({
      data: {
        date: String(date).trim(),
        reason: String(reason).trim(),
      },
    });

    res.status(201).json({ message: "Holiday added successfully", holiday: newHoliday });
  } catch (error) {
    console.error("Error adding holiday:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getHolidays = async (req, res) => {
  try {
    const holidays = await prisma.holiday.findMany({
      orderBy: { date: 'asc' },
    });
    res.status(200).json(holidays);
  } catch (error) {
    console.error("Error fetching holidays:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export default { addHoliday, getHolidays };
