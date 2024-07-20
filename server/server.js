const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowHeaders: ["my-custom-header"],
    credentials: true
  },
  transports: ['websocket', 'polling'] // Ensure WebSocket is the primary transport
});

const users = {}; // In-memory user store

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

app.use(express.json());
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: false
}));

app.post('/register', async (req, res) => {
  const {userName, password} = req.body;
  if (users[userName]){
    return res.status(400).json({message: 'User already exists'});
  }
  const hashedPassword = await bcrypt.hash(password, 10); // 10 is salt rounds, making the hashing process more secure
  users[username] = {password: hashedPassword};
  res.status(201).json({message: 'User registered successfully'});
})

app.post('/login', async (req, res) => {
  const {userName, password} = req.body;
  const user = users[userName];
  if (!user || !(await bcrypt.compare(password, user.password))) { 
    return res.status(400).json({message: 'Invalid username or password'});
  }
  req.session.user = username;
  res.json({message: 'Logged in successfully'});
});

app.get('/', (req, res) => {
  res.send('Server is running');
});

io.on('connection', (socket) => {
  console.log('A user connected: ' + socket.id); // Log connection

  socket.on('message', (msg) => {
    console.log('Received message: ' + JSON.stringify(msg)); // Log received message
    io.emit('message', msg); // Broadcast message to all clients
  });

  socket.on('disconnect', () => {
    console.log('User disconnected: ' + socket.id); // Log disconnection
  }); 
});

const PORT = process.env.PORT || 5000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
