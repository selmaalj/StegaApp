from sqlalchemy import Boolean, String, Integer, Column, ForeignKey
from database import Base

class Images(Base):
    __tablename__='Images'
    id=Column(Integer, primary_key=True, index=True)
    url=Column(String, index=True)   #inserted url to open
    code=Column(String, index=True, unique=True) #path to decoded image
    