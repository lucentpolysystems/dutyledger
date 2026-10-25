import { prisma } from "../../config/db.js";

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

    const created = await prisma.announcement.create({
      data: {
        title: String(title).trim(),
        description: String(description).trim(),
        startDate: String(startDate),
        endDate: String(endDate),
        createdBy: req.user?.username || "HR",
      },
    });

    res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      announcement: created,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating announcement", error: error.message });
  }
};

// Fetch announcements for dashboard views
export const getAnnouncements = async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
    });

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
      where: { id: String(id) },
      data: {
        title: String(title).trim(),
        description: String(description).trim(),
        startDate: String(startDate),
        endDate: String(endDate),
      },
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
