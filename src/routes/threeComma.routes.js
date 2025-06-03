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
    body("binanceApiKey").notEmpty().withMessage("Binance API Key is required"),
    body("binanceApiSecret")
      .notEmpty()
      .withMessage("Binance API Secret is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      // Convert pair from 'ETH/USDT' to 'USDT_ETH' for 3Commas
      const frontendPair = req.body.pair;
      let pair = frontendPair;
      if (frontendPair && frontendPair.includes("/")) {
        const [base, quote] = frontendPair.split("/");
        pair = `${quote}_${base}`;
      }
      // Build a complete DCA bot payload for 3Commas
      const botConfig = {
        name: req.body.name,
        account_id: req.body.account_id,
        pairs: [pair],
        base_order_volume: req.body.base_order_volume,
        base_order_volume_type: "quote_currency",
        safety_order_volume: req.body.safety_order_volume,
        safety_order_volume_type: "quote_currency",
        take_profit: 1.5,
        take_profit_type: "total",
        strategy: "long",
        martingale_volume_coefficient: 1,
        martingale_step_coefficient: 1,
        max_safety_orders: req.body.max_safety_orders,
        safety_order_step_percentage: req.body.safety_order_step_percentage,
        max_active_deals: 1,
        safety_orders_count: req.body.max_safety_orders,
        start_order_type: "market",
        leverage_type: "not_specified",
        leverage_custom_value: null,
        stop_loss_percentage: null,
        cooldown: 0,
        min_volume_btc_24h: null,
        deal_start_delay_seconds: 0,
        disable_after_deals_count: null,
        allowed_deals_on_same_pair: 1,
        trailing_enabled: false,
        trailing_deviation: null,
        stop_loss_timeout_enabled: false,
        stop_loss_timeout_in_seconds: null,
        min_price: null,
        max_price: null,
        close_deals_timeout: null,
        step_volume_percentage: null,
        active: true,
      };
      // Extra logging for debugging
      console.log(
        "3Commas bot creation payload:",
        JSON.stringify(botConfig, null, 2)
      );
      const path = "/ver1/bots/create";
      const signature = getSignature(path);
      const headers = {
        APIKEY: process.env.THREE_COMMA_API_KEY,
        Signature: signature,
      };
      console.log("3Commas bot creation headers:", headers);
      const response = await axios.post(API_BASE + path, botConfig, {
        headers,
      });
      console.log("3Commas create bot response:", response.data);
      res.json({
        success: true,
        message: "Bot created successfully",
        data: response.data,
      });
    } catch (error) {
      console.error("Bot creation error (full object):", error);
      res.status(500).json({
        success: false,
        message: "Failed to create bot",
        error: error.response
          ? typeof error.response.data === "object"
            ? JSON.stringify(error.response.data)
            : error.response.data
          : error.message || JSON.stringify(error),
      });
    }
  }
);

// Get all bots
router.get("/bots", async (req, res) => {
  try {
    const path = "/ver1/bots";
    const signature = getSignature(path);
    const response = await axios.get(API_BASE + path, {
      headers: {
        APIKEY: process.env.THREE_COMMA_API_KEY,
        Signature: signature,
      },
    });
    console.log("3Commas bots list response:", response.data);
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
    console.log("3Commas accounts response:", response.data);
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
