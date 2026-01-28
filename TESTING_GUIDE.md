# 🧪 Testing Guide - LIT GENIUS

## ✅ Rate Limiter Fixed

**Changes Made:**
- ✅ Increased auth rate limit from 5 to **50 requests per 5 minutes**
- ✅ Email verification now **optional in development** mode
- ✅ Login should work smoothly now

---

## 🔐 Authentication Testing

### **1. Register a New User**

**Frontend:**
- Go to http://localhost:3000/signup
- Fill in:
  - Name: Test User
  - Email: test@example.com
  - Password: Test@1234
  - Confirm Password: Test@1234
- Click "Sign Up"

**API (PowerShell):**
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

**Expected Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "userId": "..."
}
```

---

### **2. Login (Email Verification Skipped in Dev)**

Since email is not configured, verification is automatically skipped in development mode!

**Frontend:**
- Go to http://localhost:3000/login
- Enter:
  - Email: test@example.com
  - Password: Test@1234
- Click "Login"
- Should redirect to dashboard ✅

**API (PowerShell):**
```powershell
$body = @{
    email = "test@example.com"
    password = "Test@1234"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

# Save token
$token = $response.token
Write-Host "Token: $token"
Write-Host "User: $($response.user.name)"
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "test@example.com",
    "isVerified": false
  }
}
```

---

### **3. Access Protected Routes**

**Get Current User:**
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/me" `
    -Method GET `
    -Headers $headers
```

---

## 📝 Create Survey Test

### **Frontend:**
1. Login to dashboard
2. Click "Create New Survey"
3. Enter topic: "Machine Learning in Healthcare"
4. (Optional) Add additional info
5. (Optional) Upload PDF files
6. Click "Start Survey"
7. Watch real-time progress ✅

### **API:**
```powershell
# Create a test file
"This is a test document about machine learning." | Out-File -FilePath "test.txt"

# Create survey
$headers = @{
    Authorization = "Bearer $token"
}

$form = @{
    topic = "Machine Learning in Healthcare"
    additionalInfo = "Focus on diagnostic applications"
    documents = Get-Item -Path "test.txt"
}

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/surveys/create" `
    -Method POST `
    -Headers $headers `
    -Form $form

Write-Host "Survey ID: $($response.surveyId)"
```

---

## 🔍 Check Survey Status

```powershell
$surveyId = $response.surveyId

Invoke-RestMethod -Uri "http://localhost:5000/api/surveys/$surveyId" `
    -Method GET `
    -Headers $headers
```

---

## 📊 Get All Surveys

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/surveys" `
    -Method GET `
    -Headers $headers
```

---

## 🐛 Troubleshooting

### **Issue: "Too many authentication attempts"**
**Solution:** ✅ FIXED! Rate limit increased to 50 requests per 5 minutes

### **Issue: "Please verify your email"**
**Solution:** ✅ FIXED! Email verification skipped in development mode

### **Issue: "Invalid credentials"**
**Possible Causes:**
1. Wrong email or password
2. User doesn't exist
3. Check MongoDB for user:
   ```javascript
   db.users.find({ email: "test@example.com" })
   ```

### **Issue: Can't login after signup**
**Solution:**
- In development mode (NODE_ENV=development) without email configured, verification is automatically skipped
- Just login directly after signup ✅

---

## ✅ What Should Work Now

1. ✅ **Signup** - Create new user
2. ✅ **Login** - No email verification needed in dev
3. ✅ **Dashboard** - View surveys
4. ✅ **Create Survey** - With file upload
5. ✅ **Progress Tracking** - Real-time updates
6. ✅ **View Survey** - See results
7. ✅ **Export** - Download as PDF/DOCX/Markdown

---

## 🚀 Quick Test Flow

### **Complete Test (5 minutes):**

1. **Start Backend** (if not running):
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm start
   ```

3. **Test Flow**:
   - Visit http://localhost:3000
   - Click "Sign Up"
   - Create account
   - Login (no verification needed!)
   - Create survey
   - Watch progress
   - View results

---

## 📝 Test Credentials

**Default Test User:**
- Email: test@example.com
- Password: Test@1234

**Create More Users:**
- Email: user2@example.com
- Password: User2@1234

---

## 🎯 Expected Behavior

### **Signup:**
- ✅ Success message
- ✅ User created in MongoDB
- ⚠️  Email not sent (optional in dev)

### **Login:**
- ✅ Returns JWT token
- ✅ Returns user data
- ✅ Works without email verification in dev

### **Create Survey:**
- ✅ Accepts files
- ✅ Starts agent pipeline
- ✅ Real-time progress updates
- ✅ Completes successfully

---

## 🔧 MongoDB Quick Checks

### **View All Users:**
```javascript
db.users.find().pretty()
```

### **Manually Verify User:**
```javascript
db.users.updateOne(
  { email: "test@example.com" },
  { $set: { isVerified: true } }
)
```

### **View All Surveys:**
```javascript
db.surveys.find().pretty()
```

### **Delete Test Data:**
```javascript
// Delete all users
db.users.deleteMany({})

// Delete all surveys
db.surveys.deleteMany({})
```

---

## ✅ Success Indicators

**Backend:**
```
✅ MongoDB Connected: localhost
✅ Server running on http://localhost:5000
✅ Socket.IO initialized
```

**Frontend:**
```
✅ Compiled successfully!
✅ webpack compiled with 0 errors
✅ On Your Network: http://localhost:3000
```

**Login:**
```
✅ Token received
✅ User data returned
✅ Redirected to dashboard
```

---

## 🎉 Everything Should Work Now!

The rate limiting issue is fixed and email verification is optional in development mode.

**Try logging in now - it should work perfectly!** ✅

---

**Happy Testing! 🚀**
