const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("node:path");

const { connectDatabase } = require("./src/config/db");
const routes = require("./src/routes");
const { notFoundHandler, errorHandler } = require("./src/middlewares/error.middleware");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ message: "Server is running" });
});

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server started on port ${PORT}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
