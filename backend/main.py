from typing import Type, Optional
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, Depends
import database_models
from database import engine, SessionLocal
from sqlalchemy.orm import Session
import random
import string

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

@app.post("/image/")
async def create_image(image: ImageBase, db: Session = db_dependency):
    unique_code=generate_unique_code(db)
    db_image=database_models.Images(url=image.url, code=unique_code)
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image

@app.get("/image/") #za dobijanje url-a preko koda
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
