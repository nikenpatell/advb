const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./utils/db");
const whatsappService = require("./services/whatsapp.service");
require("dotenv").config();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Link IO to services
whatsappService.setIO(io);

io.on("connection", (socket) => {
  console.log(`📡 [SOCKET]: Client connected (${socket.id})`);
  
  socket.on("disconnect", () => {
    console.log(`🚫 [SOCKET]: Client disconnected (${socket.id})`);
  });
});

/**
 * Bootstrapping the application for local execution.
 */
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.info(`🚀 [SYSTEM]: Advocate Portfolio Backend Active on Port ${PORT}`);
      console.info(`🔗 [LOCAL]: http://localhost:${PORT}`);
      whatsappService.initialize();
    });
  })
  .catch((err) => {
    console.error("🔴 [CRITICAL]: System bootstrap failed.", err.message);
    process.exit(1);
  });


