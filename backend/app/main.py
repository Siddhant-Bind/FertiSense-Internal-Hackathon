from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import fields, reference, recommend, recommendations, auth


app = FastAPI(title="Sustainable Fertilizer Usage Optimizer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Since exact Next.js domain isn't known, allow all for now or configure from env
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(reference.router, prefix="/api/v1", tags=["Reference"])
app.include_router(fields.router, prefix="/api/v1/fields", tags=["Fields"])
app.include_router(recommend.router, prefix="/api/v1/recommend", tags=["Recommend"])
app.include_router(recommendations.router, prefix="/api/v1/recommendations", tags=["Recommendations"])

@app.get("/health", tags=["Health"])
def health_check():
    """Phase 0 Exit Criteria: Confirm service is up."""
    return {"status": "ok"}