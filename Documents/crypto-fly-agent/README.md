# 🚀 Crypto Fly Agent

FastAPI service for real-time cryptocurrency prices using the CoinGecko API.  
Deployable on **Fly.io free tier**.

---

## 📖 Features
- Get price of any coin (BTC, ETH, SOL, etc.)
- Get top 100 coins by market cap
- FastAPI + Uvicorn + Docker
- Deployable on Fly.io free

---

## 🔧 Endpoints

### ✅ Get price of a specific coin
```
GET /coin/{symbol}
```
Example:
```
/coin/bitcoin
```
Response:
```json
{
  "bitcoin": {
    "usd": 67432
  }
}
```

### ✅ Get top 100 coins
```
GET /coins
```

---

## 🚀 Run locally
```bash
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000
```

---

## ☁️ Deploy on Fly.io
```bash
flyctl launch
flyctl deploy
```
Service will be available at:
```
https://crypto-fly-agent.fly.dev/coin/bitcoin
https://crypto-fly-agent.fly.dev/coins
```
