const express = require("express");
const router = express.Router();
const Schedule = require("../models/Schedule");

// 📌 GET /schedule?userId=123 → Fetch user's schedule
router.get("/schedule", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const userSchedule = await Schedule.findOne({ userId });
    if (!userSchedule) return res.status(404).json({ message: "No schedule found" });

    res.json({ schedule: userSchedule.schedule });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// 📌 POST /schedule → Save or update user's schedule
router.post("/schedule", async (req, res) => {
  try {
    const { userId, schedule } = req.body;
    if (!userId || !schedule || !Array.isArray(schedule))
      return res.status(400).json({ error: "Invalid data format" });

    let userSchedule = await Schedule.findOne({ userId });

    if (userSchedule) {
      // Update existing schedule
      userSchedule.schedule = schedule;
      await userSchedule.save();
    } else {
      // Create new schedule
      userSchedule = new Schedule({ userId, schedule });
      await userSchedule.save();
    }

    res.json({ message: "Schedule saved successfully", schedule: userSchedule.schedule });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
