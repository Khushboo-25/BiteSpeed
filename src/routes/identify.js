const express = require("express");
const router = express.Router();

router.post("/identify", async (req, res) => {

    const { email, phoneNumber } = req.body;

    res.json({
        message: "Identify endpoint working",
        email,
        phoneNumber
    });

});

module.exports = router;