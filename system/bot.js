const WeekModel = require("../models/weeks");

const weekCheckBot = async () => {
  // Deactivate all old active weeks
  const oldWeeks = await WeekModel.find({ isActive: true });
  if (oldWeeks) {
    for (const week of oldWeeks) {
      week.isActive = false;
      await week.save();
    }
  }
  // Fetch the latest week entry to determine the next week number
  const latestWeek = await WeekModel.findOne().sort({ startDate: -1 });
  let nextWeekNumber = 1; // Default to 1 if no weeks exist

  if (latestWeek) {
    const latestWeekName = latestWeek.name;
    const weekNumberMatch = latestWeekName.match(/Week (\d+)/);
    if (weekNumberMatch) {
      const latestWeekNumber = parseInt(weekNumberMatch[1], 10);
      nextWeekNumber = latestWeekNumber + 1;
    }
  }

  const startDate = new Date();
  const endDate = new Date(startDate);
  //endDate.setDate(startDate.getDate() + 7);
  endDate.setDate(startDate.getDate() + 1);
  const isActive = true;

  const newWeek = new WeekModel({
    name: `Week ${nextWeekNumber}`,
    startDate: startDate,
    endDate: endDate,
    isActive: true,
  });

  await newWeek.save();
};

module.exports = {
  weekCheckBot,
};
