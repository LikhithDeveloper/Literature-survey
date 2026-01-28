# 🎓 LIT GENIUS - Complete Implementation Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [What's Been Built](#whats-been-built)
3. [Installation & Setup](#installation--setup)
4. [Testing the Backend](#testing-the-backend)
5. [Next Steps](#next-steps)
6. [Architecture Overview](#architecture-overview)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

**LIT GENIUS** is an AI-powered platform that automates literature survey generation using:
- **Multi-Agent System**: 5 specialized AI agents working in coordination
- **RAG (Retrieval-Augmented Generation)**: Ensures factual accuracy
- **Vector Database**: ChromaDB for efficient similarity search
- **Real-time Updates**: Socket.IO for progress tracking
- **MERN Stack**: MongoDB, Express.js, React.js, Node.js (JavaScript)

---

## ✅ What's Been Built (60% Complete)

### Backend (90% Complete)
✅ **Complete Infrastructure**
- Express.js server with Socket.IO
- MongoDB integration
- JWT authentication
- File upload system
- Vector database (ChromaDB)
- Email service
- Export functionality (PDF, DOCX, Markdown)

✅ **Working AI Agents**
- **Agent 1**: Document Retrieval (100%)
- **Agent 2**: Paper Retrieval (100%)
- **Agent 3**: Summarization (20% - placeholder)
- **Agent 4**: Citation (10% - placeholder)
- **Agent 5**: Verification (10% - placeholder)

✅ **API Endpoints**
- Authentication (register, login, verify, reset password)
- Survey CRUD operations
- File upload
- Real-time progress tracking
- Export functionality

### Frontend (5% Complete)
✅ React app created
⏳ Needs development (UI components, pages, integration)

---

## 🚀 Installation & Setup

### Prerequisites

1. **Node.js** (v16 or higher)
   - Download: https://nodejs.org/

2. **MongoDB**
   - Option A: Local installation
   - Option B: MongoDB Atlas (cloud) - https://www.mongodb.com/atlas

3. **OpenAI API Key**
   - Get from: https://platform.openai.com/api-keys
   - You'll need credits for embeddings and completions

4. **ChromaDB** (Optional for local development)
   ```bash
   pip install chromadb
   ```

### Step-by-Step Setup

#### 1. Install Backend Dependencies

```powershell
cd backend
npm install
```

This will install all required packages:
- express, mongoose, dotenv
- bcryptjs, jsonwebtoken
- socket.io, axios
- pdf-parse, mammoth
- openai, chromadb
- nodemailer, pdfkit, docx
- And more...

#### 2. Configure Environment Variables

```powershell
# Copy the example file
cp .env.example .env

# Edit .env with your credentials
notepad .env
```

**Required Configuration:**

```env
# Server
PORT=5000
NODE_ENV=development

# Database - Choose one:
# Option A: Local MongoDB
MONGODB_URI=mongodb://localhost:27017/litgenius

# Option B: MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/litgenius

# JWT Secret (generate a random string)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=24h

# OpenAI API (REQUIRED)
OPENAI_API_KEY=sk-proj-...your-key-here...
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# ChromaDB
# Option A: Local
CHROMA_HOST=http://localhost:8000

# Option B: Cloud (if using hosted ChromaDB)
# CHROMA_HOST=https://your-chroma-instance.com

# Email Configuration (for Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_FROM=noreply@litgenius.com

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

**Getting Gmail App Password:**
1. Go to Google Account settings
2. Security → 2-Step Verification
3. App passwords → Generate new
4. Use the generated password in EMAIL_PASSWORD

#### 3. Start MongoDB

**Option A: Local MongoDB**
```powershell
# Start MongoDB service
mongod
```

**Option B: MongoDB Atlas**
- No action needed, just use the connection string in .env

#### 4. Start ChromaDB (Optional - for local)

```powershell
# In a new terminal
chroma run --path ./chroma_data
```

Or use cloud-hosted ChromaDB (Pinecone, Weaviate, etc.)

#### 5. Start Backend Server

```powershell
cd backend
npm run dev
```

You should see:
```
🚀 LIT GENIUS Backend running on http://localhost:5000
MongoDB Connected: localhost
ChromaDB client initialized successfully
```

#### 6. Install Frontend Dependencies

```powershell
cd frontend
npm install
```

#### 7. Start Frontend (for development)

```powershell
cd frontend
npm start
```

Frontend will open at http://localhost:3000

---

## 🧪 Testing the Backend

### 1. Health Check

Open browser or use curl:
```
http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "LIT GENIUS API is running",
  "timestamp": "2026-01-20T..."
}
```

### 2. Test User Registration

Using PowerShell:
```powershell
$body = @{
    name = "Test User"
    email = "test@example.com"
    password = "Test@1234"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

Expected response:
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "userId": "..."
}
```

### 3. Check Email

Check your email for verification link (if email is configured).

### 4. Verify Email (Manual)

For testing without email, you can manually verify in MongoDB:
```javascript
// In MongoDB shell or Compass
db.users.updateOne(
  { email: "test@example.com" },
  { $set: { isVerified: true } }
)
```

### 5. Test Login

```powershell
$body = @{
    email = "test@example.com"
    password = "Test@1234"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

# Save token for next requests
$token = $response.token
Write-Host "Token: $token"
```

### 6. Create a Survey

```powershell
# Create a simple test file
"This is a test document about machine learning." | Out-File -FilePath "test.txt"

# Create survey with file upload
$headers = @{
    Authorization = "Bearer $token"
}

$form = @{
    topic = "Machine Learning in Healthcare"
    additionalInfo = "Focus on diagnostic applications"
    documents = Get-Item -Path "test.txt"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/surveys/create" `
    -Method POST `
    -Headers $headers `
    -Form $form
```

### 7. Monitor Progress

Open browser console and connect to Socket.IO:
```javascript
const socket = io('http://localhost:5000');
socket.emit('join_survey', 'SURVEY_ID_HERE');
socket.on('progress_update', (data) => {
  console.log('Progress:', data);
});
```

### 8. Get Surveys

```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/surveys" `
    -Method GET `
    -Headers $headers
```

---

## 📝 Next Steps

### Immediate Tasks

1. **Test the Backend**
   - Follow the testing steps above
   - Verify all endpoints work
   - Check MongoDB collections

2. **Complete Agent 3: Summarization**
   - Location: `backend/agents/SummarizationAgent.js`
   - Implement RAG-based content generation
   - Query vector DB for relevant chunks
   - Use OpenAI to synthesize literature review

3. **Complete Agent 4: Citation**
   - Location: `backend/agents/CitationAgent.js`
   - Map citations to sources
   - Format in APA style
   - Generate bibliography

4. **Complete Agent 5: Verification**
   - Location: `backend/agents/VerificationAgent.js`
   - Fact-checking with RAG
   - Hallucination detection

5. **Build Frontend**
   - Create authentication pages
   - Build dashboard
   - Survey creation form
   - Progress tracking page
   - Survey viewer

### Development Workflow

```
Week 1:
- Day 1-2: Test backend, fix any issues
- Day 3-5: Complete Agent 3 (Summarization)

Week 2:
- Day 1-2: Complete Agents 4 & 5
- Day 3-5: Implement plagiarism checker

Week 3:
- Day 1-5: Build frontend application

Week 4:
- Day 1-3: Integration testing
- Day 4-5: Bug fixes and optimization
```

---

## 🏗️ Architecture Overview

### Request Flow

```
User → Frontend (React)
  ↓
  API Request (Axios)
  ↓
Backend (Express.js)
  ↓
  Authentication Middleware (JWT)
  ↓
  Route Handler
  ↓
  Controller
  ↓
  Agent Orchestrator
  ↓
  ┌─────────────────────────────────┐
  │  Agent 1: Document Retrieval    │ → Vector DB
  │  Agent 2: Paper Retrieval       │ → Vector DB
  │  Agent 3: Summarization         │ ← Vector DB (RAG)
  │  Agent 4: Citation              │
  │  Agent 5: Verification          │ ← Vector DB (RAG)
  └─────────────────────────────────┘
  ↓
  MongoDB (Save Results)
  ↓
  Socket.IO (Real-time Updates) → Frontend
  ↓
  Email Notification
```

### Database Schema

**Users Collection:**
- email, password (hashed), name
- isVerified, verificationToken
- resetPasswordToken

**Surveys Collection:**
- userId, topic, additionalInfo
- status, progress, currentAgent
- documents (uploaded files)
- retrievedPapers (from Agent 2)
- generatedSurvey (from Agent 3)
- citations (from Agent 4)
- verificationReport (from Agent 5)
- plagiarismReport

**Vector Database (ChromaDB):**
- Collection per survey: `survey_{surveyId}`
- Chunks with embeddings
- Metadata: source_type, source_id, chunk_index

---

## 🔧 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error

**Error:** `MongoNetworkError: connect ECONNREFUSED`

**Solution:**
- Ensure MongoDB is running: `mongod`
- Check MONGODB_URI in .env
- For Atlas, check network access whitelist

#### 2. OpenAI API Error

**Error:** `Invalid API key` or `Insufficient quota`

**Solution:**
- Verify OPENAI_API_KEY in .env
- Check API key at https://platform.openai.com/api-keys
- Ensure you have credits

#### 3. ChromaDB Connection Error

**Error:** `Connection refused to localhost:8000`

**Solution:**
- Start ChromaDB: `chroma run --path ./chroma_data`
- Or use cloud-hosted vector DB
- Update CHROMA_HOST in .env

#### 4. Email Not Sending

**Error:** `Error sending email`

**Solution:**
- Check EMAIL_* credentials in .env
- For Gmail, use App Password, not regular password
- Enable "Less secure app access" (not recommended) or use App Password

#### 5. File Upload Error

**Error:** `File too large` or `Invalid file type`

**Solution:**
- Check file size (max 10MB per file)
- Ensure file is PDF, DOC, or DOCX
- Check MAX_FILE_SIZE in .env

#### 6. Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID)
taskkill /PID <PID> /F

# Or change PORT in .env
```

---

## 📚 File Structure Reference

```
backend/
├── agents/
│   ├── AgentOrchestrator.js      # Coordinates all agents
│   ├── DocumentRetrievalAgent.js # Agent 1 ✅
│   └── PaperRetrievalAgent.js    # Agent 2 ✅
├── config/
│   ├── logger.js                 # Winston logger
│   └── vectorDB.js               # ChromaDB client
├── controllers/
│   ├── authController.js         # Auth logic
│   └── surveyController.js       # Survey logic
├── middleware/
│   ├── auth.js                   # JWT verification
│   ├── errorHandler.js           # Error handling
│   ├── rateLimiter.js            # Rate limiting
│   └── upload.js                 # File upload (Multer)
├── models/
│   ├── User.js                   # User schema
│   └── Survey.js                 # Survey schema
├── routes/
│   ├── authRoutes.js             # Auth endpoints
│   └── surveyRoutes.js           # Survey endpoints
├── utils/
│   ├── email.js                  # Email service
│   ├── export.js                 # PDF/DOCX export
│   ├── fileProcessing.js         # File extraction
│   ├── openai.js                 # OpenAI integration
│   └── textProcessing.js         # Text utilities
├── .env.example                  # Environment template
├── .gitignore                    # Git ignore
├── package.json                  # Dependencies
└── server.js                     # Main entry point
```

---

## 🎯 Success Criteria

Your backend is working correctly if:

1. ✅ Server starts without errors
2. ✅ MongoDB connection successful
3. ✅ Health check returns 200 OK
4. ✅ User registration works
5. ✅ Email verification sent (or manual verify works)
6. ✅ Login returns JWT token
7. ✅ Survey creation accepts files
8. ✅ Agent 1 processes documents
9. ✅ Agent 2 retrieves papers
10. ✅ Progress updates via Socket.IO

---

## 📞 Getting Help

### Documentation
- **PRD_LitGenius.md** - Complete requirements
- **PROJECT_SUMMARY.md** - Implementation overview
- **IMPLEMENTATION_STATUS.md** - Detailed progress
- **README.md** - Quick overview

### Logs
- Backend logs: `backend/logs/combined.log`
- Error logs: `backend/logs/error.log`
- Console output: Check terminal

### Debugging
- Enable debug mode: Set `NODE_ENV=development` in .env
- Check MongoDB: Use MongoDB Compass
- Test APIs: Use Postman or curl
- Monitor Socket.IO: Browser DevTools → Network → WS

---

## 🎉 You're Ready!

You now have:
- ✅ Complete backend infrastructure
- ✅ Working authentication system
- ✅ Two fully functional AI agents
- ✅ Vector database integration
- ✅ Real-time progress tracking
- ✅ Export functionality

**Next:** Complete the remaining agents and build the frontend!

**Estimated Time to Full MVP:** 15-22 days

**Good luck with your project! 🚀**
