const express = require("express");
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcrypt");
const app = express();
const mongoose = require('mongoose');
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowHeaders: ["Content-Type"],
    credentials: true,
  },
  transports: ["websocket", "polling"], // Ensure WebSocket is the primary transport
});

const users = {}; // In-memory user store
//This is where we keep track of all the users who register. Eventually, in a real-world app, this would be replaced by a database like MongoDB or MySQL, but for learning purposes, an in-memory store is easier to start with.

// connection to mongoDB
mongoose.connect('mongodb+srv://<snirajan>:<O6KmenTcjsTdbZ3h>@cluster0.oiw39.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,

})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// defining the message schema
const messageSchema = new mongoose.Schema({
  sender: String,   // User who sent the message
  content: String,  // The message text
  timestamp: { type: Date, default: Date.now }, // TIme the message was sent
  room: String,     // Room or channel if applicable
});

// message model
const Message = mongoose.model('Message', messageSchema);


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

  if (!registerUserName || !registerPassword) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  if (users[registerUserName]) {
    return res.status(400).json({ message: "User already exists" });
  }

  try {
    const hashedPassword = await bcrypt.hash(registerPassword, 10); // 10 is salt rounds, making the hashing process more secure
    users[registerUserName] = { password: hashedPassword, profile: {} };
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.log("Error hashing password:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/login", async (req, res) => {
  const { loginUserName, loginPassword } = req.body;
  console.log("Received login request:", loginUserName, loginPassword);
  const user = users[loginUserName];
  if (!user || !(await bcrypt.compare(loginPassword, user.password))) {
    return res.status(400).json({ message: "Invalid username or password" });
  }
  req.session.user = loginUserName;
  console.log("Login successful for user:", loginUserName);
  res.json({ message: "Logged in successfully", profile: user.profile });
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

  socket.on('message', async (msg) => {
    console.log("Received message: " + JSON.stringify(msg)); // Log received message
    const message = new Message({
      sender: socket.user, 
      content: msg.text,
      room: 'general',
    });

    await message.save();    // saving the message to the database


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
