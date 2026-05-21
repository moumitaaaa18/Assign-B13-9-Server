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
    const bookingsCollection = database.collection("bookings");

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
app.get("/seed-cars", async (req, res) => {
  const cars = [
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

  const result = await carsCollection.insertMany(cars);
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