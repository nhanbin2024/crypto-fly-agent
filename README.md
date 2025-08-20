# 🚀 Crypto Fly Agent

FastAPI service to get real-time cryptocurrency prices using **CoinGecko API**.  
Includes endpoints for fetching coin price by symbol and top 100 coins by market cap.  

---

## 🌐 Demo (Railway)
👉 [Crypto Fly Agent on Railway](https://crypto-fly-agent-production-6cdc.up.railway.app)  

---

## ⚡ Features
- ✅ Get coin price by symbol  
- ✅ Get top 100 coins by market cap  
- ✅ Built with FastAPI + httpx + cache  

---

## 🔗 API Endpoints

### 1. Get coin price by symbol
```
GET /coin/{symbol}
```
**Example:**  
```
/coin/bitcoin
```

---

### 2. Get top 100 coins
```
GET /coins
```

---

## 🛠️ Local Development

### Install dependencies
```bash
pip install -r requirements.txt
```

### Run server
```bash
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

App sẽ chạy ở: [http://localhost:8000](http://localhost:8000)

---

## ⚙️ MCP Server Config

Nếu bạn muốn chạy trong MCP client:

```json
{
  "mcpServers": {
    "crypto-fly-agent": {
      "command": "python",
      "args": ["server.py"]
    }
  }
}
```

---

## 📄 License
MIT
