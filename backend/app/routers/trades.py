from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select

from app.db import SessionLocal
from app.models import DecisionLog, Trade
from app.security import require_auth

router = APIRouter(prefix="/api/trades", tags=["trades"], dependencies=[Depends(require_auth)])


def _period_key(exit_time, period: str) -> str:
    year, month, day = exit_time.year, exit_time.month, exit_time.day
    if period == "daily":
        return f"{year:04d}-{month:02d}-{day:02d}"
    if period == "weekly":
        iso_year, iso_week, _ = exit_time.isocalendar()
        return f"{iso_year}-W{iso_week:02d}"
    if period == "monthly":
        return f"{year:04d}-{month:02d}"
    if period == "quarterly":
        return f"{year:04d}-Q{(month - 1) // 3 + 1}"
    if period == "yearly":
        return f"{year:04d}"
    raise ValueError("invalid period")


@router.get("")
async def list_trades(limit: int = 100):
    async with SessionLocal() as session:
        result = await session.execute(
            select(Trade).order_by(Trade.exit_time.desc()).limit(limit)
        )
        trades = result.scalars().all()
    return [
        {
            "id": t.id, "symbol": t.symbol, "entry_price": t.entry_price, "exit_price": t.exit_price,
            "size": t.size, "quote_spent": t.quote_spent, "pnl_quote": t.pnl_quote, "pnl_pct": t.pnl_pct,
            "exit_reason": t.exit_reason, "mode": t.mode, "entry_time": t.entry_time, "exit_time": t.exit_time,
        }
        for t in trades
    ]


@router.get("/report")
async def trades_report(period: str = "daily"):
    if period not in ("daily", "weekly", "monthly", "quarterly", "yearly"):
        raise HTTPException(status_code=400, detail="invalid_period")

    async with SessionLocal() as session:
        result = await session.execute(select(Trade).order_by(Trade.exit_time.asc()))
        trades = result.scalars().all()

    buckets: dict[str, dict] = {}
    for t in trades:
        key = _period_key(t.exit_time, period)
        bucket = buckets.setdefault(key, {"period": key, "trades": 0, "wins": 0, "losses": 0,
                                           "pnl_quote": 0.0, "pnl_pct_sum": 0.0})
        bucket["trades"] += 1
        bucket["pnl_quote"] += t.pnl_quote
        bucket["pnl_pct_sum"] += t.pnl_pct
        if t.pnl_quote > 0:
            bucket["wins"] += 1
        elif t.pnl_quote < 0:
            bucket["losses"] += 1

    rows = []
    for b in buckets.values():
        rows.append({
            "period": b["period"], "trades": b["trades"], "wins": b["wins"], "losses": b["losses"],
            "win_rate": (b["wins"] / b["trades"] * 100) if b["trades"] else 0.0,
            "pnl_quote": b["pnl_quote"], "pnl_pct_avg": b["pnl_pct_sum"] / b["trades"] if b["trades"] else 0.0,
        })
    rows.sort(key=lambda r: r["period"], reverse=True)
    return rows


@router.get("/logs")
async def list_logs(limit: int = 200):
    async with SessionLocal() as session:
        result = await session.execute(
            select(DecisionLog).order_by(DecisionLog.timestamp.desc()).limit(limit)
        )
        logs = result.scalars().all()
    return [
        {
            "id": l.id, "timestamp": l.timestamp, "symbol": l.symbol,
            "decision": l.decision, "reason": l.reason, "details": l.details,
        }
        for l in logs
    ]
