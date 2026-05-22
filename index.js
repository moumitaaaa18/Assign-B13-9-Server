import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { MongoClient, ObjectId } from "mongodb";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

const client = new MongoClient(process.env.DB_URI);

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }

    req.user = decoded;
    next();
  });
};

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

    app.post("/jwt", async (req, res) => {
      const user = req.body;

      const token = jwt.sign(user, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
        })
        .send({ success: true });
    });

    app.post("/logout", async (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
        })
        .send({ success: true });
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

    app.get("/cars/:id", async (req, res) => {
      const id = req.params.id;

      const result = await carsCollection.findOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });

    app.post("/cars", verifyToken, async (req, res) => {
      const car = req.body;

      car.booking_count = 0;
      car.createdAt = new Date();
      car.isMyAdded = true;

      const result = await carsCollection.insertOne(car);

      res.send(result);
    });

    app.get("/my-cars", verifyToken, async (req, res) => {
      const email = req.query.email;

      const query = email
        ? { userEmail: email, isMyAdded: true }
        : { isMyAdded: true };

      const result = await carsCollection.find(query).toArray();

      res.send(result);
    });

    app.put("/cars/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const updatedCar = req.body;

      const result = await carsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedCar }
      );

      res.send(result);
    });

    app.delete("/cars/:id", verifyToken, async (req, res) => {
      const id = req.params.id;

      const result = await carsCollection.deleteOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });

    app.get("/bookings", verifyToken, async (req, res) => {
      const email = req.query.email;

      const query = email ? { userEmail: email } : {};

      const result = await bookingsCollection.find(query).toArray();

      res.send(result);
    });

    app.post("/bookings", verifyToken, async (req, res) => {
      const booking = req.body;

      booking.bookingDate = new Date().toLocaleDateString();
      booking.status = "Confirmed";

      const result = await bookingsCollection.insertOne(booking);

      await carsCollection.updateOne(
        { _id: new ObjectId(booking.carId) },
        { $inc: { booking_count: 1 } }
      );

      res.send(result);
    });

    app.delete("/bookings", async (req, res) => {
      await bookingsCollection.deleteMany({});
      await carsCollection.updateMany({}, { $set: { booking_count: 0 } });

      res.send({
        success: true,
        message: "All bookings cleared",
      });
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
          seatCapacity: 5,
          description: "Comfortable sedan for city and highway travel.",
          image:
            "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=900",
        },
        {
          carModel: "Honda Civic",
          carType: "Sedan",
          dailyRentalPrice: 4000,
          location: "Sylhet",
          availability: "Available",
          booking_count: 0,
          isMyAdded: false,
          seatCapacity: 5,
          description: "Stylish and fuel-efficient sedan for daily trips.",
          image:
            "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=900",
        },
        {
          carModel: "Suzuki Swift",
          carType: "Hatchback",
          dailyRentalPrice: 3000,
          location: "Khulna",
          availability: "Available",
          booking_count: 0,
          isMyAdded: false,
          seatCapacity: 4,
          description: "Compact hatchback perfect for city driving.",
          image:
            "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=900",
        },
        {
          carModel: "Mercedes C-Class",
          carType: "Luxury",
          dailyRentalPrice: 18000,
          location: "Dhaka",
          availability: "Available",
          booking_count: 0,
          isMyAdded: false,
          seatCapacity: 5,
          description: "Luxury car for premium and comfortable rides.",
          image:
            "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=900",
        },
        {
          carModel: "Nissan X-Trail",
          carType: "SUV",
          dailyRentalPrice: 6500,
          location: "Barishal",
          availability: "Available",
          booking_count: 0,
          isMyAdded: false,
          seatCapacity: 7,
          description: "Spacious SUV for family tours and long journeys.",
          image:
            "https://images.unsplash.com/photo-1542362567-b07e54358753?w=900",
        },
        {
          carModel: "Mazda CX-5",
          carType: "SUV",
          dailyRentalPrice: 7200,
          location: "Rajshahi",
          availability: "Available",
          booking_count: 0,
          isMyAdded: false,
          seatCapacity: 5,
          description: "Modern SUV with excellent comfort and performance.",
          image:
            "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=900",
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