import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ExamPage from "../pages/ExamPage";
import TestCreator from "../pages/TestCreator";
import StudentDashboard from "../pages/StudentDashboard";
import CreatorDashboard from "../pages/CreatorDashboard";
import AdvanceExamPage from "../pages/AdvanceExamPAge";
import LandingPage from "../pages/LandingPage";

// simple auth check
const isLoggedIn = () => {
  return localStorage.getItem("user");
};

// protect exam page
function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/creator-dashboard" element={<CreatorDashboard />} />

        <Route
          path="/exam/:testId"
          element={
            <PrivateRoute>
              <AdvanceExamPage/>
            </PrivateRoute>
          }
        />
        <Route path="/create-test" element={<TestCreator />} />
        <Route path="/create-test/:testId" element={<TestCreator />} />
      </Routes>
    </BrowserRouter>
  );
}
