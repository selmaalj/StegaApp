from typing import Type, Optional
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from fastapi import FastAPI, File, HTTPException, Depends, UploadFile
import database_models
from database import engine, SessionLocal
from sqlalchemy.orm import Session
import random
import string
import subprocess
import os

app = FastAPI()
database_models.Base.metadata.create_all(bind=engine)

class ImageBase(BaseModel):
    url: str
    code: Optional[str] = None

def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency: Type[Session] = Depends(get_db)
secret=None

@app.post("/image/")
async def create_image(image: ImageBase, db: Session = db_dependency):
    global secret
    unique_code=generate_unique_code(db)
    full_url="http://"+image.url
    db_image=database_models.Images(url=full_url, code=unique_code)
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    secret=unique_code
    return db_image

@app.get("/url/") #za dobijanje url-a preko koda
async def get_image(code: str, db: Session = db_dependency): 
    result=db.query(database_models.Images).filter(database_models.Images.code==code).first()
    if not result:
        raise HTTPException(status_code=404, detail="Image not found")
    return result

def generate_unique_code(session: Session):
    characters = string.ascii_letters + string.digits 
    while True:
        unique_code = ''.join(random.choices(characters, k=7)) #duzina 7 karaktera
        if not session.query(database_models.Images).filter_by(code=unique_code).first():
            return unique_code
        
@app.post("/encode-image/")
async def encode_image(image: UploadFile = File(...)):
    global secret
    with open(image.filename, "wb") as buffer:
        buffer.write(await image.read())
    script_path = os.path.join(os.path.dirname(__file__), "encode_image.py")
    command = [
        "python", script_path,
        "saved_models/stegastamp_pretrained",
        "--image", image.filename,
        "--save_dir", "out",
        "--secret", secret
    ]
    subprocess.run(command)

    original_filename = os.path.splitext(image.filename)[0]
    hidden_filename = f"{original_filename}_hidden.png"

    if hidden_filename not in os.listdir("out"):
        raise FileNotFoundError(f"Hidden image file '{hidden_filename}' not found in 'out' directory")

    encoded_image_path = os.path.join("out", hidden_filename)

    return StreamingResponse(open(encoded_image_path, "rb"), media_type="image/png")
