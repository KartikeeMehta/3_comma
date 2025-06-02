const express = require("express");
const router = express.Router();
const axios = require("axios");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");

const API_BASE = "https://api.3commas.io";

function getSignature(path) {
  return crypto
    .createHmac("sha256", process.env.THREE_COMMA_API_SECRET)
    .update(path)
    .digest("hex");
}

// Create a new bot
router.post(
  "/create-bot",
  [
    body("name").notEmpty(),
    body("account_id").notEmpty(),
    body("pair").notEmpty(),
    body("base_order_volume").isNumeric(),
    body("safety_order_volume").isNumeric(),
    body("safety_order_step_percentage").isNumeric(),
    body("max_safety_orders").isNumeric(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const botConfig = {
        name: req.body.name,
        account_id: req.body.account_id,
        pair: req.body.pair,
        base_order_volume: req.body.base_order_volume,
        safety_order_volume: req.body.safety_order_volume,
        safety_order_step_percentage: req.body.safety_order_step_percentage,
        max_safety_orders: req.body.max_safety_orders,
        active: true,
      };
      const path = "/public/api/ver1/bots";
      const signature = getSignature(path);
      const response = await axios.post(API_BASE + path, botConfig, {
        headers: {
          APIKEY: process.env.THREE_COMMA_API_KEY,
          Signature: signature,
        },
      });
      res.json({
        success: true,
        message: "Bot created successfully",
        data: response.data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to create bot",
        error: error.response ? error.response.data : error.message,
      });
    }
  }
);

// Get all bots
router.get("/bots", async (req, res) => {
  try {
    const path = "/public/api/ver1/bots";
    const signature = getSignature(path);
    const response = await axios.get(API_BASE + path, {
      headers: {
        APIKEY: process.env.THREE_COMMA_API_KEY,
        Signature: signature,
      },
    });
    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch bots",
      error: error.response ? error.response.data : error.message,
    });
  }
});

// Get bot details
router.get("/bots/:id", async (req, res) => {
  try {
    const path = `/public/api/ver1/bots/${req.params.id}`;
    const signature = getSignature(path);
    const response = await axios.get(API_BASE + path, {
      headers: {
        APIKEY: process.env.THREE_COMMA_API_KEY,
        Signature: signature,
      },
    });
    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch bot details",
      error: error.response ? error.response.data : error.message,
    });
  }
});

// Start/Stop bot
router.post("/bots/:id/:action", async (req, res) => {
  try {
    const { id, action } = req.params;
    if (!["start", "stop"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Use start or stop",
      });
    }
    const path = `/public/api/ver1/bots/${id}/${action}`;
    const signature = getSignature(path);
    const response = await axios.post(
      API_BASE + path,
      {},
      {
        headers: {
          APIKEY: process.env.THREE_COMMA_API_KEY,
          Signature: signature,
        },
      }
    );
    res.json({
      success: true,
      message: `Bot ${action}ed successfully`,
      data: response.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to ${req.params.action} bot`,
      error: error.response ? error.response.data : error.message,
    });
  }
});

// Get connected accounts
router.get("/accounts", async (req, res) => {
  try {
    const path = "/public/api/ver1/accounts";
    const signature = getSignature(path);
    const response = await axios.get(API_BASE + path, {
      headers: {
        APIKEY: process.env.THREE_COMMA_API_KEY,
        Signature: signature,
      },
    });
    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error(
      "3Commas /accounts error:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({
      success: false,
      message: "Failed to fetch accounts",
      error: error.response ? error.response.data : error.message,
    });
  }
});

module.exports = router;
