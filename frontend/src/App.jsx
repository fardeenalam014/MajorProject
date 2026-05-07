import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import LandingPage from "../pages/LandingPage";
import Login from "../pages/Login";
import Register from "../pages/Register";
import AboutPage from "../pages/AboutPage";
import ContactPage from "../pages/ContactPage";
import CreatorDashboard from "../pages/CreatorDashboard";
import StudentDashboard from "../pages/StudentDashboard";
import ExamPage from "../pages/ExamPage";
import CreateTestPage from "../pages/CreateTestPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/creator-dashboard" element={<ProtectedRoute role="creator"><CreatorDashboard /></ProtectedRoute>} />
          <Route path="/create-test" element={<ProtectedRoute role="creator"><CreateTestPage /></ProtectedRoute>} />
          <Route path="/create-test/:testId" element={<ProtectedRoute role="creator"><CreateTestPage /></ProtectedRoute>} />
          <Route path="/student-dashboard" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/exam/:id" element={<ProtectedRoute role="student"><ExamPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
