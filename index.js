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
      const search = req.query.search || "";
      const type = req.query.type || "";

      const query = {};

      if (search) {
        query.carModel = { $regex: search, $options: "i" };
      }

      if (type && type !== "All Types") {
        query.carType = type;
      }

      const result = await carsCollection.find(query).toArray();
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
      const result = await carsCollection.deleteOne({ _id: new ObjectId(id) });
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

    app.get("/reset-database", async (req, res) => {
      await carsCollection.deleteMany({});
      await bookingsCollection.deleteMany({});

      const defaultCars = [
        {
          carModel: "Toyota Corolla",
          carType: "Sedan",
          dailyRentalPrice: 5000,
          location: "Dhaka",
          availability: "Available",
          booking_count: 0,
          isMyAdded: false,
        },
        {
          carModel: "Honda Civic",
          carType: "Sedan",
          dailyRentalPrice: 4000,
          location: "Sylhet",
          availability: "Available",
          booking_count: 0,
          isMyAdded: false,
        },
        {
          carModel: "Suzuki Swift",
          carType: "Hatchback",
          dailyRentalPrice: 3000,
          location: "Khulna",
          availability: "Available",
          booking_count: 0,
          isMyAdded: false,
        },
        {
          carModel: "Mercedes C-Class",
          carType: "Luxury",
          dailyRentalPrice: 18000,
          location: "Dhaka",
          availability: "Available",
          booking_count: 0,
          isMyAdded: false,
        },
        {
          carModel: "Nissan X-Trail",
          carType: "SUV",
          dailyRentalPrice: 6500,
          location: "Barishal",
          availability: "Unavailable",
          booking_count: 0,
          isMyAdded: false,
        },
        {
          carModel: "Mazda CX-5",
          carType: "SUV",
          dailyRentalPrice: 7200,
          location: "Dhaka",
          availability: "Available",
          booking_count: 0,
          isMyAdded: false,
        },
      ];

      const result = await carsCollection.insertMany(defaultCars);

      res.send({
        message: "Database reset successfully",
        insertedCars: result.insertedCount,
      });
    });
  } catch (error) {
    console.log("Server Error:", error.message);
  }
}

run();

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});