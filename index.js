import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.DB_URI);

async function run() {
  try {
    await client.connect();
    console.log("MongoDB Connected Successfully");

    const database = client.db("driveFleetDB");
    const carsCollection = database.collection("cars");
    const bookingsCollection = database.collection("bookings");

    app.get("/", (req, res) => {
      res.send("DriveFleet Server Running");
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
      car.isMyAdded = true;

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

    app.get("/bookings", async (req, res) => {
      const result = await bookingsCollection.find().toArray();
      res.send(result);
    });

    app.post("/bookings", async (req, res) => {
      const booking = req.body;

      const result = await bookingsCollection.insertOne(booking);

      await carsCollection.updateOne(
        { _id: new ObjectId(booking.carId) },
        { $inc: { booking_count: 1 } }
      );

      res.send(result);
    });
  } catch (error) {
    console.log("Server Error:", error.message);
  }
}

run();

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});