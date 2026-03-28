require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");
var db = require("./db.js");
const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(cors());

// 👉 IMPORTANT: change this after deploy
const BASE_URL = "https://qr-code-3b7m.onrender.com"; 

const PORT = 3000;

// MySQL connection

db.connect(err => {
  if (err) {
    console.log("DB Error:", err);
    return;
  }
  console.log("✅ MySQL Connected");
});


app.get("/",function(req,res){
    res.render("home.ejs")
})


// 🔥 Submit Form + Store + QR Generate
app.post("/submit", async (req, res) => {
  try {
    const { name, email, mobile, address } = req.body;

    if (!name || !email || !mobile || !address) {
      return res.status(400).json({ message: "All fields required" });
    }

    const id = uuidv4();

    const sql = `
      INSERT INTO user (id,name, email, mobile, address)
      VALUES (?, ?, ?, ?,?)
    `;

    db.query(sql, [id,name, email, mobile, address], async (err) => {
      if (err) {
        console.log(err);
        return res.status(500).send("Database Error");
      }

      // 👉 IMPORTANT: using BASE_URL (not localhost)
      const url = `${BASE_URL}/view/${id}`;

      const qr = await QRCode.toDataURL(url);

      res.json({
        success: true,
        qr,
        url
      });
    });

  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
});


// 🔥 View Data (QR Scan Page)
app.get("/view/:id", (req, res) => {
  const id = req.params.id;
    db.query("SELECT * FROM user WHERE id = ?", [id], (err, result) => {

  if (err) {
    console.log("❌ DB ERROR:", err);   // 👉 terminal मध्ये full error दिसेल
    return res.send("<h2>Database Error</h2>");
  }

  console.log("Result:", result); // 👉 data check

  if (!result || result.length === 0) {
    return res.send("<h2>No Data Found</h2>");
  }


    const user = result[0];

     res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>User Profile</title>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Segoe UI', sans-serif;
    }

    body {
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #667eea, #764ba2);
    }

    .card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(15px);
      border-radius: 20px;
      padding: 30px 40px;
      width: 350px;
      color: white;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      text-align: left;
      transition: 0.3s;
    }

    .card:hover {
      transform: scale(1.05);
    }

    .title {
      text-align: center;
      margin-bottom: 20px;
    }

    .title h2 {
      font-size: 28px;
      letter-spacing: 1px;
    }

    .info {
      margin: 15px 0;
      font-size: 18px;
      display: flex;
      align-items: center;
    }

    .info i {
      margin-right: 10px;
      color: #ffd369;
    }

    .footer {
      margin-top: 20px;
      text-align: center;
      font-size: 14px;
      opacity: 0.8;
    }

  </style>
</head>

<body>

  <div class="card">
    <div class="title">
      <h2><i class="fa-solid fa-user"></i> User Profile</h2>
    </div>

    <div class="info">
      <i class="fa-solid fa-user"></i>
      <span><b>Name:</b> ${user.name}</span>
    </div>

    <div class="info">
      <i class="fa-solid fa-envelope"></i>
      <span><b>Email:</b> ${user.email}</span>
    </div>

    <div class="info">
      <i class="fa-solid fa-location-dot"></i>
      <span><b>Address:</b> ${user.address}</span>
    </div>

    <div class="footer">
      © 2026 Your Company
    </div>
  </div>

</body>
</html>
    `);
  });
});

// 🔥 Server Start
app.listen(PORT, () => {
  console.log(`🚀 Server running on ${BASE_URL}`);
});
