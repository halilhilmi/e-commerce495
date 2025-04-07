import app from "./app";
import dotenv from "dotenv";
import connectDatabase from "./utils/db";

dotenv.config();

(async () => {
  try {
    const connected = await connectDatabase();
    if (connected) {
      console.log("Database connected successfully");
    } else {
      console.error("Failed to connect to database");
    }
  } catch (error) {
    console.error("Database connection error:", error);
  }
})();

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.SERVER_PORT || 3006;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
