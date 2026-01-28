# LIT GENIUS Frontend

React-based frontend for the LIT GENIUS automated literature survey generation platform.

## 🎨 Features

- **Beautiful UI** - Modern, gradient-based design with Material-UI
- **Authentication** - Login and Signup pages with validation
- **Dashboard** - View all surveys with status indicators
- **Survey Creation** - Drag-and-drop file upload with form validation
- **Real-time Progress** - Socket.IO integration for live agent updates
- **Survey Viewer** - Formatted display with export options (PDF, DOCX, Markdown)
- **Responsive Design** - Works on desktop, tablet, and mobile

## 📁 Project Structure

```
src/
├── components/
│   └── PrivateRoute.js         # Protected route wrapper
├── context/
│   └── AuthContext.js          # Global auth state
├── pages/
│   ├── Login.js                # Login page
│   ├── Signup.js               # Signup page
│   ├── Dashboard.js            # Survey dashboard
│   ├── CreateSurvey.js         # Survey creation form
│   ├── SurveyProgress.js       # Real-time progress tracking
│   └── SurveyViewer.js         # Survey display & export
├── services/
│   └── api.js                  # API service with axios
├── App.js                      # Main app with routing
├── index.js                    # Entry point
└── index.css                   # Global styles
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- Backend server running on http://localhost:5000

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The app will open at http://localhost:3000

### Environment Variables

Create a `.env` file:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

## 📦 Dependencies

- **react** - UI library
- **react-router-dom** - Routing
- **@mui/material** - Material-UI components
- **axios** - HTTP client
- **socket.io-client** - Real-time communication
- **react-dropzone** - File upload

## 🎨 Pages

### 1. Login (`/login`)
- Email and password authentication
- Password visibility toggle
- Link to signup page
- Beautiful gradient design

### 2. Signup (`/signup`)
- User registration form
- Password validation (min 8 chars, uppercase, lowercase, number)
- Confirm password field
- Email verification message

### 3. Dashboard (`/dashboard`)
- List of all user surveys
- Status indicators (pending, processing, completed, failed)
- Progress bars for processing surveys
- Create new survey button
- View/Delete actions

### 4. Create Survey (`/create-survey`)
- Topic input (required, min 10 chars)
- Additional information textarea
- Drag-and-drop file upload
- File list with remove option
- Max 10 files, 10MB each
- Supports PDF, DOC, DOCX

### 5. Survey Progress (`/survey/:id/progress`)
- Real-time progress updates via Socket.IO
- Overall progress percentage
- Agent pipeline status
- Estimated time remaining
- Auto-redirect to viewer when complete

### 6. Survey Viewer (`/survey/:id`)
- Formatted survey content
- Metadata (topic, dates, word count, paper count)
- Quality scores (verification, originality)
- Export options (PDF, DOCX, Markdown)
- Print functionality
- Citations and references

## 🔐 Authentication Flow

1. User signs up → Email verification sent
2. User verifies email (manual or via link)
3. User logs in → JWT token stored in localStorage
4. Token sent with all API requests
5. Auto-logout on 401 (unauthorized)

## 🔄 Real-time Updates

Socket.IO events:
- `join_survey` - Join survey room
- `progress_update` - Progress percentage and message
- `agent_started` - Agent begins processing
- `agent_completed` - Agent finishes
- `survey_completed` - Survey generation complete
- `error` - Error occurred

---

**Built with ❤️ using React and Material-UI**
