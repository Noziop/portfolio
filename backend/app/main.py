from app.api.v1.routers import blog, contact
from fastapi import FastAPI

app = FastAPI(title="Portfolio API", version="1.0.0")

# Include routers
app.include_router(blog.router, prefix="/api/v1")
app.include_router(contact.router, prefix="/api/v1")


@app.get("/")
def read_root():
    return {"message": "Welcome to the FastAPI backend for the portfolio!"}
