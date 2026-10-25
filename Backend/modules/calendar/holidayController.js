import { getDB } from '../../config/db.js';

export const addHoliday = async (req, res) => {
  try {
    const db = getDB();
    const { date, reason } = req.body;

    if (!date || !reason) {
      return res.status(400).json({ message: "Date and reason are required" });
    }

    await db.collection('Holidays').insertOne({ date, reason });
    res.status(201).json({ message: "Holiday added successfully" });
  } catch (error) {
    console.error("Error adding holiday:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getHolidays = async (req, res) => {
  try {
    const db = getDB();
    const holidays = await db.collection('Holidays').find({}).toArray();
    res.status(200).json(holidays);
  } catch (error) {
    console.error("Error fetching holidays:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export default { addHoliday, getHolidays };
