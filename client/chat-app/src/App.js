import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./App.css";

const socket = io("http://localhost:5000", {
  transports: ["websocket", "polling"],
  withCredentials: true,
});

function App() {
  // main react component
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  const [registerUserName, setRegisterUserName] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const [loginUserName, setLoginUserName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [profile, setProfile] = useState({ displayName: " ", bio: "" });
  const [loggedIn, setLoggedIn] = useState(false);
  const chatBoxRef = useRef(null);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server with ID: " + socket.id); // Log connection
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });

    socket.on("message", (message) => {
      console.log("Received message: " + JSON.stringify(message)); // Log received message
      setMessages((prevMessages) => [...(prevMessages || []), message]);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    return () => {
      socket.off("message");
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
    };
  }, []);

  // Auto-scrolling effect
  useEffect(() => {
    if (chatBoxRef.current){
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  // useEffect(() => {
  //   socket.on("message", (message) => {
  //     console.log("Received message: " + JSON.stringify(message));
  //     setMessages((prevMessages) => [...(prevMessages || []), message]);
  //   });

  //   return () => {
  //     socket.off("message");
  //   };
  // }, []);

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        text: message,
        timestamp: new Date().toLocaleTimeString(),
      };
      console.log("Sending message: " + JSON.stringify(newMessage)); // Log sending message

      socket.emit("message", newMessage);
      setMessages((prevMessages) => [...(prevMessages || []), newMessage]);
      setMessage("");
    }
  };

  const register = async () => {
    console.log("Registering with:", registerUserName, registerPassword);
    try {
      const response = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registerUserName, registerPassword }),
      });
      if (response.ok) {
        alert("Registered successfully");

        // Clearing the input fields after successful registration
        setRegisterUserName("");
        setRegisterPassword("");
      } else {
        const data = await response.json();
        console.log("Registration failed", data);
        alert("Registeration failed");
      }
    } catch (error) {
      console.error("Error during registration:", error);
      alert("Registration failed due to network error");
    }
  };

  const login = async () => {
    console.log("Logging in with:", loginUserName, loginPassword);
    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginUserName, loginPassword }),
      });
      if (response.ok) {
        const data = await response.json();
        setLoggedIn(true);
        setProfile(data.profile);
        setMessages(data.messages || []); // Loading the messages from the server
        
      } else {
        const data = await response.json();
        alert(data.message);
      }
    } catch (error) {
      console.log("Error during login:", error);
      alert("Login failed due to network error");
    }
  };


  const updateProfile = async () => {
    console.log("updating profile for:", loginUserName);
    try {
      const response = await fetch("http://localhost:5000/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginUserName, profile }),
      });
      if (response.ok) {
        alert("Profile updated successfully");
      } else {
        const data = await response.json();
        alert(data.message);
      }
    } catch (error) {
      console.log("Error during profile update:", error);
      alert("Failed to update profile due to network error");
    }
  };

  const logout = () => {
    setLoggedIn(false);
    setMessages([]);
    setProfile({ displayName: "", bio: ""});
    setLoginUserName("");
    setLoginPassword("");
  };

  return (
    <div className="App">
      {!loggedIn ? (
        <div className="auth-container">
          <h2>Register</h2>
          <input
            type="text"
            value={registerUserName}
            onChange={(e) => setRegisterUserName(e.target.value)}
            placeholder="Username"
          />
          <input
            type="password"
            value={registerPassword}
            onChange={(e) => setRegisterPassword(e.target.value)}
            placeholder="Password"
          />
          <button onClick={register}>Register</button>

          <h2>Login</h2>
          <input
            type="text"
            value={loginUserName}
            onChange={(e) => setLoginUserName(e.target.value)}
            placeholder="Username"
          />
          <input
            type="password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            placeholder="Password"
          />
          <button onClick={login}>Login</button>
        </div>
      ) : (
        <>
          <header className="App-header">
            <h1>Chat Application</h1>
            <h2>Hello, {profile.displayName || loginUserName}!</h2> {/* Greeting the user*/}
          </header>

          <div className="chat-box" ref={chatBoxRef}>
            {messages && messages.map((msg, index) => (
              <div key={index} className="message">
                <span className="message-text">{msg.text}</span>
                <span className="message-timestamp">{msg.timestamp}</span>
              </div>
            ))}
          </div>

          <div className="input-area">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage}>Send</button>
          </div>

          <div className="profile">
            <h2>Profile</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault(); // Prevent page reload on form submit
                updateProfile();
              }}
            >
              <input
                type="text"
                value={profile.displayName}
                onChange={(e) =>
                  setProfile({ ...profile, displayName: e.target.value })
                }
                placeholder="Display Name"
              />
              <input
                type="text"
                value={profile.bio}
                onChange={(e) =>
                  setProfile({ ...profile, bio: e.target.value })
                }
                placeholder="Bio"
              />
              <button type="submit">Update Profile</button>
            </form>
          </div>

          <div className="footer">
            <button onClick={logout}>Logout</button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
