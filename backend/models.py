import datetime as dt
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.mysql import JSON as MYSQLJSON
from sqlalchemy.orm import relationship

from .db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    requests = relationship("Request", back_populates="user")


class Request(Base):
    __tablename__ = "requests"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    prompt = Column(Text, nullable=False)
    sql_text = Column(Text, nullable=True)
    status = Column(String(50), default="pending")
    chart_type = Column(String(50), default="bar")
    result_preview = Column(MYSQLJSON, nullable=True)  # sample rows/aggregates
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    user = relationship("User", back_populates="requests")
