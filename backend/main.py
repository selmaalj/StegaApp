import asyncio
from typing import Type, Optional
from fastapi import FastAPI, File, HTTPException, Depends, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import database_models
from database import engine, SessionLocal
from sqlalchemy.orm import Session
import random, string
import subprocess, os
import cv2, io, numpy as np

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

#generating unique code and saving that code and url or text into database 
@app.put("/image/") 
async def create_image(image: ImageBase, db: Session = db_dependency):
    global secret
    unique_code=generate_unique_code(db)
    db_image=database_models.Images(url=image.url, code=unique_code)
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    secret=unique_code
    return db_image

#getting url or text based on hidden code
@app.get("/url/") 
async def get_image(code: str, db: Session = db_dependency): 
    result=db.query(database_models.Images).filter(database_models.Images.code==code).first()
    if not result:
        raise HTTPException(status_code=404, detail="Image not found")
    return result

def generate_unique_code(session: Session):
    characters = string.ascii_letters + string.digits 
    while True:
        unique_code = ''.join(random.choices(characters, k=7)) #7 characters long
        if not session.query(database_models.Images).filter_by(code=unique_code).first():
            return unique_code

#executing script encode_image.py with already generated unique code
#returning encoded image    
@app.get("/encode-image/")
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

#executing script decode_image.py
#returning decoded code 
@app.post("/decode-image/") 
async def decode_image(image: UploadFile = File(...), db: Session = db_dependency):
    with open(image.filename, "wb") as buffer:
        buffer.write(await image.read())
    script_path = os.path.join(os.path.dirname(__file__), "decode_image.py")

    command = [
        "python", script_path,
        "saved_models/stegastamp_pretrained",
        "--image", "out/"+image.filename
    ]
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode == 0:
        output_lines = result.stdout.strip().splitlines()
        decoded_output = output_lines[-1]  
        return {"output": decoded_output}
    else:
        return {"error": result.stderr.strip()}

@app.post("/detect/")
async def detect_objects():
    script_path = os.path.join(os.path.dirname(__file__), "detector.py")

    command = [
        "python", script_path,
        "--detector_model", "detector_models/stegastamp_detector",
        "--decoder_model", "saved_models/stegastamp_pretrained",
        "--video", "camera",  # Use "camera" as the video input
        #"--save_video", "out_videos",
    ]

    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    process.stdin.close()
    process.wait()

    return {"output": "Detection process completed."}