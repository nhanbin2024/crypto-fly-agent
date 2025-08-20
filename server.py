from fastapi import FastAPI
import httpx
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend
from fastapi_cache.decorator import cache

app = FastAPI(title="Crypto Fly Agent")

# Khởi tạo cache
@app.on_event("startup")
async def startup():
    FastAPICache.init(InMemoryBackend(), prefix="fastapi-cache")

# Endpoint lấy giá coin với cache 60 giây
@app.get("/coin/{symbol}")
@cache(expire=60)  # cache 60 giây
async def get_coin(symbol: str):
    url = f"https://api.coingecko.com/api/v3/simple/price?ids={symbol}&vs_currencies=usd"
    async with httpx.AsyncClient() as client:
        r = await client.get(url)
    return r.json()

# Endpoint lấy top 100 coins, cache 120 giây
@app.get("/coins")
@cache(expire=120)  # cache 120 giây
async def get_top_coins():
    url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1"
    async with httpx.AsyncClient() as client:
        r = await client.get(url)
    return r.json()
