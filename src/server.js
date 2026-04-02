const app = require("./app");
const connectDB = require("./utils/db");
require("dotenv").config();

const PORT = process.env.PORT || 5000;

/**
 * Bootstrapping the application for local execution.
 * The DB connection is handled by the middleware in app.js, 
 * but we call it here to ensure the server only listens 
 * once the initial connection is verified.
 */
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.info(`🚀 [SYSTEM]: Advocate Portfolio Backend Active on Port ${PORT}`);
      console.info(`🔗 [LOCAL]: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("🔴 [CRITICAL]: System bootstrap failed.", err.message);
    process.exit(1);
  });

