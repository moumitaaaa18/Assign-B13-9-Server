const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const uri = process.env.DB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log("MongoDB Connected Successfully");

    const database = client.db("driveFleetDB");
    const usersCollection = database.collection("users");
    const carsCollection = database.collection("cars");

    app.get("/", (req, res) => {
      res.send("DriveFleet Server Running");
    });

    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/cars", async (req, res) => {
      const result = await carsCollection.find().toArray();
      res.send(result);
    });
    app.get("/my-cars", async (req, res) => {
  const result = await carsCollection.find({ isMyAdded: true }).toArray();
  res.send(result);
});

    app.get("/cars/:id", async (req, res) => {
      const id = req.params.id;
      const result = await carsCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.post("/cars", async (req, res) => {
      const car = req.body;
      car.booking_count = 0;
      car.createdAt = new Date();

      const result = await carsCollection.insertOne(car);
      res.send(result);
    });

    app.put("/cars/:id", async (req, res) => {
      const id = req.params.id;
      const updatedCar = req.body;

      const result = await carsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedCar }
      );

      res.send(result);
    });

    app.delete("/cars/:id", async (req, res) => {
      const id = req.params.id;

      const result = await carsCollection.deleteOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });
  } catch (error) {
    console.log("MongoDB Error:", error.message);
  }
}

run();

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});