import { useState } from "react";
import { supabase } from "../../supabase.ts";
import "../../styles/main.css";

export default function LoginPage() {
  const [emailOrUser, setEmailOrUser] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    // Supabase only supports email login natively
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailOrUser,
      password: password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    // Logged in successfully
    window.alert("User logged in:", data);
    setLoading(false);

    // Optional redirect
    window.location.href = "/";
  };

  return (
    <div className="User-Form">
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Email"
          required
          value={emailOrUser}
          onChange={(e) => setEmailOrUser(e.target.value)}
        />
        <br />

        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <br />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        {errorMsg && <p className="Error-Text">{errorMsg}</p>}

        <br />
        <br />

        <p>
          <a href="/ForgotPassword">Forgot Password?</a> |{" "}
          <a href="/RegisterPage">Register</a>
        </p>
      </form>
    </div>
  );
}
