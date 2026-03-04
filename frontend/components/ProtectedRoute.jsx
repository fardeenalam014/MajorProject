/**
 * ProtectedRoute.jsx
 * Place at: src/components/ProtectedRoute.jsx
 *
 * Usage:
 *   <ProtectedRoute role="creator">  — only creators can enter
 *   <ProtectedRoute role="student">  — only students can enter
 *   <ProtectedRoute>                 — any logged-in user
 */
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  /* still checking token → show nothing (avoids flash) */
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent
          rounded-full animate-spin" />
      </div>
    );
  }

  /* not logged in */
  if (!user) return <Navigate to="/login" replace />;

  /* wrong role */
  if (role && user.role !== role) {
    return <Navigate to={user.role === "creator" ? "/creator-dashboard" : "/student-dashboard"} replace />;
  }

  return children;
}