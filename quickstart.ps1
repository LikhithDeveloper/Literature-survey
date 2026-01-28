# Quick Start Script for LIT GENIUS

Write-Host "🚀 LIT GENIUS - Quick Start Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js v16 or higher" -ForegroundColor Red
    exit 1
}

# Check if MongoDB is running
Write-Host ""
Write-Host "Checking MongoDB..." -ForegroundColor Yellow
Write-Host "⚠️  Please ensure MongoDB is running on localhost:27017" -ForegroundColor Yellow
Write-Host "   Or update MONGODB_URI in backend/.env" -ForegroundColor Yellow

# Backend Setup
Write-Host ""
Write-Host "📦 Setting up Backend..." -ForegroundColor Cyan

# Check if .env exists
if (!(Test-Path "backend/.env")) {
    Write-Host "Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item "backend/.env.example" "backend/.env"
    Write-Host "⚠️  Please edit backend/.env with your credentials:" -ForegroundColor Yellow
    Write-Host "   - MONGODB_URI" -ForegroundColor Yellow
    Write-Host "   - OPENAI_API_KEY" -ForegroundColor Yellow
    Write-Host "   - EMAIL credentials" -ForegroundColor Yellow
    Write-Host "   - JWT_SECRET" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to continue after editing .env..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Install backend dependencies
Write-Host ""
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Frontend Setup
Write-Host ""
Write-Host "📦 Setting up Frontend..." -ForegroundColor Cyan
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Summary
Write-Host ""
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Ensure MongoDB is running" -ForegroundColor White
Write-Host "2. (Optional) Start ChromaDB: chroma run --path ./chroma_data" -ForegroundColor White
Write-Host "3. Start Backend: cd backend && npm run dev" -ForegroundColor White
Write-Host "4. Start Frontend: cd frontend && npm start" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "- README.md - Project overview" -ForegroundColor White
Write-Host "- PRD_LitGenius.md - Complete requirements" -ForegroundColor White
Write-Host "- PROJECT_SUMMARY.md - Implementation details" -ForegroundColor White
Write-Host "- IMPLEMENTATION_STATUS.md - Progress tracking" -ForegroundColor White
Write-Host ""
Write-Host "🌐 URLs:" -ForegroundColor Cyan
Write-Host "- Backend: http://localhost:5000" -ForegroundColor White
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "- API Health: http://localhost:5000/api/health" -ForegroundColor White
Write-Host ""
Write-Host "Happy coding! 🎉" -ForegroundColor Green
