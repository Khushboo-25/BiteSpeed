const express = require("express");
const cors = require("cors");
const identifyRoute = require("./routes/identify");

const app = express();
const path = require("path");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname,"../public")));


app.use("/", identifyRoute);


app.get("/", (req, res) => {
    res.send("Bitespeed API Running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});