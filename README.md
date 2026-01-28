# LIT GENIUS - Automated Literature Survey Generation

An AI-powered platform that automates literature survey generation using multi-agent collaboration and Retrieval-Augmented Generation (RAG).

## 🚀 Features

- **Multi-Agent AI System**: 5 specialized agents working in coordination
- **RAG-Powered**: Grounded, accurate content generation
- **Multiple Sources**: ArXiv, Google Scholar, PubMed, Semantic Scholar
- **Plagiarism Checking**: AI-powered originality verification
- **Citation Management**: Automatic APA-style citations
- **Export Options**: PDF, DOCX, Markdown formats

## 🛠️ Tech Stack

### Frontend
- React.js (JavaScript)
- Material-UI
- Axios
- Socket.io-client
- React Router

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- Socket.io
- OpenAI API
- Vector Database (Pinecone/ChromaDB)

## 📁 Project Structure

```
MAJOR/
├── backend/           # Express.js backend
│   ├── config/       # Configuration files
│   ├── controllers/  # Route controllers
│   ├── models/       # Mongoose models
│   ├── routes/       # API routes
│   ├── middleware/   # Custom middleware
│   ├── agents/       # AI agent implementations
│   ├── utils/        # Utility functions
│   └── server.js     # Entry point
├── frontend/         # React frontend
│   ├── public/       # Static files
│   └── src/          # Source files
│       ├── components/
│       ├── pages/
│       ├── context/
│       ├── services/
│       └── App.js
└── PRD_LitGenius.md  # Product Requirements Document
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- OpenAI API Key
- Vector Database account (Pinecone/ChromaDB)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd MAJOR
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm start
```

### Environment Variables

Create `.env` files in both backend and frontend directories. See `.env.example` for required variables.

## 📖 Documentation

- [Product Requirements Document](./PRD_LitGenius.md)
- [API Documentation](./docs/API.md) (Coming soon)
- [Agent Architecture](./docs/AGENTS.md) (Coming soon)

## 🤝 Contributing

This is an academic project. Contributions are welcome!

## 📄 License

MIT License

## 👥 Team

Developed as a Major Project for academic research.

## 🙏 Acknowledgments

- OpenAI for GPT API
- ArXiv for research paper access
- Semantic Scholar for academic data
