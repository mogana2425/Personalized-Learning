# PLIS Deployment & Startup Guide

This guide describes how to run and deploy the **Personalized Learning Intelligence System (PLIS)** codebase.

---

## 1. Project Directory Structure

```
/Personalized Learning
├── backend/
│   ├── src/                    # Node.js + Express TypeScript code
│   ├── dist/                   # Compiled JS code (generated via build)
│   ├── uploads/                # Local storage fallback directory for OCR scans
│   ├── tsconfig.json           # TypeScript configuration
│   └── .env                    # Port, DB links, API keys
├── frontend/
│   ├── src/                    # React Native Expo app components & screens
│   ├── App.tsx                 # Root React entry
│   └── package.json            # React Native app packages
└── DEPLOYMENT.md               # Setup instructions (This file)
```

---

## 2. Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: Version 18.x or newer.
- **MongoDB**: A running MongoDB instance locally (`mongodb://localhost:27017/plis`) or a MongoDB Atlas URI.
- **Expo Go App**: (Optional) Downloaded on your iOS or Android physical device to test mobile screens wirelessly, or local emulators (Xcode/Android Studio) configured.

---

## 3. Backend API Setup & Startup

1. Open your terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Make sure dependencies are installed:
   ```bash
   npm install
   ```

3. Review the environment configuration file `backend/.env`. It includes the following default variables:
   ```env
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/plis
   JWT_SECRET=plis_super_secret_jwt_key_2026_safe_and_secure
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   NODE_ENV=development
   ```

4. Compile and start the backend in **Development** mode (utilizes automatic reloads on save):
   ```bash
   npm run dev
   ```

5. Or build and run in **Production** mode:
   ```bash
   npm run build
   npm start
   ```

Once started, the backend server will run at: **`http://localhost:5001`** and will automatically establish connection to MongoDB.

---

## 4. Frontend React Native (Expo) Setup & Startup

1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Start the Expo Metro Bundler:
   ```bash
   npm start
   ```

3. **Accessing the App**:
   - **iOS Simulator**: Press **`i`** in the terminal to launch on Xcode simulator.
   - **Android Emulator**: Press **`a`** to launch on Android Studio emulator.
   - **Physical Device**: Scan the QR code displayed in your terminal using the camera app (iOS) or the Expo Go app (Android).

*Note: The frontend automatically detects the platform and bridges to the API server at `http://localhost:5001` (for iOS/Web) and `http://10.0.2.2:5001` (for Android emulators).*

---

## 5. Testing the Roles (Demo Bypass)

To facilitate immediate testing and presentation of all four role dashboards, we built a **Quick Access Bypass Panel** on the login screen. You can tap on any of the following buttons to instantly sign in as a pre-configured account:
1. **STUDENT**: Accesses progress rings, weekly graphs, personalized timelines, the chatbot tutor, and paper upload scanner.
2. **TEACHER**: Accesses student lists, risk score indicators, class averages, and quiz creators.
3. **PARENT**: Monitors linked child progress rates, learning logs, and exports PDF progress cards.
4. **ADMIN**: Inspects system health diagnostics, total registered accounts counts, and registers study materials.

---

## 6. AI and OCR grading pipeline

- **OCR Text Extraction**: When an answer sheet is submitted (via camera snap or document browser), the server stores it locally (in `backend/uploads/`) or uploads it to Cloudinary. It then runs `tesseract.js` to extract handwritten text.
- **AI Evaluation**: The extracted text is sent to the Gemini API (`gemini-1.5-flash`) which grades it against the subject criteria, returns marks, lists mistakes, recommends study topics, and compiles actionable feedback.
- **Mock Fallback**: If the `GEMINI_API_KEY` is not set or calls fail, the server automatically defaults to high-quality mock data, simulating full OCR parsing and Gemini grading so the app remains fully functional out-of-the-box.
