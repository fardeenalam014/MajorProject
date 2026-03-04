// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import Login from "../pages/Login";
// import Register from "../pages/Register";
// import ExamPage from "../pages/ExamPage";
// import TestCreator from "../pages/TestCreator";
// import StudentDashboard from "../pages/StudentDashboard";
// import CreatorDashboard from "../pages/CreatorDashboard";
// import AdvanceExamPage from "../pages/AdvanceExamPAge";
// import LandingPage from "../pages/LandingPage";

// // simple auth check
// const isLoggedIn = () => {
//   return localStorage.getItem("user");
// };

// // protect exam page
// function PrivateRoute({ children }) {
//   return isLoggedIn() ? children : <Navigate to="/" />;
// }

// export default function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/" element={<LandingPage />} />
//         <Route path="/login" element={<Login />} />
//         <Route path="/register" element={<Register />} />
//         <Route path="/student-dashboard" element={<StudentDashboard />} />
//         <Route path="/creator-dashboard" element={<CreatorDashboard />} />

//         <Route
//           path="/exam/:testId"
//           element={
//             <PrivateRoute>
//               <AdvanceExamPage/>
//             </PrivateRoute>
//           }
//         />
//         <Route path="/create-test" element={<TestCreator />} />
//         <Route path="/create-test/:testId" element={<TestCreator />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

/**
 * App.jsx
 * Place at: src/App.jsx
 *
 * Install dependencies first:
 *   npm install react-router-dom framer-motion lucide-react
 *
 * Add to .env (Vite):
 *   VITE_API_URL=http://localhost:5000/api
 */
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import ProtectedRoute   from "../components/ProtectedRoute";

/* Public pages */
import LandingPage from "../pages/LandingPage";
import Login    from "../pages/Login";
import Register from "../pages/Register";

/* Protected pages */
import CreatorDashboard  from "../pages/CreatorDashboard";
import StudentDashboard  from "../pages/StudentDashboard";
import ExamPage          from "../pages/ExamPage";
import CreateTestPage from "../pages/CreateTestPage";

/*
 * Uncomment when you create these pages:
 * import LandingPage    from "./pages/LandingPage";
 * 
 */

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* ── Public ── */}
          <Route path="/"         element={<LandingPage />} />
          <Route path="/login"    element={<Login/>} />
          <Route path="/register" element={<Register />} />

          {/* ── Creator only ── */}
          <Route path="/creator-dashboard" element={
            <ProtectedRoute role="creator">
              <CreatorDashboard />
            </ProtectedRoute>
          } />

          {/* Uncomment when CreateTestPage is ready */}
          
          <Route path="/create-test"     element={
            <ProtectedRoute role="creator"><CreateTestPage /></ProtectedRoute>
          } />
          <Route path="/create-test/:testId" element={
            <ProtectedRoute role="creator"><CreateTestPage /></ProtectedRoute>
          } />
         

          {/* ── Student only ── */}
          <Route path="/student-dashboard" element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          } />

          <Route path="/exam/:id" element={
            <ProtectedRoute role="student">
              <ExamPage />
            </ProtectedRoute>
          } />

          {/* ── Catch-all ── */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}