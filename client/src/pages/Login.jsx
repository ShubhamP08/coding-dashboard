import { Link, useNavigate } from "react-router-dom";
import { Grid2X2, Loader2, Mail, LockKeyhole } from "lucide-react";
import { useState } from "react";
import api from "../api/client";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/users/login", form);
      localStorage.setItem("token", response.data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Link to="/" className="brand auth-brand">
          <span className="brand-mark">
            <Grid2X2 size={24} />
          </span>
          <span>Coding Dashboard</span>
        </Link>

        <div className="auth-copy">
          <h1>Welcome back</h1>
          <p>Sign in to continue tracking your coding progress.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <div className="input-wrap">
              <Mail size={18} />
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={updateField}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
          </label>

          <label className="field">
            <span>Password</span>
            <div className="input-wrap">
              <LockKeyhole size={18} />
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={updateField}
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>
          </label>

          {error && <p className="form-error">{error}</p>}

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? <Loader2 className="spin" size={18} /> : null}
            Login
          </button>
        </form>

        <p className="auth-switch">
          New here? <Link to="/register">Create account</Link>
        </p>
      </section>
    </main>
  );
};

export default Login;
