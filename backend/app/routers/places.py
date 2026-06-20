from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import httpx
import os

router = APIRouter()

@router.get("/places/nearby")
async def get_nearby_places(lat: float, lng: float):
    key = os.getenv("GOOGLE_PLACES_KEY")
    url = f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={lat},{lng}&radius=1500&type=restaurant&key={key}"
    async with httpx.AsyncClient() as client:
        res = await client.get(url)
        return res.json()

@router.get("/places/autocomplete")
async def autocomplete(query: str):
    key = os.getenv("GOOGLE_PLACES_KEY")
    url = f"https://maps.googleapis.com/maps/api/place/autocomplete/json?input={query}&types=(cities)&key={key}"
    async with httpx.AsyncClient() as client:
        res = await client.get(url)
        return res.json()

@router.get("/places/geocode")
async def geocode(query: str):
    key = os.getenv("GOOGLE_PLACES_KEY")
    url = f"https://maps.googleapis.com/maps/api/geocode/json?address={query}&key={key}"
    async with httpx.AsyncClient() as client:
        res = await client.get(url)
        return res.json()

@router.get("/places/details/{place_id}")
async def get_place_details(place_id: str):
    key = os.getenv("GOOGLE_PLACES_KEY")
    url = f"https://maps.googleapis.com/maps/api/place/details/json?place_id={place_id}&fields=name,formatted_address,rating,website,photos,opening_hours,price_level,formatted_phone_number&key={key}"
    async with httpx.AsyncClient() as client:
        res = await client.get(url)
        return res.json()

@router.get("/places/photo")
async def get_photo(photo_reference: str):
    key = os.getenv("GOOGLE_PLACES_KEY")
    url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference={photo_reference}&key={key}"
    async with httpx.AsyncClient(follow_redirects=True) as client:
        res = await client.get(url)
        return StreamingResponse(
            iter([res.content]),
            media_type=res.headers.get("content-type", "image/jpeg")
        )