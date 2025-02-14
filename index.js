import express from "express";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import cors from "cors";
import "dotenv/config";
import { MongoClient, ServerApiVersion } from "mongodb";


const uri = process.env.DB_URL;

// Create a MongoDB client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const app = express();
app.use(cors());
app.use(express.json());

// 📌 Connect to MongoDB
async function connectDB() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB!");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
  }
}
connectDB();

// 📌 ROOT API CHECK
app.get("/", async (req, res) => {
  try {
    await client.db("admin").command({ ping: 1 });
    res.status(200).send("✅ API is running & Connected to MongoDB!");
  } catch (error) {
    res.status(500).json({ error: "❌ MongoDB Connection Failed" });
  }
});

// 📌 USER SIGNUP
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  const generatedUserId = uuidv4();
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const database = client.db("gym-data");
    const users = database.collection("users");
    const existUser = await users.findOne({ email });

    if (existUser) {
      return res.status(409).send("❌ User already exists. Please login");
    }

    const sanitizedEmail = email.toLowerCase();
    const userData = {
      user_id: generatedUserId,
      email: sanitizedEmail,
      hashed_password: hashedPassword,
    };

    const insertedUser = await users.insertOne(userData);
    const token = jwt.sign({ userId: generatedUserId }, sanitizedEmail, {
      expiresIn: "24h",
    });

    res.status(201).json({ token, userId: generatedUserId });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ error: "❌ Signup failed" });
  }
});

// 📌 USER LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const database = client.db("gym-data");
    const users = database.collection("users");

    const user = await users.findOne({ email });
    if (!user) return res.status(400).send("❌ Invalid Credentials");

    const correctPassword = await bcrypt.compare(password, user.hashed_password);
    if (!correctPassword) return res.status(400).send("❌ Invalid Credentials");

    const token = jwt.sign({ userId: user.user_id }, email, { expiresIn: "24h" });
    res.status(200).json({ token, userId: user.user_id });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "❌ Login failed" });
  }
});

// 📌 GET USERS
app.get("/users", async (req, res) => {
  try {
    const database = client.db("gym-data");
    const users = database.collection("users");
    const allUsers = await users.find().toArray();
    res.json(allUsers);
  } catch (error) {
    console.error("Fetch Users Error:", error);
    res.status(500).json({ error: "❌ Failed to retrieve users" });
  }
});

// 📌 UPDATE USER
app.put("/user", async (req, res) => {
  const formData = req.body.formData;

  try {
    const database = client.db("gym-data");
    const users = database.collection("users");

    const query = { user_id: formData.user_id };
    const updateDocument = {
      $set: {
        first_name: formData.first_name,
        dob_day: formData.dob_day,
        dob_month: formData.dob_month,
        dob_year: formData.dob_year,
        show_gender: formData.show_gender,
        gender_identity: formData.gender_identity,
        gender_interest: formData.gender_interest,
        url: formData.url,
        about: formData.about,
        matches: formData.matches,
      },
    };

    const updatedUser = await users.updateOne(query, updateDocument);
    res.json(updatedUser);
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({ error: "❌ Update failed" });
  }
});


// 📌 GET USER SCHEDULE
app.get("/schedule", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "❌ User ID is required" });
//"gym-data" is the name of the database collection
    const database = client.db("gym-data");
    const schedules = database.collection("schedules");

    const userSchedule = await schedules.findOne({ userId });
    if (!userSchedule) return res.status(404).json({ message: "❌ No schedule found" });

    res.json({ schedule: userSchedule.schedule });
  } catch (error) {
    console.error("Fetch Schedule Error:", error);
    res.status(500).json({ error: "❌ Failed to fetch schedule" });
  }
});

// 📌 SAVE OR UPDATE USER SCHEDULE
app.post("/schedule", async (req, res) => {
  try {
    const { userId, schedule } = req.body;
    if (!userId || !schedule || !Array.isArray(schedule))
      return res.status(400).json({ error: "❌ Invalid data format" });

    const database = client.db("gym-data");
    const schedules = database.collection("schedules");

    let userSchedule = await schedules.findOne({ userId });

    if (userSchedule) {
      await schedules.updateOne({ userId }, { $set: { schedule } });
    } else {
      await schedules.insertOne({ userId, schedule });
    }

    res.json({ message: "✅ Schedule saved successfully" });
  } catch (error) {
    console.error("Save Schedule Error:", error);
    res.status(500).json({ error: "❌ Failed to save schedule" });
  }
});

// 📌 SERVER START
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server running on PORT ${PORT}`));
