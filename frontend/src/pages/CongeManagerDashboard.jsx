import React, { useState, useEffect } from "react";
import axios from "axios";

const LEAVE_API = axios.create({ baseURL: "http://localhost:5000/api/conges" });
const getH = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const statusStyle = (s) =>
  s === "Approuvé" ? { color: "#059669", bg: "#f0fdf4", icon: "✅" } :
  s === "Refusé"   ? { color: "#dc2626", bg: "#fef2f2", icon: "❌" } :
                     { color: "#d97706", bg: "#fffbeb", icon: "⏳" };

const S = {
  card:      { background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: "24px" },
  statCard:  (color) => ({ background: "white", borderRadius: "16px", padding: "22px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", borderTop: `4px solid ${color}` }),
  cardTitle: { fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "16px" },
  badge:     (color, bg) => ({ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "99px", fontSize: "11.5px", fontWeight: "600", color, background: bg }),
  avatar:    { width: "38px", height: "38px", borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "13px", flexShrink: 0 },
};

export default function CongeManagerDashboard() {
  const [leaves,   setLeaves]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("Tous");
  const [noteModal, setNoteModal] = useState(null); // { id, action }
  const [note,     setNote]     = useState("");

  useEffect(() => { loadLeaves(); }, []);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const res = await LEAVE_API.get("/all", getH());
      setLeaves(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const decide = async (id, status, managerNote = "") => {
    try {
      const res = await LEAVE_API.patch(`/${id}`, { status, managerNote }, getH());
      setLeaves(p => p.map(l => l._id === id ? res.data : l));
      setNoteModal(null);
      setNote("");
    } catch (err) { console.error(err); }
  };

  const filtered = filter === "Tous" ? leaves : leaves.filter(l => l.status === filter);
  const pending  = leaves.filter(l => l.status === "En attente");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .leave-row { padding: 18px; background: #f8fafc; border-radius: 14px; margin-bottom: 12px; border: 1px solid #e2e8f0; transition: box-shadow 0.15s; }
        .leave-row:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.07); }
        .leave-row.pending { border-left: 4px solid #f59e0b; }
        .btn-approve { border: none; border-radius: 8px; padding: 7px 16px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; background: #eff6ff; color: #2563eb; transition: all 0.15s; }
        .btn-approve:hover { background: #dbeafe; }
        .btn-refuse  { border: none; border-radius: 8px; padding: 7px 16px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; background: #fef2f2; color: #dc2626; transition: all 0.15s; }
        .btn-refuse:hover  { background: #fee2e2; }
        .btn-reload  { border: none; border-radius: 10px; padding: 10px 20px; font-size: 13.5px; font-weight: 600; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; background: #1e40af; color: white; transition: background 0.15s; }
        .btn-reload:hover  { background: #1d4ed8; }
        .filter-btn  { border: 1.5px solid #e2e8f0; border-radius: 99px; padding: 6px 16px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; background: white; color: #64748b; transition: all 0.15s; }
        .filter-btn.active { background: #1e40af; color: white; border-color: #1e40af; }
        .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal    { background: white; border-radius: 20px; padding: 32px; width: 100%; max-width: 440px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
        .modal textarea { width: 100%; padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-family: 'Plus Jakarta Sans', sans-serif; outline: none; background: #fafafa; resize: vertical; min-height: 90px; box-sizing: border-box; }
        .modal textarea:focus { border-color: #3b82f6; background: white; }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.6 } }
      `}</style>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "20px", marginBottom: "28px" }}>
        {[
          { label: "Total demandes",  value: leaves.length,                                       color: "#3b82f6" },
          { label: "En attente",      value: leaves.filter(l => l.status === "En attente").length, color: "#d97706" },
          { label: "Approuvées",      value: leaves.filter(l => l.status === "Approuvé").length,   color: "#059669" },
          { label: "Refusées",        value: leaves.filter(l => l.status === "Refusé").length,     color: "#dc2626" },
        ].map((s, i) => (
          <div key={i} style={S.statCard(s.color)}>
            <div style={{ fontSize: "28px", fontWeight: "800", color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "6px", fontWeight: "500" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Demandes urgentes en attente */}
      {pending.length > 0 && (
        <div style={{ ...S.card, border: "2px solid #fde68a", background: "#fffbeb" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <span className="pulse" style={{ fontSize: "20px" }}>⚠️</span>
            <div style={{ fontSize: "15px", fontWeight: "700", color: "#92400e" }}>
              {pending.length} demande{pending.length > 1 ? "s" : ""} en attente de votre décision
            </div>
          </div>
          {pending.map(l => (
            <div key={l._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "white", borderRadius: "10px", marginBottom: "8px", border: "1px solid #fde68a" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={S.avatar}>{l.employeeName?.split(" ").map(w => w[0]).join("").slice(0,2) || "?"}</div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>{l.employeeName}</div>
                  <div style={{ fontSize: "12.5px", color: "#64748b" }}>{l.type} · {l.days} jour{l.days>1?"s":""} · Du {l.startDate} au {l.endDate}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn-approve" onClick={() => setNoteModal({ id: l._id, action: "Approuvé" })}>✓ Approuver</button>
                <button className="btn-refuse"  onClick={() => setNoteModal({ id: l._id, action: "Refusé"   })}>✗ Refuser</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toutes les demandes */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={S.cardTitle}>Toutes les demandes ({filtered.length})</div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {["Tous", "En attente", "Approuvé", "Refusé"].map(f => (
              <button key={f} className={`filter-btn${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
            <button className="btn-reload" onClick={loadLeaves}>↻</button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
            <div style={{ fontSize: "36px", marginBottom: "10px" }}>📭</div>
            <div style={{ fontSize: "14px", fontWeight: "600" }}>Aucune demande</div>
          </div>
        ) : filtered.map(l => {
          const st = statusStyle(l.status);
          return (
            <div key={l._id} className={`leave-row${l.status === "En attente" ? " pending" : ""}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", flex: 1 }}>
                  <div style={S.avatar}>{l.employeeName?.split(" ").map(w=>w[0]).join("").slice(0,2)||"?"}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>{l.employeeName}</span>
                      <span style={S.badge(st.color, st.bg)}>{st.icon} {l.status}</span>
                      <span style={{ fontSize: "12px", color: "#94a3b8" }}>{new Date(l.createdAt).toLocaleDateString("fr-FR")}</span>
                    </div>
                    <div style={{ fontSize: "13.5px", fontWeight: "600", color: "#334155", marginBottom: "3px" }}>{l.type}</div>
                    <div style={{ fontSize: "13px", color: "#64748b" }}>
                      Du <b>{l.startDate}</b> au <b>{l.endDate}</b> · <b>{l.days} jour{l.days>1?"s":""}</b>
                    </div>
                    {l.reason && <div style={{ fontSize: "12.5px", color: "#94a3b8", marginTop: "3px" }}>Motif : {l.reason}</div>}
                    {l.managerNote && (
                      <div style={{ fontSize: "12.5px", marginTop: "6px", padding: "6px 10px", background: l.status==="Approuvé"?"#f0fdf4":"#fef2f2", borderRadius: "7px", color: l.status==="Approuvé"?"#059669":"#dc2626" }}>
                         {l.managerNote}
                      </div>
                    )}
                  </div>
                </div>
                {l.status === "En attente" && (
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    <button className="btn-approve" onClick={() => setNoteModal({ id: l._id, action: "Approuvé" })}>✓ Approuver</button>
                    <button className="btn-refuse"  onClick={() => setNoteModal({ id: l._id, action: "Refusé"   })}>✗ Refuser</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal note manager */}
      {noteModal && (
        <div className="modal-bg" onClick={() => setNoteModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: "20px", marginBottom: "8px" }}>
              {noteModal.action === "Approuvé" ? "✅" : "❌"}
            </div>
            <div style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", marginBottom: "6px" }}>
              {noteModal.action === "Approuvé" ? "Approuver la demande" : "Refuser la demande"}
            </div>
            <div style={{ fontSize: "13.5px", color: "#64748b", marginBottom: "20px" }}>
              Ajoutez une note optionnelle pour l'employé.
            </div>
            <textarea
              placeholder="Note pour l'employé (optionnel)..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                style={{ flex: 1, border: "none", borderRadius: "10px", padding: "12px", fontWeight: "700", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", background: noteModal.action === "Approuvé" ? "#059669" : "#dc2626", color: "white", fontSize: "14px" }}
                onClick={() => decide(noteModal.id, noteModal.action, note)}>
                Confirmer
              </button>
              <button
                style={{ flex: 1, border: "1.5px solid #e2e8f0", borderRadius: "10px", padding: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", background: "white", color: "#64748b", fontSize: "14px" }}
                onClick={() => { setNoteModal(null); setNote(""); }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}