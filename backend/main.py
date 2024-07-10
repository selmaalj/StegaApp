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
import json
import re
from fastapi.middleware.cors import CORSMiddleware
import tempfile
from io import BytesIO

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
@app.post("/image/") 
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

    encoded_image_path = os.path.join("out", hidden_filename)

    return StreamingResponse(open(encoded_image_path, "rb"), media_type="image/png")

#executing script decode_image.py
#returning decoded code 
@app.post("/decode-image/") 
async def decode_image(image: UploadFile = File(...), db: Session = db_dependency):
    # Save the uploaded file to a temporary location
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(await image.read())
        tmp_path = tmp.name

    # Construct the command to pass to subprocess
    script_path = os.path.join(os.path.dirname(__file__), "decode_image.py")
    command = [
        "python", script_path,
        "saved_models/stegastamp_pretrained",
        "--image", tmp_path
    ]

    try:
        # Run the command and capture the output
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode == 0:
            output_lines = result.stdout.strip().splitlines()
            decoded_output = output_lines[-1]  
            return {"code": decoded_output}
        else:
            return {"error": result.stderr.strip()} 
    finally:
        os.remove(tmp_path)

@app.post("/detect-image/")
async def detect_image(image: UploadFile = File(...)):
    try:
        # Read the image file into memory
        image_data = await image.read()
        image_stream = BytesIO(image_data)

        # Save the image to a temporary file
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            tmp.write(image_data)
            tmp_path = tmp.name

        # Construct the command to pass to subprocess
        script_path = os.path.join(os.path.dirname(__file__), "detect_image.py")
        command = ["python", script_path, tmp_path]

        # Run the command asynchronously
        process = await asyncio.create_subprocess_exec(
            *command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        stdout, stderr = await process.communicate()

        # Remove the temporary file
        os.remove(tmp_path)

        if process.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Subprocess error: {stderr.decode()}")

        try:
            # Parse the JSON output from the script
            output = json.loads(stdout)
            return {"output": "Detection process completed.", "result": output}
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="Failed to parse script output as JSON")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/detect-frames/")
async def detect_frames():
    script_path = os.path.join(os.path.dirname(__file__), "detect_video.py")

    command = [
        "python", script_path, 
    ]

    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    stdout, stderr = process.communicate()

    if process.returncode == 0:
        match = re.search(r'{"status": "success", "code": ".*?", "message": "Image processing and decoding completed successfully."}', stdout)
        if match:
            result_json_str = match.group(0)
            result_dict = json.loads(result_json_str)
        else:
            result_dict = None
        return { "output": "Detection process completed.", "result": result_dict}
    else:
        return {"output": "Detection process failed.", "stdout": stdout, "stderr": stderr}