const express = require("express");
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcrypt");
const app = express();
const Message = require("./models/message");
const http = require("http").createServer(app);
const User = require("./models/User");
const mongoose = require("mongoose");
const io = require("socket.io")(http, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowHeaders: ["Content-Type"],
    credentials: true,
  },
  transports: ["websocket", "polling"], // Ensure WebSocket is the primary transport
});

// connection to mongoDB //
mongoose
  .connect(
    "mongodb+srv://snirajan:Maiyamaiya@cluster0.oiw39.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

app.post("/register", async (req, res) => {
  const { registerUserName, registerPassword } = req.body;
  console.log(
    "Received registration request:",
    registerUserName,
    registerPassword
  );

  try {
    // checks if the user already exists
    const existingUser = await User.findOne({ username: registerUserName });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // hash the password
    const hashedPassword = await bcrypt.hash(registerPassword, 10); // 10 is the salt rounds

    // create a new user object
    const newUser = new User({
      username: registerUserName,
      password: hashedPassword,
      profile: {
        displayName: registerUserName,
      },
    });

    // saves the user to the database
    await newUser.save();

    // sends a success response
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.log("Error during registration: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/login", async (req, res) => {
  const { loginUserName, loginPassword } = req.body;
  console.log("Received login request:", loginUserName, loginPassword);

  try {
    // finds the user in the database by username
    const user = await User.findOne({ username: loginUserName });

    // if user doesn't exist or password doesn't match, sends an error response
    if (!user || !(await bcrypt.compare(loginPassword, user.password))) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    // stores the logged-in user's username in the session
    req.session.user = loginUserName;
    console.log("Login successful for user:", loginUserName);

    // Fetch messages from MongoDB
    const messages = await Message.find({}).sort({ timestamp: 1}).exec(); // Fetches all messages

    console.log('Fetched messages:', messages);

    // sends back a successful response along with the user's profile
    res.json({
      message: "Logged in successfully",
      profile: user.profile,
      messages,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/profile", (req, res) => {
  const { userName, profile } = req.body;
  if (!users[userName]) {
    return res.status(400).json({ message: "User not found" });
  }
  users[userName].profile = profile;
  res.json({ message: "Profile updated successfully " });
});

app.get("/profile/:userName", (req, res) => {
  const { userName } = req.params;
  const user = users[userName];
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }
  res.json({ profile: user.profile });
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

io.on("connection", (socket) => {
  console.log("A user connected: " + socket.id); // Log connection

  socket.on("message", async (msg) => {
    console.log("Received message: " + JSON.stringify(msg)); // Log received message
    const message = new Message({
      sender: socket.user,
      content: msg.text,
      timestamp: new Date(),
      room: "general",
    });

    await message.save(); // saving the message to the database

    io.emit("message", msg); // Broadcast message to all connected clients
  });

  socket.on("disconnect", () => {
    console.log("User disconnected: " + socket.id); // Log disconnection
  });
});

const PORT = process.env.PORT || 5000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
