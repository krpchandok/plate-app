import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.chat import router as chat_router
from routers.places import router as places_router
from routers.menu import router as menu_router

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(chat_router)
app.include_router(places_router)
app.include_router(menu_router)