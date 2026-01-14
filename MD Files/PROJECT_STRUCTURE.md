# SSB Student Portal - Full Stack Project Structure

## 🎯 **Project Overview**
Full-stack student portal for Scaler School of Business with React frontend and Google Apps Script backend.

## 📁 **Project Structure**
```
ssb-student-portal/
├── 🌐 FRONTEND (React + TypeScript)
│   ├── src/
│   │   ├── components/
│   │   │   └── Login.tsx          # Main login component
│   │   ├── firebase/
│   │   │   └── config.ts          # Firebase configuration
│   │   ├── App.tsx                # Main app component
│   │   ├── index.tsx              # App entry point
│   │   └── index.css              # Global styles
│   ├── public/                    # Static assets
│   ├── package.json               # Dependencies & scripts
│   └── tailwind.config.js         # Tailwind CSS config
│
├── 🔧 BACKEND (Google Apps Script)
│   ├── Code.js                    # Main backend logic (2300+ lines)
│   ├── appsscript.json            # Apps Script config
│   ├── .clasp.json                # Local development config
│   └── README.md                  # Backend documentation
│
└── 📚 DOCUMENTATION
    ├── PROJECT_STRUCTURE.md       # This file
    └── README.md                  # Main project readme
```

## 🚀 **Available Scripts**

### Frontend Development
- `npm start` - Start React development server (http://localhost:3000)
- `npm run build` - Build for production
- `npm test` - Run tests

### Backend Development  
- `npm run backend:push` - Push local backend changes to Google Apps Script
- `npm run backend:pull` - Pull latest backend changes from cloud
- `npm run backend:deploy` - Deploy backend as web app
- `npm run backend:logs` - View backend execution logs
- `npm run backend:open` - Open backend in Apps Script editor

### Integrated Development
- `npm run dev` - Run frontend + backend with auto-sync
- `npm run backend:watch` - Auto-push backend changes on file save

## 🏗️ **Architecture Overview**

### Frontend (React)
- **Framework**: React 19 + TypeScript  
- **Styling**: Tailwind CSS with custom animations
- **Authentication**: Firebase Auth (Google OAuth)
- **State Management**: React hooks + Context API
- **UI Components**: Custom components with Lucide React icons

### Backend (Google Apps Script)
- **Runtime**: Google Apps Script (V8 runtime)
- **Data Sources**: Multiple Google Sheets
- **Storage**: Google Drive integration
- **Authentication**: Firebase + Google OAuth
- **APIs**: RESTful endpoints via doGet/doPost

### Data Flow
```
React App (Port 3000)
    ↓ Authentication
Firebase Auth  
    ↓ API Requests
Google Apps Script Backend
    ↓ Data Operations  
Google Sheets (Database)
    ↓ File Storage
Google Drive
```

## 🔑 **Key Features**

### Frontend Features
- **Modern Login UI**: Cosmic-themed login with animations
- **Firebase Integration**: Secure Google authentication  
- **Responsive Design**: Mobile-first responsive layout
- **Real-time Updates**: Live dashboard metrics
- **Toast Notifications**: User feedback system

### Backend Features
- **Data Synchronization**: Real-time sync across multiple sheets
- **Student Management**: Application tracking and status updates
- **Company Management**: Placement and recruitment data
- **Analytics Dashboard**: Real-time metrics and reporting
- **File Management**: Google Drive integration for documents
- **Email Integration**: Automated student communications

## 🛠️ **Development Workflow**

### Frontend Development
1. Make changes to React components in `src/`
2. Changes auto-reload at `http://localhost:3000`
3. Test authentication with Firebase
4. Build for production with `npm run build`

### Backend Development  
1. Edit `backend/Code.js` locally
2. Push changes with `npm run backend:push`
3. Test in Apps Script editor
4. Deploy with `npm run backend:deploy`

### Full-Stack Development
1. Run `npm run dev` for integrated development
2. Frontend runs on `localhost:3000`
3. Backend auto-syncs on file changes
4. Test full authentication flow

## 🔗 **External Integrations**

### Google Services
- **Apps Script**: Backend runtime and APIs
- **Sheets API**: Data storage and management
- **Drive API**: File storage and sharing  
- **Gmail API**: Email communications

### Firebase Services
- **Authentication**: User login/logout
- **Firestore**: Potential future database
- **Hosting**: Deployment platform

## 🌐 **Deployment**

### Frontend Deployment
- **Platform**: Firebase Hosting (recommended)
- **Build Command**: `npm run build`
- **Deploy Command**: `firebase deploy`

### Backend Deployment
- **Platform**: Google Apps Script
- **Deploy Command**: `npm run backend:deploy`
- **Access**: Web app URL provided after deployment

## 📊 **Current Status**
- ✅ Frontend: Basic login and dashboard setup
- ✅ Backend: Comprehensive business logic implemented  
- ✅ Authentication: Firebase Google OAuth working
- ✅ Development Environment: Full local development setup
- 🚧 Integration: Frontend-backend API connections in progress

## 🔧 **Next Development Steps**
1. Connect frontend to backend APIs
2. Implement dashboard data fetching
3. Add student application features
4. Enhance UI/UX with animations
5. Add mobile responsiveness
6. Implement real-time updates