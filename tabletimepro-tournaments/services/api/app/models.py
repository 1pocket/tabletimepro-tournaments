from sqlalchemy.orm import declarative_base, relationship, Mapped, mapped_column
from sqlalchemy import String, Integer, Float, ForeignKey, Boolean, DateTime, func

Base = declarative_base()

class Tournament(Base):
    __tablename__ = "tournament"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[str] = mapped_column(String(64), index=True)
    venue_id: Mapped[str] = mapped_column(String(64), index=True)
    name: Mapped[str] = mapped_column(String(200))
    game: Mapped[str] = mapped_column(String(32), default="8-ball")
    entry_fee: Mapped[float] = mapped_column(Float, default=20.0)
    green_fee: Mapped[float] = mapped_column(Float, default=5.0)
    sponsor_add: Mapped[float] = mapped_column(Float, default=0.0)
    payout_template_key: Mapped[str] = mapped_column(String(32), default="top4")
    calcutta_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    calcutta_house_vig_pct: Mapped[float] = mapped_column(Float, default=0.0)
    calcutta_template_key: Mapped[str] = mapped_column(String(32), default="top3")
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
