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
      <html>
      <head>
        <title>User Details</title>
        <style>
          body {
            font-family: Arial;
            background: #f4f4f4;
            text-align: center;
            padding: 50px;
          }
          .card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            display: inline-block;
            box-shadow: 0 0 10px rgba(0,0,0,0.2);
          }
          h2 { color: #333; }
          p { font-size: 18px; }
        </style>
      </head>
      <body>

        <div class="card">
          <h2>User Details</h2>
          <p><b>Name:</b> ${user.name}</p>
          <p><b>Email:</b> ${user.email}</p>
          <p><b>Mobile:</b> ${user.mobile}</p>
          <p><b>Address:</b> ${user.address}</p>
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
