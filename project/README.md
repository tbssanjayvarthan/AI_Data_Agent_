# AI Data Agent - Conversational Data Analysis Platform

A powerful conversational interface platform that allows users to upload Excel files and ask complex business questions about their data in natural language. The system analyzes uploaded data and provides intelligent answers with relevant charts and tables.

## Features

### Core Capabilities
- **Universal File Support**: Handles any Excel (.xlsx, .xls) and CSV file format
- **Intelligent Data Cleaning**: Automatically processes bad/inconsistent data formatting, unnamed columns, dirty or incomplete data
- **Natural Language Processing**: Understands vague questions and translates them into meaningful data analysis
- **Interactive Visualizations**: Generates charts, tables, and graphs based on query context
- **Conversational Interface**: Multi-turn conversations with context awareness
- **Secure Authentication**: User authentication with Supabase Auth
- **Data Persistence**: All files and conversations are saved for future access

### Advanced Features
- Automatic data quality issue detection
- Statistical analysis (mean, median, std deviation, correlations)
- Trend analysis and pattern recognition
- Comparative analysis across categories
- Top/bottom value identification
- Multi-sheet Excel file support
- Real-time query processing

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Supabase Client** for authentication and data
- **Lucide React** for icons

### Backend
- **FastAPI** (Python) for API endpoints
- **Pandas** for data processing and analysis
- **OpenPyxl** for Excel file handling
- **Supabase** for database and authentication
- **NumPy & SciPy** for numerical computations

### Database
- **Supabase (PostgreSQL)** with Row Level Security
- Tables: `uploaded_files`, `conversations`, `messages`, `data_cache`

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Supabase account

### Frontend Setup

1. Clone the repository and navigate to the project directory

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8000
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the backend directory:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key  # Optional
```

5. Run the FastAPI server:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

### Database Setup

The database schema is automatically created via Supabase migrations. The schema includes:

- `uploaded_files`: Stores file metadata, column mappings, and data quality issues
- `conversations`: Tracks user conversation sessions
- `messages`: Stores chat messages with visualization data
- `data_cache`: Caches processed data for fast query responses

All tables have Row Level Security (RLS) enabled for secure multi-user access.

## Usage

### 1. Sign Up / Sign In
Create an account or sign in with your credentials.

### 2. Upload a File
- Click "Choose File" or drag and drop an Excel/CSV file
- The system will automatically:
  - Detect and clean column names
  - Handle missing/unnamed columns
  - Identify data quality issues
  - Generate data preview and statistics

### 3. Ask Questions
Ask natural language questions about your data:
- "What are the main trends in this data?"
- "Show me the top 10 performers"
- "Compare sales across different regions"
- "What's the average revenue by category?"
- "Show me summary statistics"
- "Are there any correlations between these columns?"

### 4. View Results
- Get intelligent answers in plain language
- See visualizations (bar charts, line charts, tables)
- Continue the conversation for deeper insights

## Example Queries

The AI agent can handle various types of questions:

### Statistical Analysis
- "Show me summary statistics"
- "What's the average, median, and standard deviation?"
- "Calculate total sales by region"

### Trend Analysis
- "What are the trends over time?"
- "Show me how this metric has changed"
- "What patterns can you find?"

### Comparisons
- "Compare performance across categories"
- "Which region has the highest sales?"
- "Show me the difference between A and B"

### Insights
- "What insights can you find?"
- "Are there any correlations?"
- "What's interesting about this data?"

## Architecture

### Data Flow
1. User uploads Excel/CSV file
2. Backend processes and cleans the data
3. Metadata and cleaned data stored in Supabase
4. User asks questions via chat interface
5. AI agent analyzes data and generates response
6. Visualizations created based on query type
7. Results displayed in chat with charts/tables

### Key Components

**Frontend:**
- `Auth.tsx`: Authentication UI
- `Dashboard.tsx`: Main application layout
- `FileUpload.tsx`: File upload interface
- `ChatInterface.tsx`: Conversational UI
- `DataVisualization.tsx`: Chart and table rendering
- `Sidebar.tsx`: File and conversation navigation

**Backend:**
- `main.py`: FastAPI application and routes
- `data_processor.py`: Excel/CSV processing and cleaning
- `ai_agent.py`: Natural language query processing

## Data Handling

### Supported File Formats
- Excel (.xlsx, .xls)
- CSV (.csv)

### Data Cleaning Features
- Automatic encoding detection
- Column name standardization
- Duplicate removal
- Empty row removal
- Type inference and conversion
- Multi-sheet Excel support

### Data Quality Detection
- High percentage of missing values
- Duplicate rows
- Unnamed columns
- Low variety in categorical columns

## Security

- Row Level Security (RLS) on all database tables
- User authentication via Supabase Auth
- Secure API endpoints
- Data isolation per user

## Building for Production

### Frontend
```bash
npm run build
```

### Backend
The backend can be deployed to any platform supporting Python (Heroku, Railway, AWS, etc.)

## API Documentation

Access interactive API documentation at `http://localhost:8000/docs` when the backend is running.

### Main Endpoints

**POST /api/upload**
- Upload Excel/CSV file
- Returns: file_id, filename, row_count, columns

**POST /api/query**
- Process natural language query
- Body: { file_id, query, conversation_id }
- Returns: answer, visualization, query_metadata

**GET /api/files/{file_id}**
- Get file information and metadata

## Troubleshooting

### Frontend Issues
- Ensure `.env` file has correct Supabase credentials
- Check that backend is running on correct port
- Clear browser cache if experiencing issues

### Backend Issues
- Verify Python dependencies are installed
- Check `.env` file has correct credentials
- Ensure Supabase service role key has proper permissions
- Check file encoding if upload fails

### Database Issues
- Verify RLS policies are enabled
- Check user authentication status
- Ensure migrations have been applied

## Contributing

This is a demonstration project for the AI Data Agent SDE hiring assignment.

## License

MIT

## Contact

For questions about this assignment, contact vikas@bulba.app