
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent
          rounded-full animate-spin" />
      </div>
    );
  }

  
  if (!user) return <Navigate to="/login" replace />;

 
  if (role && user.role !== role) {
    return <Navigate to={user.role === "creator" ? "/creator-dashboard" : "/student-dashboard"} replace />;
  }

  return children;
}