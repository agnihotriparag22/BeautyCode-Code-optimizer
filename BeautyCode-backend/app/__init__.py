from app import routes
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

def create_app():
    app=FastAPI()
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(routes.app)
    return app