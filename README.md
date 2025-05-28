# Webflow Integration with Binance and 3Comma

This project provides a backend integration for Webflow websites to connect with Binance and 3Comma platforms.

## Features

- Binance wallet connection and data retrieval
- 3Comma bot creation and management
- RESTful API endpoints for Webflow integration

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Binance API credentials
- 3Comma API credentials
- Webflow API credentials

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/webflow_integration
   JWT_SECRET=your_jwt_secret_key
   BINANCE_API_KEY=your_binance_api_key
   BINANCE_API_SECRET=your_binance_api_secret
   THREE_COMMA_API_KEY=your_3comma_api_key
   THREE_COMMA_API_SECRET=your_3comma_api_secret
   WEBFLOW_API_KEY=your_webflow_api_key
   WEBFLOW_SITE_ID=your_webflow_site_id
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Binance Integration

- `POST /api/binance/connect` - Connect Binance wallet
- `GET /api/binance/balance` - Get account balance
- `GET /api/binance/trading-pairs` - Get available trading pairs

### 3Comma Integration

- `POST /api/3comma/create-bot` - Create a new trading bot
- `GET /api/3comma/bots` - Get all bots
- `GET /api/3comma/bots/:id` - Get bot details
- `POST /api/3comma/bots/:id/:action` - Start/Stop bot (action: start/stop)

## Webflow Integration

To integrate with Webflow:

1. Add custom code to your Webflow site
2. Use the API endpoints to connect Binance and create 3Comma bots
3. Implement the UI components for wallet connection and bot creation

## Security Considerations

- Always use HTTPS in production
- Store API keys securely
- Implement rate limiting
- Use proper authentication and authorization
- Validate all input data

## License

MIT
