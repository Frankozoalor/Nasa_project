const mongoose = require("mongoose");

require("dotenv").config();

const MONGO_URL = process.env.MONGO_URL;

mongoose.connection.once("open", () => {
  console.log("Mongoose connection is ready!");
});

mongoose.set("strictQuery", true);

mongoose.connection.on("error", (err) => {
  console.log(err);
});

function mongoConnect() {
  mongoose.connect(MONGO_URL);
}

function mongoDisconnect() {
  mongoose.disconnect(MONGO_URL);
}

module.exports = {
  mongoConnect,
  mongoDisconnect,
};
