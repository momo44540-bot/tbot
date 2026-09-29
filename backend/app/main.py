import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.db import init_db
from app.logging_conf import setup_logging
from app.routers import auth, control, dashboard, settings as settings_router, trades, ws
from app.services.bot_runner import bot_runner, get_or_create_state

logger = logging.getLogger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    await init_db()

    # استئناف تلقائي: لو كان البوت يُفترض أنه يعمل قبل توقف العملية (تعطّل/نفاد
    # ذاكرة/إعادة تشغيل السيرفر)، نعيد تشغيل محرك التداول الفعلي هنا تلقائيًا،
    # بدل بقائه "نائمًا" بصمت بينما تعرض اللوحة حالة قديمة مضلِّلة.
    try:
        state = await get_or_create_state()
        if state.running:
            logger.info("Auto-resuming bot (was running before this process started)")
            await bot_runner.start()
    except Exception:
        logger.exception("Auto-resume failed")

    yield


app = FastAPI(title="Trading Platform", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(trades.router)
app.include_router(settings_router.router)
app.include_router(control.router)
app.include_router(ws.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


frontend_dist = Path(__file__).resolve().parent.parent / "static_frontend"
if frontend_dist.is_dir():
    app.mount("/assets", StaticFiles(directory=frontend_dist / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str):
        return FileResponse(frontend_dist / "index.html")
