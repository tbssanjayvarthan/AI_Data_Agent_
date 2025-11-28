# AI Data Agent Backend

Python FastAPI backend for the AI Data Agent platform.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file with your credentials:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key  # Optional
```

4. Run the server:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

## API Endpoints

- `POST /api/upload` - Upload Excel/CSV files
- `POST /api/query` - Process natural language queries
- `GET /api/files/{file_id}` - Get file information

## Features

- Excel and CSV file processing
- Data cleaning and preprocessing
- Natural language query processing
- Statistical analysis
- Data visualization generation
- Handles dirty and inconsistent data