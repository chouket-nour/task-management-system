import React, { useState } from "react";
import { signup } from "../services/api";
import { useNavigate } from "react-router-dom";

const RFCLogo = () => (
  <div style={{ marginBottom: "32px" }}>
    <img
      src="/assets/logo.png"
      alt="RFC"
      style={{ height: "48px", width: "auto" }}
    />
  </div>
);

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("EMPLOYEE");

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    try {
      await signup(name, email, password, role);
      setIsError(false);
      setMessage("✓  Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.");
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .auth-bg {
          min-height: 100vh;
          background: linear-gradient(145deg, #eef2ff 0%, #f0f7ff 40%, #e8f4fd 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
          padding: 32px 16px;
        }

        .auth-bg::before {
          content: '';
          position: absolute;
          top: -120px;
          right: -120px;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(26,86,219,0.08) 0%, transparent 70%);
          border-radius: 50%;
        }

        .auth-bg::after {
          content: '';
          position: absolute;
          bottom: -100px;
          left: -100px;
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, rgba(14,63,168,0.06) 0%, transparent 70%);
          border-radius: 50%;
        }

        .auth-card {
          background: white;
          border-radius: 20px;
          padding: 44px 44px 40px;
          width: 100%;
          max-width: 460px;
          box-shadow: 0 8px 40px rgba(26, 86, 219, 0.08), 0 2px 8px rgba(0,0,0,0.04);
          position: relative;
          z-index: 1;
        }

        .auth-title {
          font-family: 'Sora', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 28px;
          letter-spacing: -0.5px;
        }

        .field-group {
          margin-bottom: 18px;
        }

        .field-label {
          display: block;
          font-size: 13.5px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 7px;
          font-family: 'Sora', sans-serif;
        }

        .field-wrapper {
          position: relative;
        }

        .auth-input {
          width: 100%;
          padding: 11px 16px;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14.5px;
          color: #111827;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          background: #fafafa;
        }

        .auth-input::placeholder { color: #9ca3af; }

        .auth-input:focus {
          border-color: #1a56db;
          box-shadow: 0 0 0 3px rgba(26,86,219,0.1);
          background: white;
        }

        .auth-select {
          width: 100%;
          padding: 11px 16px;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14.5px;
          color: #111827;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          background: #fafafa;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 40px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .auth-select:focus {
          border-color: #1a56db;
          box-shadow: 0 0 0 3px rgba(26,86,219,0.1);
          background-color: white;
        }

        .toggle-password {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          display: flex;
          align-items: center;
          padding: 4px;
          transition: color 0.2s;
        }
        .toggle-password:hover { color: #4b5563; }

        .checkbox-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          cursor: pointer;
        }

        .custom-checkbox {
          width: 17px;
          height: 17px;
          border: 1.5px solid #d1d5db;
          border-radius: 4px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          background: white;
        }

        .custom-checkbox.checked {
          background: #1a56db;
          border-color: #1a56db;
        }

        .checkbox-label {
          font-size: 13.5px;
          color: #4b5563;
          font-family: 'DM Sans', sans-serif;
          user-select: none;
        }

        .auth-btn {
          width: 100%;
          padding: 13px;
          background: #111827;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'Sora', sans-serif;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
          letter-spacing: 0.1px;
        }

        .auth-btn:hover:not(:disabled) {
          background: #1f2937;
          box-shadow: 0 4px 16px rgba(17,24,39,0.18);
          transform: translateY(-1px);
        }

        .auth-btn:active:not(:disabled) { transform: translateY(0); }
        .auth-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .auth-message {
          margin-top: 14px;
          padding: 11px 14px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
        }

        .auth-message.error {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .auth-message.success {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #86efac;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 500;
        }

        .auth-footer {
          margin-top: 22px;
          text-align: center;
          font-size: 14px;
          color: #6b7280;
          font-family: 'DM Sans', sans-serif;
        }

        .auth-link {
          color: #1a56db;
          font-weight: 600;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          transition: color 0.2s;
        }

        .auth-link:hover { color: #0e3fa8; text-decoration: underline; }

        .divider {
          height: 1px;
          background: #f3f4f6;
          margin: 24px 0;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
          vertical-align: middle;
          margin-right: 8px;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .card-fade-in {
          animation: fadeUp 0.4s ease both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="auth-bg">
        <div className="auth-card card-fade-in">
          <RFCLogo />
          <h2 className="auth-title">Créer un compte</h2>

          <form onSubmit={handleSubmit}>
            <div className="field-group">
              <label className="field-label">Nom complet</label>
              <input
                className="auth-input"
                type="text"
                placeholder="Jean Dupont"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="field-group">
              <label className="field-label">Email</label>
              <input
                className="auth-input"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field-group">
              <label className="field-label">Mot de passe</label>
              <div className="field-wrapper">
                <input
                  className="auth-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingRight: "44px" }}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Rôle</label>
              <select
                className="auth-select"
                value={role}
                onChange={e => setRole(e.target.value)}
              >
                <option value="EMPLOYEE">Employé</option>
                <option value="MANAGER">Manager</option>
              </select>
            </div>

            <button className="auth-btn" type="submit" disabled={isLoading}>
              {isLoading && <span className="spinner" />}
              {isLoading ? "Création…" : "Créer mon compte"}
            </button>
          </form>

          {message && (
            <div className={`auth-message ${isError ? "error" : "success"}`}>
              {message}
            </div>
          )}

          <div className="divider" />

          <div className="auth-footer">
            Vous avez déjà un compte ?{" "}
            <button className="auth-link" onClick={() => navigate("/login")}>
              Se connecter
            </button>
          </div>
        </div>
      </div>
    </>
  );
}