import { getDB, prisma } from "../../config/db.js";

// HR creates a new announcement
export const createAnnouncement = async (req, res) => {
  try {
    const role = (req.user?.role || "").toLowerCase();
    if (role !== "hr" && role !== "admin" && role !== "super_admin") {
      return res.status(403).json({ success: false, message: "Only HR can create announcements" });
    }

    const { title, description, startDate, endDate } = req.body;

    if (!title || !description || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "title, description, startDate, and endDate are required",
      });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: "startDate must be before or equal to endDate",
      });
    }

    const db = getDB();

    const announcement = {
      title: String(title).trim(),
      description: String(description).trim(),
      startDate,
      endDate,
      createdBy: req.user?.username || "HR",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("Announcements").insertOne(announcement);

    res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      announcement: { _id: result.insertedId, id: result.insertedId, ...announcement },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating announcement", error: error.message });
  }
};

// Fetch announcements for dashboard views
export const getAnnouncements = async (req, res) => {
  try {
    const db = getDB();
    const announcements = await db
      .collection("Announcements")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({ success: true, announcements });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching announcements", error: error.message });
  }
};

// HR edits an existing announcement
export const updateAnnouncement = async (req, res) => {
  try {
    const role = (req.user?.role || "").toLowerCase();
    if (role !== "hr" && role !== "admin" && role !== "super_admin") {
      return res.status(403).json({ success: false, message: "Only HR can edit announcements" });
    }

    const { id } = req.params;
    const { title, description, startDate, endDate } = req.body;

    if (!title || !description || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "title, description, startDate, and endDate are required",
      });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: "startDate must be before or equal to endDate",
      });
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        title: String(title).trim(),
        description: String(description).trim(),
        startDate,
        endDate,
        updatedAt: new Date(),
      }
    });

    res.status(200).json({
      success: true,
      message: "Announcement updated successfully",
      announcement: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating announcement", error: error.message });
  }
};

export default {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
};
