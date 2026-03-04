const express = require("express");
const cors = require("cors");
const identifyRoute = require("./routes/identify");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/", identifyRoute);

app.get("/", (req, res) => {
    res.send("Bitespeed API Running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});