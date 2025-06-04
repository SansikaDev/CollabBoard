const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const Board = require("./models/Board");

const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", async (roomId) => {
    socket.join(roomId);
    const board = await Board.findOne({ roomId });
    if (board) socket.emit("load-board", board.actions);
  });

  socket.on("draw", async ({ roomId, action }) => {
    socket.to(roomId).emit("draw", action);
    await Board.findOneAndUpdate(
      { roomId },
      { $push: { actions: action } },
      { upsert: true }
    );
  });

  socket.on("clear-board", async (roomId) => {
    await Board.findOneAndUpdate({ roomId }, { actions: [] });
    io.to(roomId).emit("clear-board");
  });
});

server.listen(5001, () => console.log("Server listening on port 5001"));
