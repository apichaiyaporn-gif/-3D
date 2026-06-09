require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const LIFF_ID = process.env.LIFF_ID;

if (!MONGO_URI) {
  console.error("Missing MONGO_URI");
  process.exit(1);
}

/* MongoDB */
mongoose.connect(MONGO_URI);

const Vote = mongoose.model("Vote", new mongoose.Schema({
  userId: { type: String, unique: true },
  choice: String,
  createdAt: { type: Date, default: Date.now }
}));

/* API */
app.post("/vote", async (req, res) => {
  const { userId, choice } = req.body;

  if (!userId || !choice) return res.json({ message: "missing" });

  const exists = await Vote.findOne({ userId });
  if (exists) return res.json({ message: "already voted" });

  await Vote.create({ userId, choice });
  res.json({ message: "success" });
});

app.get("/check/:userId", async (req, res) => {
  const exists = await Vote.findOne({ userId: req.params.userId });
  res.json({ hasVoted: !!exists });
});

app.get("/results", async (req, res) => {
  const data = await Vote.aggregate([
    { $group: { _id: "$choice", count: { $sum: 1 } } }
  ]);

  const result = {};
  data.forEach(d => result[d._id] = d.count);
  res.json(result);
});

/* Frontend */
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<script src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>
</head>
<body style="text-align:center;font-family:sans-serif">
<h2>Vote</h2>
<button onclick="vote('A')">A</button>
<button onclick="vote('B')">B</button>
<button onclick="vote('C')">C</button>
<p id="msg"></p>
<h3>Results</h3>
<div id="result"></div>

<script>
const LIFF_ID = "${process.env.LIFF_ID || "2009926561-03nVgfb6"}";
let userId = null;

async function init() {
  await liff.init({ liffId: LIFF_ID });
  if (!liff.isLoggedIn()) { liff.login(); return; }
  const profile = await liff.getProfile();
  userId = profile.userId;
  load();
}

async function vote(choice) {
  const res = await fetch("/vote", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({ userId, choice })
  });
  const data = await res.json();
  document.getElementById("msg").innerText = data.message;
  load();
}

async function load() {
  const res = await fetch("/results");
  const data = await res.json();
  let html="";
  for (let k in data) html += k + ": " + data[k] + "<br>";
  document.getElementById("result").innerHTML = html;
}

init();
</script>
</body>
</html>
`);
});

/* Export for Vercel */
module.exports = app;

/* Local run */
if (require.main === module) {
  app.listen(PORT, () => console.log("http://localhost:" + PORT));
}
