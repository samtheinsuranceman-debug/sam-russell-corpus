from __future__ import annotations

import os
from datetime import date, datetime, timezone
from typing import Generator, Literal

from fastapi import HTTPException
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, sessionmaker

DATABASE_URL_ENV = "DATABASE_URL"

MATTER_STATUSES = (
    "drafting",
    "review",
    "filed",
    "office-action",
    "granted",
    "abandoned",
)

DEADLINE_STATUSES = ("open", "completed")


class Base(DeclarativeBase):
    pass


class MatterRecord(Base):
    __tablename__ = "matters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_email: Mapped[str] = mapped_column(String(320), index=True)
    docket: Mapped[str] = mapped_column(String(64))
    application_number: Mapped[str | None] = mapped_column(String(64), nullable=True)
    title: Mapped[str] = mapped_column(String(240))
    client: Mapped[str] = mapped_column(String(160))
    status: Mapped[str] = mapped_column(String(32))
    attorney: Mapped[str] = mapped_column(String(160))
    cpc: Mapped[str | None] = mapped_column(String(64), nullable=True)
    next_step: Mapped[str | None] = mapped_column(String(240), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    deadlines: Mapped[list["DeadlineRecord"]] = relationship(
        back_populates="matter", cascade="all, delete-orphan"
    )


class DeadlineRecord(Base):
    __tablename__ = "deadlines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    matter_id: Mapped[int] = mapped_column(ForeignKey("matters.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(240))
    owner: Mapped[str] = mapped_column(String(160))
    due_date: Mapped[date] = mapped_column(Date)
    is_statutory: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(32), default="open")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    matter: Mapped[MatterRecord] = relationship(back_populates="deadlines")


_engine = None
_session_factory: sessionmaker[Session] | None = None


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _database_url() -> str:
    url = os.getenv(DATABASE_URL_ENV, "").strip()
    if not url:
        raise HTTPException(
            status_code=503,
            detail=(
                "Operational data store is not configured. "
                "Set DATABASE_URL to an explicit database URL, such as "
                "sqlite:///./patent360-dev.db for local development."
            ),
        )
    return url


def _engine_and_factory() -> tuple:
    global _engine, _session_factory
    if _engine is not None and _session_factory is not None:
        return _engine, _session_factory

    url = _database_url()
    connect_args = {"check_same_thread": False} if url.startswith("sqlite") else {}
    _engine = create_engine(url, pool_pre_ping=True, future=True, connect_args=connect_args)
    _session_factory = sessionmaker(bind=_engine, expire_on_commit=False, class_=Session)
    return _engine, _session_factory


def init_operational_data() -> None:
    engine, _ = _engine_and_factory()
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    init_operational_data()
    _, factory = _engine_and_factory()
    db = factory()
    try:
        yield db
    finally:
        db.close()


def require_matter_for_user(db: Session, matter_id: int, user_email: str) -> MatterRecord:
    matter = db.execute(
        select(MatterRecord).where(MatterRecord.id == matter_id, MatterRecord.user_email == user_email)
    ).scalar_one_or_none()
    if matter is None:
        raise HTTPException(status_code=404, detail="Matter not found")
    return matter


def classify_deadline(*, due_date: date, status: str, now_utc: datetime | None = None) -> Literal[
    "overdue", "due_soon", "upcoming", "completed"
]:
    if status == "completed":
        return "completed"

    today = (now_utc or _now_utc()).date()
    days_until_due = (due_date - today).days
    if days_until_due < 0:
        return "overdue"
    if days_until_due <= 7:
        return "due_soon"
    return "upcoming"


class MatterBase(BaseModel):
    docket: str = Field(min_length=1, max_length=64)
    application_number: str | None = Field(default=None, max_length=64)
    title: str = Field(min_length=1, max_length=240)
    client: str = Field(min_length=1, max_length=160)
    status: Literal["drafting", "review", "filed", "office-action", "granted", "abandoned"]
    attorney: str = Field(min_length=1, max_length=160)
    cpc: str | None = Field(default=None, max_length=64)
    next_step: str | None = Field(default=None, max_length=240)

    @field_validator("docket", "application_number", "title", "client", "attorney", "cpc", "next_step")
    @classmethod
    def _trim_strings(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if cleaned == "":
            return None
        return cleaned


class MatterCreate(MatterBase):
    pass


class MatterUpdate(MatterBase):
    pass


class MatterOut(MatterBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class MatterListResponse(BaseModel):
    items: list[MatterOut]


class DeadlineBase(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    owner: str = Field(min_length=1, max_length=160)
    due_date: date
    is_statutory: bool = False
    status: Literal["open", "completed"] = "open"

    @field_validator("title", "owner")
    @classmethod
    def _trim_required_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("must not be blank")
        return cleaned


class DeadlineCreate(DeadlineBase):
    matter_id: int = Field(gt=0)


class DeadlineUpdate(DeadlineBase):
    pass


class DeadlineOut(DeadlineBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    matter_id: int
    docket: str
    classification: Literal["overdue", "due_soon", "upcoming", "completed"]
    created_at: datetime
    updated_at: datetime


class DeadlineListResponse(BaseModel):
    items: list[DeadlineOut]
