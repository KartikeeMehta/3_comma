const express = require("express");
const router = express.Router();
const axios = require("axios");
const { body, validationResult } = require("express-validator");

// Initialize 3Comma API client
const threeCommaClient = axios.create({
  baseURL: "https://api.3commas.io/public/api",
  headers: {
    APIKEY: process.env.THREE_COMMA_API_KEY,
    Signature: process.env.THREE_COMMA_API_SECRET,
  },
});

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

      // Accept and log Binance API credentials for future use
      const { binanceApiKey, binanceApiSecret } = req.body;
      if (binanceApiKey && binanceApiSecret) {
        console.log("Received Binance API credentials for bot creation.");
        // You can use these credentials as needed for 3Commas API
      }

      const response = await threeCommaClient.post("/v1/bots", botConfig);

      res.json({
        success: true,
        message: "Bot created successfully",
        data: response.data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to create bot",
        error: error.message,
      });
    }
  }
);

// Get all bots
router.get("/bots", async (req, res) => {
  try {
    const response = await threeCommaClient.get("/v1/bots");
    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch bots",
      error: error.message,
    });
  }
});

// Get bot details
router.get("/bots/:id", async (req, res) => {
  try {
    const response = await threeCommaClient.get(`/v1/bots/${req.params.id}`);
    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch bot details",
      error: error.message,
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

    const response = await threeCommaClient.post(`/v1/bots/${id}/${action}`);
    res.json({
      success: true,
      message: `Bot ${action}ed successfully`,
      data: response.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to ${req.params.action} bot`,
      error: error.message,
    });
  }
});

module.exports = router;
