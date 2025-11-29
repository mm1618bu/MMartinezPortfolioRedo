import { useState } from "react";
import { supabase } from "../../supabase.ts";
import "../../styles/main.css";

export default function RegisterPage() {
  const [emailOrUser, setEmailOrUser] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const { data, error } = await supabase.auth.signUp({
      email: emailOrUser,
      password: password,
      options: {
        emailRedirectTo: `${window.location.origin}/LoginPage`
      }
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    setSuccessMsg("Success! Check your email to confirm your account.");
    setLoading(false);

    // Optional: redirect after signup (if email confirmation is OFF)
    // window.location.href = "/LoginPage";
  };

  return (
    <div className="User-Form">
      <form onSubmit={handleRegister}>
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
          {loading ? "Registering..." : "Register"}
        </button>

        {errorMsg && <p className="Error-Text">{errorMsg}</p>}
        {successMsg && <p className="Success-Text">{successMsg}</p>}

        <br />
        <br />

        <p>
          <a href="/LoginPage">Have an Account?</a>
        </p>
      </form>
    </div>
  );
}
