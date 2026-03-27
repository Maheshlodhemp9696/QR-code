const mysql = require("mysql2");
require("dotenv").config();

// 🔥 Create MySQL Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "root",
  database: process.env.DB_NAME || "Ready_material",
  port: process.env.DB_PORT || 3306
});

// 🔥 Connect to Database
db.connect((err) => {
  if (err) {
    console.error("❌ MySQL Connection Failed:", err.message);
    process.exit(1); // stop server if DB fails
  }
  console.log("✅ MySQL Connected Successfully");
});

// 🔥 Optional: Handle disconnect (auto reconnect)
db.on("error", (err) => {
  console.error("❌ DB Error:", err);

  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    console.log("🔄 Reconnecting to DB...");
    db.connect();
  } else {
    throw err;
  }
});

// 🔥 Export DB
module.exports = db;