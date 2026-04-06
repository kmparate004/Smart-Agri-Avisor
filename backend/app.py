from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import models and services
from models import get_db, init_db, User
from services.db_service import db_service
from services.agent_service import agent_service
from services.gemini_service import gemini_service

from contextlib import asynccontextmanager

# Define lifespan for database initialization
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database
    init_db()
    print("[Smart Agri Advisor] FastAPI Backend Started")
    print(f"[API Key] {'Set' if os.environ.get('API_KEY') else 'NOT SET'}")
    yield
    # Shutdown: Clean up (if needed)
    print("[Smart Agri Advisor] FastAPI Backend Shutting Down")

# Initialize FastAPI app with lifespan
app = FastAPI(
    title="Smart Agri Advisor API",
    description="Intelligent Crop Advisory Backend",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration - allow all for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== PYDANTIC MODELS ====================

class LoginRequest(BaseModel):
    phone: str
    name: Optional[str] = "Farmer"

class AnalysisRequest(BaseModel):
    phone: str
    lat: float
    lng: float
    skipSearch: Optional[bool] = False

class CropDetailsRequest(BaseModel):
    cropName: str
    location: Dict[str, Any]
    soil: Dict[str, Any]
    phone: Optional[str] = None
    analysisId: Optional[str] = None

class ChatRequest(BaseModel):
    phone: str
    question: str
    history: Optional[List[Dict[str, str]]] = None
    context: Optional[Dict[str, Any]] = None


# ==================== AUTH ROUTES ====================

@app.post("/api/auth/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login or register a user."""
    phone = request.phone.strip()
    name = request.name.strip() if request.name else "Farmer"
    
    if not phone or len(phone) < 10:
        raise HTTPException(status_code=400, detail="Invalid phone number")
    
    user = db_service.get_or_create_user(db, phone, name)
    return {"success": True, "user": user.to_dict()}


@app.post("/api/auth/logout")
def logout():
    """Logout user."""
    return {"success": True}


class UpdateNameRequest(BaseModel):
    phone: str
    name: str


@app.post("/api/auth/update-name")
def update_name(request: UpdateNameRequest, db: Session = Depends(get_db)):
    """Update user's display name."""
    phone = request.phone.strip()
    name = request.name.strip()
    
    if not phone or len(phone) < 10:
        raise HTTPException(status_code=400, detail="Invalid phone number")
    
    if not name or len(name) < 2:
        raise HTTPException(status_code=400, detail="Name must be at least 2 characters")
    
    user = db_service.update_user_name(db, phone, name)
    if user:
        return {"success": True, "user": user.to_dict()}
    raise HTTPException(status_code=404, detail="User not found")


# ==================== ANALYSIS ROUTES ====================

@app.post("/api/analysis/run")
def run_analysis(request: AnalysisRequest, db: Session = Depends(get_db)):
    """Run full Mandi analysis for given coordinates."""
    if not request.phone:
        raise HTTPException(status_code=400, detail="Phone number required")
    
    try:
        # Get regional patterns and search count
        regional_data = db_service.get_regional_patterns(db, request.phone, '')
        global_count = db_service.get_search_count(db, request.phone)
        
        # Run analysis
        result = agent_service.run_full_analysis(
            phone=request.phone,
            lat=request.lat,
            lng=request.lng,
            skip_search=request.skipSearch,
            regional_data=regional_data,
            global_count=global_count
        )
        
        # Save to database
        db_service.save_analysis(db, request.phone, result)
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail="Analysis failed. Please try again.")


# ==================== CROP DETAILS ROUTES ====================

@app.post("/api/crops/details")
def get_crop_details(request: CropDetailsRequest, db: Session = Depends(get_db)):
    """Get detailed crop information with search grounding."""
    if not request.cropName:
        raise HTTPException(status_code=400, detail="Crop name required")
    
    try:
        detail = gemini_service.get_crop_details(
            request.cropName, 
            request.location, 
            request.soil,
            request.phone or "",
            request.analysisId or ""
        )
        
        # Update record with crop detail if phone and ID provided
        if request.phone and request.analysisId:
            db_service.update_crop_detail(db, request.phone, request.analysisId, request.cropName, detail)
        
        return detail
    except Exception as e:
        print(f"Crop details error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get crop details")


# ==================== HISTORY ROUTES ====================

@app.get("/api/history")
def get_history(phone: str = Query(...), db: Session = Depends(get_db)):
    """Get user's analysis history."""
    if not phone:
        raise HTTPException(status_code=400, detail="Phone number required")
    
    return db_service.get_history(db, phone)


@app.delete("/api/history/{record_id}")
def delete_record(record_id: str, phone: str = Query(...), db: Session = Depends(get_db)):
    """Delete a specific history record."""
    if not phone:
        raise HTTPException(status_code=400, detail="Phone number required")
    
    success = db_service.delete_record(db, phone, record_id)
    return {"success": success}


# ==================== STATS ROUTES ====================

@app.get("/api/stats")
def get_stats(phone: str = Query(...), db: Session = Depends(get_db)):
    """Get user statistics."""
    if not phone:
        raise HTTPException(status_code=400, detail="Phone number required")
    
    count = db_service.get_search_count(db, phone)
    return {"trainingCount": count}


# ==================== HISTORY ROUTES ====================

@app.get("/api/history")
def get_history(phone: str = Query(...), db: Session = Depends(get_db)):
    """Get all saved reports for a user."""
    if not phone:
        raise HTTPException(status_code=400, detail="Phone number required")
    
    return db_service.get_history(db, phone)


@app.delete("/api/history/{record_id}")
def delete_history_record(record_id: str, phone: str = Query(...), db: Session = Depends(get_db)):
    """Delete a specific report from history."""
    if not phone:
        raise HTTPException(status_code=400, detail="Phone number required")
    
    success = db_service.delete_record(db, phone, record_id)
    if not success:
        raise HTTPException(status_code=404, detail="Record not found")
    return {"success": True}


# ==================== RESOURCE ROUTES ====================

@app.get("/api/resources")
def search_resources(query: str = Query(""), category: str = Query("All")):
    """Search agricultural resources."""
    try:
        return gemini_service.search_resources(query, category)
    except Exception as e:
        print(f"Resources error: {e}")
        return []


@app.get("/api/schemes")
def get_schemes():
    """Get government schemes for farmers."""
    try:
        return gemini_service.get_schemes()
    except Exception as e:
        print(f"Schemes error: {e}")
        return []


# ==================== MARKETPLACE ROUTES ====================

@app.get("/api/marketplace")
def search_marketplace(query: str = Query(""), category: str = Query("All")):
    """Search marketplace products."""
    try:
        return gemini_service.search_marketplace(query, category)
    except Exception as e:
        print(f"Marketplace error: {e}")
        return []


# ==================== CHAT ROUTES ====================

@app.post("/api/chat/ask")
def ask_question(request: ChatRequest, db: Session = Depends(get_db)):
    """Ask an agricultural question to the AI and save to history."""
    if not request.question:
        raise HTTPException(status_code=400, detail="Question required")
    
    try:
        # 1. Save user message to database
        db_service.save_chat_message(db, request.phone, 'user', request.question)
        
        # 2. Get AI answer with full historical context
        user_context = db_service.get_full_user_context(db, request.phone)
        
        # Merge incoming transient context (like current tab/location) with permanent DB context
        full_context = {**(request.context or {}), "db_profile": user_context}
        
        answer = gemini_service.ask_question(request.question, request.history, full_context)
        
        # 3. Save AI answer to database
        db_service.save_chat_message(db, request.phone, 'assistant', answer)
        
        return {"answer": answer}
    except Exception as e:
        print(f"Chat error: {e}")
        # Even if AI fails, we already saved the user question. 
        # But we don't save a failed AI response.
        raise HTTPException(status_code=500, detail="Advisor is currently unavailable.")


@app.get("/api/chat/history")
def get_chat_history(phone: str = Query(...), db: Session = Depends(get_db)):
    """Get chat history for a user."""
    if not phone:
        raise HTTPException(status_code=400, detail="Phone number required")
    
    return db_service.get_chat_history(db, phone)


# ==================== HEALTH CHECK ====================

@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "framework": "FastAPI",
        "timestamp": datetime.utcnow().isoformat()
    }


if __name__ == '__main__':
    import uvicorn
    print("[Smart Agri Advisor] Starting FastAPI Server...")
    uvicorn.run(app, host="0.0.0.0", port=5000)
