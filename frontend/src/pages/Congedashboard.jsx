import React, { useState, useEffect } from "react";
import axios from "axios";

const LEAVE_API = axios.create({ baseURL: "http://localhost:5000/api/conges" });
const USER_API  = axios.create({ baseURL: "http://localhost:5000/api/users" });
const getH = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const leaveTypes = ["Congé payé", "RTT", "Congé maladie", "Congé sans solde"];

const statusStyle = (s) =>
  s === "Approuvé" ? { color: "#059669", bg: "#f0fdf4" } :
  s === "Refusé"   ? { color: "#dc2626", bg: "#fef2f2" } :
                     { color: "#d97706", bg: "#fffbeb" };

const S = {
  card:      { background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: "24px" },
  statCard:  (color) => ({ background: "white", borderRadius: "16px", padding: "22px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", borderTop: `4px solid ${color}` }),
  cardTitle: { fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "16px" },
  badge:     (color, bg) => ({ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "99px", fontSize: "11.5px", fontWeight: "600", color, background: bg }),
  label:     { display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" },
  input:     { width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: "10px", fontSize: "14px", fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none", background: "#fafafa", boxSizing: "border-box" },
};

const diffDays = (start, end) => {
  const d1 = new Date(start), d2 = new Date(end);
  if (isNaN(d1) || isNaN(d2) || d2 < d1) return 0;
  return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
};

export default function CongeDashboard() {
  const [leaves,    setLeaves]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [submitting,setSubmitting]= useState(false);
  const [success,   setSuccess]   = useState(false);
  const [user,      setUser]      = useState({ name: "" });
  const [managerId, setManagerId] = useState("");

  const [form, setForm] = useState({
    type: "Congé payé", startDate: "", endDate: "", reason: ""
  });

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
    loadLeaves();
    loadManager();
  }, []);

  const loadManager = async () => {
    try {
      // Récupérer tous les users et trouver le premier MANAGER
      const res = await USER_API.get("/", getH());
      const manager = res.data.find(u => u.role === "MANAGER");
      if (manager) {
        setManagerId(manager.authId || manager._id);
        console.log("[CONGE] Manager trouvé:", manager.name, manager.authId || manager._id);
      }
    } catch (err) {
      console.error("[CONGE] Erreur chargement manager:", err.message);
    }
  };

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const res = await LEAVE_API.get("/my", getH());
      setLeaves(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const submitLeave = async () => {
    if (!form.startDate || !form.endDate) return;
    const days = diffDays(form.startDate, form.endDate);
    if (days <= 0) return;
    setSubmitting(true);
    try {
      const res = await LEAVE_API.post("/", {
        ...form,
        days,
        employeeName: user.name,
        managerId,
      }, getH());
      setLeaves(p => [res.data, ...p]);
      setForm({ type: "Congé payé", startDate: "", endDate: "", reason: "" });
      setShowForm(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const cancelLeave = async (id) => {
    try {
      await LEAVE_API.delete(`/${id}`, getH());
      setLeaves(p => p.filter(l => l._id !== id));
    } catch (err) { console.error(err); }
  };

  const days = form.startDate && form.endDate ? diffDays(form.startDate, form.endDate) : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .leave-input:focus { border-color: #3b82f6 !important; background: white !important; }
        .leave-row { padding: 16px; background: #f8fafc; border-radius: 12px; margin-bottom: 10px; border: 1px solid #e2e8f0; transition: box-shadow 0.15s; }
        .leave-row:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .btn-primary { border: none; border-radius: 10px; padding: 11px 24px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; background: #1e40af; color: white; transition: background 0.15s; }
        .btn-primary:hover { background: #1d4ed8; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-secondary { border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 10px 20px; font-size: 13.5px; font-weight: 600; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; background: white; color: #64748b; transition: background 0.15s; }
        .btn-secondary:hover { background: #f1f5f9; }
        .btn-cancel { border: none; border-radius: 8px; padding: 5px 12px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; background: #fef2f2; color: #dc2626; transition: opacity 0.15s; }
        .btn-cancel:hover { opacity: 0.8; }
        .slide-in { animation: slideIn 0.3s ease both; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .success-banner { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 20px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; color: #059669; font-weight: 600; font-size: 14px; }
      `}</style>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "20px", marginBottom: "28px" }}>
        {[
          { label: "Total demandes",  value: leaves.length,                                       color: "#3b82f6" },
          { label: "En attente",      value: leaves.filter(l => l.status === "En attente").length, color: "#3b82f6" },
          { label: "Approuvées",      value: leaves.filter(l => l.status === "Approuvé").length,   color: "#3b82f6" },
          { label: "Refusées",        value: leaves.filter(l => l.status === "Refusé").length,     color: "#3b82f6" },
        ].map((s, i) => (
          <div key={i} style={S.statCard(s.color)}>
            <div style={{ fontSize: "28px", fontWeight: "800", color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "6px", fontWeight: "500" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Solde */}
      <div style={S.card}>
        <div style={S.cardTitle}>Solde de congés</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px" }}>
          {[
            { label: "Congés payés restants",  value: "18 jours", color: "#3b82f6"},
            { label: "RTT restants",            value: "5 jours",  color: "#3b82f6" },
            { label: "Jours pris cette année",  value: `${leaves.filter(l=>l.status==="Approuvé").reduce((a,l)=>a+l.days,0)} jours`, color: "#3b82f6" },
          ].map((c, i) => (
            <div key={i} style={{ padding: "16px", background: "#f8fafc", borderRadius: "12px", borderLeft: `4px solid ${c.color}`, display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ fontSize: "28px" }}>{c.icon}</div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: "800", color: c.color }}>{c.value}</div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{c.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bouton + formulaire */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showForm ? "24px" : "0" }}>
          <div style={S.cardTitle}>Nouvelle demande de congé</div>
          {!showForm
            ? <button className="btn-primary" onClick={() => setShowForm(true)}>+ Nouvelle demande</button>
            : <button className="btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
          }
        </div>

        {success && (
          <div className="success-banner slide-in"> Demande envoyée avec succès !</div>
        )}

        {showForm && (
          <div className="slide-in">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={S.label}>Type de congé</label>
                <select className="leave-input" style={S.input} value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  {leaveTypes.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Nombre de jours</label>
                <div style={{ ...S.input, background: "#f1f5f9", color: days > 0 ? "#1e40af" : "#94a3b8", fontWeight: "700", fontSize: "16px", display: "flex", alignItems: "center" }}>
                  {days > 0 ? `${days} jour${days > 1 ? "s" : ""}` : "—"}
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={S.label}>Date de début</label>
                <input className="leave-input" type="date" style={S.input} value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div>
                <label style={S.label}>Date de fin</label>
                <input className="leave-input" type="date" style={S.input} value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
              </div>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={S.label}>Motif (optionnel)</label>
              <textarea className="leave-input" style={{ ...S.input, minHeight: "80px", resize: "vertical" }} placeholder="Précisez le motif de votre demande..." value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button className="btn-primary" onClick={submitLeave} disabled={submitting || days <= 0}>
                {submitting ? "Envoi en cours..." : " Envoyer la demande"}
              </button>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
            </div>
          </div>
        )}
      </div>

      {/* Historique */}
      <div style={S.card}>
        <div style={S.cardTitle}>Mes demandes de congé ({leaves.length})</div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>Chargement...</div>
        ) : leaves.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
            <div style={{ fontSize: "36px", marginBottom: "10px" }}>📭</div>
            <div style={{ fontSize: "14px", fontWeight: "600" }}>Aucune demande pour l'instant</div>
          </div>
        ) : leaves.map(l => {
          const st = statusStyle(l.status);
          return (
            <div key={l._id} className="leave-row">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>{l.type}</span>
                    <span style={S.badge(st.color, st.bg)}>{st.icon} {l.status}</span>
                  </div>
                  <div style={{ fontSize: "13px", color: "#64748b" }}>
                    Du <b>{l.startDate}</b> au <b>{l.endDate}</b> · <b>{l.days} jour{l.days > 1 ? "s" : ""}</b>
                  </div>
                  {l.reason && <div style={{ fontSize: "12.5px", color: "#94a3b8", marginTop: "4px" }}>Motif : {l.reason}</div>}
                  {l.managerNote && (
                    <div style={{ fontSize: "12.5px", marginTop: "6px", padding: "8px 12px", background: l.status === "Approuvé" ? "#f0fdf4" : "#fef2f2", borderRadius: "8px", color: l.status === "Approuvé" ? "#059669" : "#dc2626" }}>
                       Note du manager : {l.managerNote}
                    </div>
                  )}
                </div>
                {l.status === "En attente" && (
                  <button className="btn-cancel" onClick={() => cancelLeave(l._id)}>Annuler</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}