const http = require("http");

require("dotenv").config();
const { app } = require("./app");
const { mongoConnect } = require("./services/mongo");
const { loadPlanetsData } = require("./models/planets.model");
const { loadLaunchData } = require("./models/launchs.model");

const PORT = process.env.PORT || 8000;

const sever = http.createServer(app);

async function startServer() {
  await mongoConnect();
  await loadPlanetsData();
  await loadLaunchData();

  sever.listen(PORT, () => {
    console.log(`listening to ${PORT}....`);
  });
}

startServer();
