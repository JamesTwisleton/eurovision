import http from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = http.createServer(handler);

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Make io accessible to API routes via global
  // @ts-expect-error - global is not typed for io
  global.io = io;

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join global room for scoreboard updates
    socket.join("room:global");

    // Join a specific watch party room
    socket.on("join_party", (partyKey) => {
      socket.join(`room:party_${partyKey}`);
      console.log(`${socket.id} joined room:party_${partyKey}`);
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
