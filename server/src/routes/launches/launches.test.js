const request = require("supertest");
const { app } = require("../../app");
const { mongoConnect } = require("../../services/mongo");
const { loadPlanetsData } = require("../../models/planets.model");

describe("Launches Test API", () => {
  beforeAll(async () => {
    mongoConnect();
    await loadPlanetsData();
  });

  describe("Test Get /launches", () => {
    test("it should respond with 200 success", async () => {
      const response = await request(app)
        .get("/v1/launches")
        .expect("Content-type", /json/)
        .expect(200);
    });
  });

  describe("Test Post / launches", () => {
    const completeLaunchData = {
      mission: "SpaceX moon test",
      rocket: "UCC 1757",
      target: "Kepler-62 f",
      launchDate: "January 17, 2030",
    };

    const completeLaunchWithoutDate = {
      mission: "SpaceX moon test",
      rocket: "UCC 1757",
      target: "Kepler-62 f",
    };

    const invalidLaunchDate = {
      mission: "SpaceX moon test",
      rocket: "UCC 1757",
      target: "Kepler-62 f",
      launchDate: "zoot",
    };
    test("it should respond with 201 created", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(completeLaunchData)
        .expect("Content-Type", /json/)
        .expect(201);

      const requestDate = new Date(completeLaunchData.launchDate).valueOf();
      const responseDate = new Date(response.body.launchDate).valueOf();
      expect(responseDate).toBe(requestDate);

      expect(response.body).toMatchObject(completeLaunchWithoutDate);
    });

    test("it should catch missing required properties", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(completeLaunchWithoutDate)
        .expect("Content-type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual({
        error: "Mission required launch property",
      });
    });

    test("it should catch invalid launch date", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(invalidLaunchDate)
        .expect("Content-type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual({
        error: "invalid launch date",
      });
    });
  });
});
