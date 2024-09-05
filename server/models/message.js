const mongoose = require('mongoose');

// defining the message schema
const messageSchema = new mongoose.Schema({
    sender: String,   // User who sent the message
    content: String,  // The message text
    timestamp: { type: Date, default: Date.now }, // TIme the message was sent
    room: String,     // Room or channel if applicable
  });
  
  // message model
  const Message = mongoose.model('Message', messageSchema);

  module.exports = Message;