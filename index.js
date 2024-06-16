const express = require("express");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const router = require("./routes");
const cors = require("cors");
const MongoClient = require("mongodb").MongoClient;
const bodyParser = require("body-parser");
const cron = require("node-cron");
const system = require("./system/bot");
const tgbot = require("./bot/tgbot");

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "500mb" }));
app.use(
  bodyParser.urlencoded({
    limit: "500mb",
    extended: true,
    parameterLimit: 5000000,
  })
);
const PORT = process.env.PORT || 5000;
connectDB();
const server = require("http").createServer(app);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/api", router);

//cron.schedule('0 0 * * 1', () => {
cron.schedule("0 0 * * *", async () => {
  console.log("Run at midnight", new Date());
  system.weekCheckBot();
});

server.listen(PORT, () => {
  console.log(`Node app is running on port ${PORT}`);
});
