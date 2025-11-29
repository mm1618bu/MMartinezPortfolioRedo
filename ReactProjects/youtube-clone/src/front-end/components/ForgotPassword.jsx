import { useState } from "react";
import { supabase } from "../../supabase.ts";
import "../../styles/main.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/UpdatePassword`,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    setSuccessMsg("Check your email for the password reset link.");
    setLoading(false);
  };

  return (
    <div className="User-Form">
      <form onSubmit={handleReset}>
        <input
          type="text"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />

        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Reset"}
        </button>

        {errorMsg && <p className="Error-Text">{errorMsg}</p>}
        {successMsg && <p className="Success-Text">{successMsg}</p>}

        <br />
        <br />

        <p>
          <a href="/LoginPage">Back to Login</a>
        </p>
      </form>
    </div>
  );
}
