from fastapi import FastAPI
import requests

app = FastAPI(title="Crypto Fly Agent")

COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price"

@app.get("/coin/{symbol}")
def get_coin_price(symbol: str):
    response = requests.get(
        COINGECKO_URL,
        params={"ids": symbol.lower(), "vs_currencies": "usd"}
    )
    data = response.json()
    if symbol.lower() in data:
        return {symbol: {"usd": data[symbol.lower()]["usd"]}}
    return {"error": "Invalid coin symbol"}

@app.get("/coins")
def get_top_coins():
    url = "https://api.coingecko.com/api/v3/coins/markets"
    response = requests.get(url, params={
        "vs_currency": "usd",
        "order": "market_cap_desc",
        "per_page": 100,
        "page": 1
    })
    return response.json()
