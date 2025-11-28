from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import Optional, Dict, Any, List
import json
from datetime import datetime
import io
from data_processor import DataProcessor
from ai_agent import AIAgent

load_dotenv()

app = FastAPI(title="AI Data Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("Missing Supabase credentials")

supabase: Client = create_client(supabase_url, supabase_key)

data_processor = DataProcessor()
ai_agent = AIAgent()


class QueryRequest(BaseModel):
    file_id: str
    query: str
    conversation_id: str


@app.get("/")
async def root():
    return {"message": "AI Data Agent API is running"}


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...), user_id: str = None):
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required")

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    try:
        contents = await file.read()

        df, metadata = data_processor.process_file(contents, file.filename)

        file_data = {
            "user_id": user_id,
            "original_filename": file.filename,
            "file_size": len(contents),
            "storage_path": f"uploads/{user_id}/{file.filename}",
            "sheet_names": metadata.get("sheet_names", []),
            "column_mapping": metadata.get("column_mapping", {}),
            "row_count": metadata.get("row_count", 0),
            "data_preview": metadata.get("data_preview", []),
            "data_quality_issues": metadata.get("data_quality_issues", []),
        }

        result = supabase.table("uploaded_files").insert(file_data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to save file metadata")

        file_id = result.data[0]["id"]

        cache_data = {
            "file_id": file_id,
            "cache_key": f"full_data_{file_id}",
            "data": df.to_dict(orient="records"),
        }
        supabase.table("data_cache").insert(cache_data).execute()

        return {
            "file_id": file_id,
            "filename": file.filename,
            "row_count": metadata.get("row_count", 0),
            "columns": list(metadata.get("column_mapping", {}).keys()),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@app.post("/api/query")
async def process_query(request: QueryRequest):
    try:
        cache_result = supabase.table("data_cache")\
            .select("data")\
            .eq("file_id", request.file_id)\
            .eq("cache_key", f"full_data_{request.file_id}")\
            .execute()

        if not cache_result.data:
            raise HTTPException(status_code=404, detail="File data not found")

        df = pd.DataFrame(cache_result.data[0]["data"])

        response = ai_agent.process_query(df, request.query)

        return {
            "answer": response["answer"],
            "visualization": response.get("visualization", {}),
            "query_metadata": response.get("metadata", {}),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")


@app.get("/api/files/{file_id}")
async def get_file_info(file_id: str):
    try:
        result = supabase.table("uploaded_files").select("*").eq("id", file_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="File not found")

        return result.data[0]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching file: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)