// Webflow Integration Script
class WebflowIntegration {
  constructor() {
    this.API_BASE_URL = window.location.origin + "/api";
    this.binanceApiKey = null;
    this.binanceApiSecret = null;
    this.setupEventListeners();
    this.debugLog("Integration initialized", "info");
    this.populateAccountDropdown();
  }

  setupEventListeners() {
    // Binance Connect Button
    const binanceConnectBtn = document.querySelector("#binance-connect");
    if (binanceConnectBtn) {
      binanceConnectBtn.addEventListener("click", () => this.connectBinance());
      this.debugLog("Binance connect button initialized", "info");
    }

    // 3Comma Bot Creation Form
    const botCreationForm = document.querySelector("#bot-creation-form");
    if (botCreationForm) {
      botCreationForm.addEventListener("submit", (e) => this.createBot(e));
      this.debugLog("Bot creation form initialized", "info");
    }
  }

  debugLog(message, type = "info") {
    if (typeof window.debugLog === "function") {
      window.debugLog(message, type);
    }
  }

  async connectBinance() {
    try {
      const apiKey = document.querySelector("#binance-api-key").value;
      const apiSecret = document.querySelector("#binance-api-secret").value;

      if (!apiKey || !apiSecret) {
        this.debugLog("API Key and Secret are required", "error");
        this.showNotification("Please enter both API Key and Secret", "error");
        return;
      }

      this.debugLog("Attempting to connect to Binance...", "info");

      const response = await fetch(`${this.API_BASE_URL}/binance/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ apiKey, apiSecret }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.details ||
          data.message ||
          `HTTP error! status: ${response.status}`;
        this.debugLog(`Binance connection error: ${errorMessage}`, "error");
        this.showNotification(errorMessage, "error");
        return;
      }

      if (data.success) {
        this.binanceApiKey = apiKey;
        this.binanceApiSecret = apiSecret;
        this.debugLog("Binance wallet connected successfully", "success");
        this.showNotification(
          "Binance wallet connected successfully!",
          "success"
        );
        this.updateAccountInfoDisplay(data.data);
        this.updateBalanceDisplay(data.data.balances);
        this.updateBotsList();
      } else {
        const errorMessage =
          data.details || data.message || "Failed to connect Binance wallet";
        this.debugLog(
          `Failed to connect Binance wallet: ${errorMessage}`,
          "error"
        );
        this.showNotification(errorMessage, "error");
      }
    } catch (error) {
      this.debugLog(`Binance connection error: ${error.message}`, "error");
      this.showNotification(
        error.message || "Error connecting to Binance",
        "error"
      );
      console.error("Binance connection error:", error);
    }
  }

  async createBot(e) {
    e.preventDefault();
    try {
      const formData = new FormData(e.target);
      const botConfig = {
        name: formData.get("bot-name"),
        account_id: formData.get("account-id"),
        pair: formData.get("trading-pair"),
        base_order_volume: parseFloat(formData.get("base-volume")),
        safety_order_volume: parseFloat(formData.get("safety-volume")),
        safety_order_step_percentage: parseFloat(
          formData.get("step-percentage")
        ),
        max_safety_orders: parseInt(formData.get("max-orders")),
        binanceApiKey: this.binanceApiKey,
        binanceApiSecret: this.binanceApiSecret,
      };

      this.debugLog("Attempting to create bot...", "info");

      const response = await fetch(`${this.API_BASE_URL}/3comma/create-bot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(botConfig),
      });

      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData) {
            if (Array.isArray(errorData.errors)) {
              errorMsg = errorData.errors.map((e) => e.msg).join("; ");
            } else if (
              typeof errorData.error === "string" ||
              typeof errorData.message === "string"
            ) {
              errorMsg = errorData.error || errorData.message;
            } else if (typeof errorData.error === "object") {
              errorMsg = JSON.stringify(errorData.error);
            } else if (typeof errorData.errors === "object") {
              errorMsg = JSON.stringify(errorData.errors);
            } else {
              errorMsg = JSON.stringify(errorData);
            }
          }
        } catch (e) {}
        this.debugLog(`Bot creation error: ${errorMsg}`, "error");
        this.showNotification(errorMsg, "error");
        return;
      }

      const data = await response.json();

      if (data.success) {
        this.debugLog("Bot created successfully", "success");
        this.showNotification("Bot created successfully!", "success");
        this.updateBotsList();
      } else {
        this.debugLog("Failed to create bot", "error");
        this.showNotification("Failed to create bot", "error");
      }
    } catch (error) {
      let errorMsg =
        error && error.message ? error.message : JSON.stringify(error);
      this.debugLog(`Bot creation error: ${errorMsg}`, "error");
      this.showNotification(errorMsg, "error");
      console.error("Bot creation error:", error);
    }
  }

  async updateBalanceDisplay(balances) {
    const balanceContainer = document.querySelector("#balance-display");
    if (balanceContainer) {
      const nonZeroBalances = balances.filter(
        (b) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0
      );
      balanceContainer.innerHTML = nonZeroBalances
        .map(
          (balance) => `
                <div class="balance-item">
                    <span class="asset">${balance.asset}</span>
                    <span class="free">Free: ${balance.free}</span>
                    <span class="locked">Locked: ${balance.locked}</span>
                </div>
            `
        )
        .join("");
      this.debugLog(
        `Updated balance display with ${nonZeroBalances.length} non-zero balances`,
        "info"
      );
    }
  }

  async updateBotsList() {
    try {
      this.debugLog("Fetching bots list...", "info");
      const response = await fetch(`${this.API_BASE_URL}/3comma/bots`, {
        headers: {
          Accept: "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const botsContainer = document.querySelector("#bots-list");
        let bots = [];
        if (Array.isArray(data.data)) {
          bots = data.data;
        } else if (data.data && Array.isArray(data.data.bots)) {
          bots = data.data.bots;
        }
        if (botsContainer) {
          if (bots.length > 0) {
            botsContainer.innerHTML = bots
              .map(
                (bot) => `
                          <div class="bot-item">
                              <h3>${bot.name}</h3>
                              <p>Pair: ${bot.pair}</p>
                              <p>Status: ${
                                bot.active ? "Active" : "Inactive"
                              }</p>
                              <button onclick="webflowIntegration.toggleBot('${
                                bot.id
                              }', '${bot.active ? "stop" : "start"}')">
                                  ${bot.active ? "Stop" : "Start"}
                              </button>
                          </div>
                      `
              )
              .join("");
            this.debugLog(
              `Updated bots list with ${bots.length} bots`,
              "success"
            );
          } else {
            botsContainer.innerHTML = "<div>No bots found.</div>";
            this.debugLog("No bots found.", "info");
          }
        }
      }
    } catch (error) {
      this.debugLog(`Error updating bots list: ${error.message}`, "error");
      console.error("Error updating bots list:", error);
      this.showNotification("Error fetching bots list", "error");
    }
  }

  async toggleBot(botId, action) {
    try {
      this.debugLog(`Attempting to ${action} bot ${botId}...`, "info");
      const response = await fetch(
        `${this.API_BASE_URL}/3comma/bots/${botId}/${action}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        this.debugLog(`Bot ${action}ed successfully`, "success");
        this.showNotification(`Bot ${action}ed successfully!`, "success");
        this.updateBotsList();
      } else {
        this.debugLog(`Failed to ${action} bot`, "error");
        this.showNotification(`Failed to ${action} bot`, "error");
      }
    } catch (error) {
      this.debugLog(`Error ${action}ing bot: ${error.message}`, "error");
      this.showNotification(`Error ${action}ing bot`, "error");
      console.error("Bot toggle error:", error);
    }
  }

  showNotification(message, type) {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  updateAccountInfoDisplay(accountInfo) {
    const container = document.getElementById("account-info-display");
    if (!container || !accountInfo) return;
    container.innerHTML = `
      <div><strong>Account Type:</strong> ${accountInfo.accountType}</div>
      <div><strong>Maker Commission:</strong> ${
        accountInfo.makerCommission
      }</div>
      <div><strong>Taker Commission:</strong> ${
        accountInfo.takerCommission
      }</div>
      <div><strong>Buyer Commission:</strong> ${
        accountInfo.buyerCommission
      }</div>
      <div><strong>Seller Commission:</strong> ${
        accountInfo.sellerCommission
      }</div>
      <div><strong>Can Trade:</strong> ${accountInfo.canTrade}</div>
      <div><strong>Can Withdraw:</strong> ${accountInfo.canWithdraw}</div>
      <div><strong>Can Deposit:</strong> ${accountInfo.canDeposit}</div>
      <div><strong>Permissions:</strong> ${
        Array.isArray(accountInfo.permissions)
          ? accountInfo.permissions.join(", ")
          : accountInfo.permissions
      }</div>
      <div><strong>Update Time:</strong> ${
        accountInfo.updateTime
          ? new Date(accountInfo.updateTime).toLocaleString()
          : "N/A"
      }</div>
    `;
  }

  async populateAccountDropdown() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/3comma/accounts`, {
        headers: { Accept: "application/json" },
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        const select = document.getElementById("account-id-select");
        if (select) {
          select.innerHTML =
            '<option value="">Select Account</option>' +
            data.data
              .map(
                (acc) =>
                  `<option value="${acc.id}">${
                    acc.exchange_name || acc.name || acc.id
                  } (${acc.pretty_display_type || acc.market_code})</option>`
              )
              .join("");
        }
      }
    } catch (error) {
      this.debugLog(
        `Failed to fetch 3Commas accounts: ${error.message}`,
        "error"
      );
    }
  }

  async fetchWallet() {
    if (!this.binanceApiKey || !this.binanceApiSecret) return;
    try {
      const response = await fetch(`${this.API_BASE_URL}/binance/balance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          apiKey: this.binanceApiKey,
          apiSecret: this.binanceApiSecret,
        }),
      });
      const data = await response.json();
      if (data.success) {
        this.updateBalanceDisplay(data.data);
      } else {
        this.showNotification(
          data.message || "Failed to fetch wallet",
          "error"
        );
      }
    } catch (error) {
      this.showNotification(error.message, "error");
    }
  }

  async fetchTradingPairs() {
    if (!this.binanceApiKey || !this.binanceApiSecret) return;
    try {
      const response = await fetch(
        `${this.API_BASE_URL}/binance/trading-pairs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            apiKey: this.binanceApiKey,
            apiSecret: this.binanceApiSecret,
          }),
        }
      );
      const data = await response.json();
      if (data.success) {
        // You can use data.data to populate trading pairs dropdown if needed
      } else {
        this.showNotification(
          data.message || "Failed to fetch trading pairs",
          "error"
        );
      }
    } catch (error) {
      this.showNotification(error.message, "error");
    }
  }
}

// Initialize the integration
const webflowIntegration = new WebflowIntegration();
