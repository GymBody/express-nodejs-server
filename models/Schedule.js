const mongoose = require("mongoose");

const ScheduleSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  schedule: [
    {
      day: { type: String, required: true },
      start: { type: String, required: true },
      end: { type: String, required: true },
    },
  ],
});

const Schedule = mongoose.model("Schedule", ScheduleSchema);
module.exports = Schedule;
