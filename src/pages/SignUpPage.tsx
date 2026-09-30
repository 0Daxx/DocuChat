import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function SignUpPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // In demo-only mode, redirect to sign-in page
    navigate("/signin");
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
