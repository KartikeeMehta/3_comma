const express = require("express");
const router = express.Router();
const Binance = require("node-binance-api");
const { body, validationResult } = require("express-validator");

// Helper function to handle Binance API errors
function handleBinanceError(error) {
  console.error("Binance API error:", error);

  // Handle specific Binance error codes
  if (error.code) {
    switch (error.code) {
      case -2015:
        return {
          message:
            "Invalid API credentials. Please check your API key and secret, and ensure they have the correct permissions.",
          details:
            "The API key might be invalid, or it doesn't have the required permissions for reading account information.",
        };
      case -2014:
        return {
          message: "API key is not enabled for this IP address.",
          details:
            "Please enable API access for your server's IP address in your Binance account settings.",
        };
      case -2013:
        return {
          message: "Invalid API key format.",
          details: "Please check that your API key is correctly formatted.",
        };
      default:
        return {
          message: `Binance API error: ${error.msg || error.message}`,
          details: `Error code: ${error.code}`,
        };
    }
  }

  return {
    message: "Failed to connect to Binance",
    details: error.message || "Unknown error occurred",
  };
}

// Connect Binance wallet
router.post(
  "/connect",
  [
    body("apiKey").notEmpty().withMessage("API Key is required"),
    body("apiSecret").notEmpty().withMessage("API Secret is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { apiKey, apiSecret } = req.body;

      // Test connection with provided credentials
      const testBinance = new Binance().options({
        APIKEY: apiKey,
        APISECRET: apiSecret,
        useServerTime: true,
        recvWindow: 60000,
        verbose: true,
        testnet: false, // Set to true if you want to use testnet
      });

      try {
        // Test the connection by getting account info
        const accountInfo = await testBinance.account();

        if (!accountInfo || !accountInfo.balances) {
          throw new Error("Failed to get account information");
        }

        // Store the credentials in environment variables for future use
        process.env.BINANCE_API_KEY = apiKey;
        process.env.BINANCE_API_SECRET = apiSecret;

        res.json({
          success: true,
          message: "Binance wallet connected successfully",
          data: accountInfo,
        });
      } catch (binanceError) {
        const errorInfo = handleBinanceError(binanceError);
        res.status(500).json({
          success: false,
          message: errorInfo.message,
          details: errorInfo.details,
          error: binanceError,
        });
      }
    } catch (error) {
      console.error("Binance connection error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to connect Binance wallet",
        details: error.message || "Unknown error occurred",
      });
    }
  }
);

// Get account balance
router.get("/balance", async (req, res) => {
  try {
    if (!process.env.BINANCE_API_KEY || !process.env.BINANCE_API_SECRET) {
      return res.status(401).json({
        success: false,
        message: "Binance wallet not connected",
      });
    }

    const binance = new Binance().options({
      APIKEY: process.env.BINANCE_API_KEY,
      APISECRET: process.env.BINANCE_API_SECRET,
      useServerTime: true,
      recvWindow: 60000,
    });

    try {
      const accountInfo = await binance.account();

      if (!accountInfo || !accountInfo.balances) {
        throw new Error("Failed to get account information");
      }

      res.json({
        success: true,
        data: {
          balances: accountInfo.balances,
        },
      });
    } catch (binanceError) {
      const errorInfo = handleBinanceError(binanceError);
      res.status(500).json({
        success: false,
        message: errorInfo.message,
        details: errorInfo.details,
        error: binanceError,
      });
    }
  } catch (error) {
    console.error("Balance fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch balance",
      details: error.message || "Unknown error occurred",
    });
  }
});

// Get trading pairs
router.get("/trading-pairs", async (req, res) => {
  try {
    if (!process.env.BINANCE_API_KEY || !process.env.BINANCE_API_SECRET) {
      return res.status(401).json({
        success: false,
        message: "Binance wallet not connected",
      });
    }

    const binance = new Binance().options({
      APIKEY: process.env.BINANCE_API_KEY,
      APISECRET: process.env.BINANCE_API_SECRET,
      useServerTime: true,
      recvWindow: 60000,
    });

    try {
      const exchangeInfo = await binance.exchangeInfo();

      if (!exchangeInfo || !exchangeInfo.symbols) {
        throw new Error("Failed to get exchange information");
      }

      res.json({
        success: true,
        data: {
          symbols: exchangeInfo.symbols,
        },
      });
    } catch (binanceError) {
      const errorInfo = handleBinanceError(binanceError);
      res.status(500).json({
        success: false,
        message: errorInfo.message,
        details: errorInfo.details,
        error: binanceError,
      });
    }
  } catch (error) {
    console.error("Trading pairs fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch trading pairs",
      details: error.message || "Unknown error occurred",
    });
  }
});

module.exports = router;
