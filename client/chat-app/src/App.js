import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:5000',{
  transports: ['websocket', 'polling'],
  withCredentials: true
});

function App() {                                  // main react component
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const chatBoxRef = useRef(null);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server with ID: ' + socket.id); // Log connection
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    socket.on('message', (message) => {
      console.log('Received message: ' + JSON.stringify(message)); // Log received message
      setMessages((prevMessages) => [...prevMessages, message]);

    });
    
      socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });

    return () => {
      socket.off('message');
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
    };
  }, []);

  useEffect(() => {
    if (chatBoxRef.current){
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    } //The useEffect hook with chatBoxRef.current.scrollTop ensures that the chat box scrolls to the bottom whenever a new message is added.
    
  }, [messages]);

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        text: message,
        timestamp: new Date().toLocaleTimeString(),
      };
      console.log('Sending message: ' + JSON.stringify(newMessage)); // Log sending message
      socket.emit('message', newMessage);
      setMessage('');
    }
  };

  const register = async () => {
    const response = await fetch('http://localhost:5000/register', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({userName, password})
    });
    if(response.ok){
      alert('Registered successfully');
    } else{
      alert('Registeration failed');
    }
  };

  const login = async () => {
    const response = await fetch('http://localhost:5000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName, password })
    });
    if (response.ok) {
      setLoggedIn(true);
    } else {
      alert('Login failed');
    }
  };


  return (

    <div className="App">
      {!loggedIn ? (
        <div className="auth-container">
          <h2>Register</h2>
          <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Username"/>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder= "Password" />
          <button onClick={register}>Register</button>

          <h2>Login</h2>
          <button onClick={login}>Login</button>
          </div>      
          ) : ( 

            <>
      <header className = "App-header">
        <h1>Chat Application</h1>
      </header>

      <div className="chat-box" ref={chatBoxRef}>
        {messages.map((msg, index) => (
          <div key={index} className="message">
              <span className="message-text">{msg.text}</span>
              <span className="message-timestamp">{msg.timestamp}</span>

          </div>
        ))}
      </div>

      <div className ="input-area">

      <input 
        type="text" 
        value={message} 
        onChange={(e) => setMessage(e.target.value)} 
        placeholder="Type a message..."
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  </>
  )}
  </div>
  );
}

export default App;
