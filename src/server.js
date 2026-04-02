const mongoose = require("mongoose");
const app = require("./app");
require("dotenv").config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("🟢 DB Connected Successfully");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("🔴 DB Connection Error:", err);
    process.exit(1);
  });
