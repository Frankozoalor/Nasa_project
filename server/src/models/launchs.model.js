const launchesDatabase = require("./launches.schema");
const planetDatabase = require("./planets.schema");
const axios = require("axios");

let DEFUALT_FLIGHTNUMBER = 100;

const SPACEX_API_URL = process.env.SPACEX_API_URL;

async function populateLaunch() {
  console.log("downloading data");
  const response = await axios.post(SPACEX_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: "rocket",
          select: {
            name: 1,
          },
        },
        {
          path: "payloads",
          select: {
            customers: 1,
          },
        },
      ],
    },
  });

  const launchDocs = response.data.docs;
  for (const launchDoc of launchDocs) {
    const payloads = launchDoc["payloads"];
    const customers = payloads.flatMap((payload) => {
      return payload["customers"];
    });

    const launch = {
      flightNumber: launchDoc["flight_number"],
      mission: launchDoc["name"],
      rocket: launchDoc["rocket"]["name"],
      launchDate: launchDoc["date_local"],
      upcoming: launchDoc["upcoming"],
      success: launchDoc["success"],
      customers,
    };

    console.log(`${launch.flightNumber} ${launch.mission}`);
    await savePlanet(launch);
  }
  if (response.ok !== 200) {
    console.log("Problem downloading data");
    throw new Error("Launch data terminating");
  }
}

async function loadLaunchData() {
  try {
    const firstLaunch = await findLaunch({
      flightNumber: 1,
      rocket: "Falcon1",
      mission: "FalconSat",
    });
    if (firstLaunch) {
      console.log("Launch already downloaded");
    } else {
      await populateLaunch();
    }
  } catch (err) {
    console.log(err);
  }
}

async function findLaunch(filter) {
  return await launchesDatabase.findOne({ filter });
}

async function savePlanet(launch) {
  await launchesDatabase.findOneAndUpdate(
    { flightNumber: launch.flightNumber },
    launch,
    { upsert: true }
  );
}

async function existsLaunchWithId(id) {
  return await findLaunch({
    flightNumber: id,
  });
}

async function getLatestFlightNumber() {
  const latestLaunch = await launchesDatabase.findOne().sort("-flightNumber");
  if (!latestLaunch) {
    return DEFUALT_FLIGHTNUMBER;
  }
  return latestLaunch.flightNumber;
}

async function getAllLaunches(skip, limit) {
  return await launchesDatabase
    .find({}, { _id: 0, __v: 0 })
    .sort({ flightNumber: 1 })
    .skip(skip)
    .limit(limit);
}

async function scheduleNewLaunch(launch) {
  const planet = await planetDatabase.findOne({
    keplerName: launch.target,
  });

  if (!planet) {
    throw new Error("invalid target destination");
  }
  const newFlightNumber = (await getLatestFlightNumber()) + 1;

  const newLaunch = Object.assign(launch, {
    success: true,
    upcoming: true,
    customers: ["Kenkas construction Agency", "Nasa"],
    flightNumber: newFlightNumber,
  });

  await savePlanet(newLaunch);
}

async function abortLaunchById(id) {
  const aborted = await launchesDatabase.updateOne(
    {
      flightNumber: id,
    },
    {
      upcoming: false,
      success: false,
    }
  );
  return aborted.modifiedCount === 1;
}
module.exports = {
  loadLaunchData,
  existsLaunchWithId,
  getAllLaunches,
  scheduleNewLaunch,
  abortLaunchById,
};
