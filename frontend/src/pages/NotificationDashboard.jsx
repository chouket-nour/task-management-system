import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const NOTIF_API = axios.create({ baseURL: "http://localhost:5000/api/notifications" });
const getH = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const typeConfig = {
  conge_demande:   {  color:"#2563eb", bg: "#fffbeb", label: "Congé" },
  conge_decision:  { color: "#2563eb", bg: "#f0fdf4", label: "Décision congé" },
  tache_assignee:  {  color: "#2563eb", bg: "#eff6ff", label: "Tâche" },
  tache_terminee:  {  color: "#2563eb", bg: "#f5f3ff", label: "Tâche terminée" },
};

const S = {
  card:      { background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: "24px" },
  statCard:  (color) => ({ background: "white", borderRadius: "16px", padding: "22px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", borderTop: `4px solid ${color}` }),
  cardTitle: { fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "16px" },
  badge:     (color, bg) => ({ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "99px", fontSize: "11.5px", fontWeight: "600", color, background: bg }),
};

export default function NotificationDashboard({ onUnreadCount }) {
  const [notifs,   setNotifs]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("Tous");
  const [toast,    setToast]    = useState(null);
  const socketRef  = useRef(null);

  useEffect(() => {
    loadNotifs();
    connectSocket();
    return () => { socketRef.current?.disconnect(); };
  }, []);

  const connectSocket = () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const socket = io("http://localhost:5006", { auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => console.log("[WS] Notifications connected"));
    socket.on("notification", (notif) => {
      setNotifs(p => [notif, ...p]);
      // Toast en temps réel
      const cfg = typeConfig[notif.type] || { icon: "🔔", color: "#3b82f6", bg: "#eff6ff" };
      setToast({ ...notif, ...cfg });
      setTimeout(() => setToast(null), 4000);
    });
    socket.on("disconnect", () => console.log("[WS] Notifications disconnected"));
  };

  const loadNotifs = async () => {
    try {
      setLoading(true);
      const res = await NOTIF_API.get("/mine", getH());
      setNotifs(res.data);
      // ✅ Notifier le parent du nombre de non lues
      if (onUnreadCount) onUnreadCount(res.data.filter(n => !n.read).length);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const markAllRead = async () => {
    try {
      await NOTIF_API.patch("/read-all", {}, getH());
      setNotifs(p => p.map(n => ({ ...n, read: true })));
      // ✅ Badge à 0
      if (onUnreadCount) onUnreadCount(0);
    } catch (err) { console.error(err); }
  };

  const removeNotif = async (id) => {
    try {
      await NOTIF_API.delete(`/${id}`, getH());
      setNotifs(p => {
        const updated = p.filter(n => n._id !== id);
        if (onUnreadCount) onUnreadCount(updated.filter(n => !n.read).length);
        return updated;
      });
    } catch (err) { console.error(err); }
  };

  const unread   = notifs.filter(n => !n.read).length;
  const filtered = filter === "Tous" ? notifs :
                   filter === "Non lues" ? notifs.filter(n => !n.read) :
                   notifs.filter(n => typeConfig[n.type]?.label === filter);

  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60)   return "À l'instant";
    if (diff < 3600) return `Il y a ${Math.floor(diff/60)} min`;
    if (diff < 86400)return `Il y a ${Math.floor(diff/3600)}h`;
    return new Date(date).toLocaleDateString("fr-FR");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .notif-row { display:flex; align-items:flex-start; gap:14px; padding:16px; border-radius:14px; margin-bottom:10px; transition:box-shadow 0.15s, transform 0.1s; cursor:default; }
        .notif-row:hover { box-shadow:0 2px 10px rgba(0,0,0,0.07); transform:translateY(-1px); }
        .notif-unread { background:#eff6ff; border:1px solid #bfdbfe; }
        .notif-read   { background:#f8fafc; border:1px solid #e2e8f0; }
        .filter-btn { border:1.5px solid #e2e8f0; border-radius:99px; padding:6px 16px; font-size:13px; font-weight:600; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; background:white; color:#64748b; transition:all 0.15s; }
        .filter-btn.active { background:#1e40af; color:white; border-color:#1e40af; }
        .btn-read-all { border:none; border-radius:10px; padding:9px 18px; font-size:13px; font-weight:600; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; background:#eff6ff; color:#2563eb; transition:background 0.15s; }
        .btn-read-all:hover { background:#dbeafe; }
        .btn-delete { border:none; border-radius:8px; padding:4px 10px; font-size:12px; font-weight:600; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; background:#fef2f2; color:#dc2626; transition:opacity 0.15s; flex-shrink:0; }
        .btn-delete:hover { opacity:0.8; }
        .ws-badge { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:99px; font-size:12px; font-weight:600; color:#059669; }
        .ws-dot { width:8px; height:8px; border-radius:50%; background:#10b981; animation:pulse 2s infinite; }
        .toast { position:fixed; bottom:28px; right:28px; z-index:999; background:white; border-radius:16px; padding:16px 20px; box-shadow:0 8px 32px rgba(0,0,0,0.15); display:flex; align-items:center; gap:14px; min-width:320px; max-width:420px; animation:slideUp 0.3s ease; border-left:4px solid #3b82f6; }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .empty-state { text-align:center; padding:60px 40px; color:#94a3b8; }
      `}</style>

      {/* Toast temps réel */}
      {toast && (
        <div className="toast" style={{ borderLeftColor: toast.color }}>
          <div style={{ width:"42px", height:"42px", borderRadius:"50%", background:toast.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0 }}>
            {toast.icon}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:"14px", fontWeight:"700", color:"#0f172a", marginBottom:"2px" }}>{toast.title}</div>
            <div style={{ fontSize:"12.5px", color:"#64748b" }}>{toast.message}</div>
          </div>
          <button onClick={() => setToast(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"#94a3b8", fontSize:"18px" }}>×</button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"20px", marginBottom:"28px" }}>
        {[
          { label:"Total",          value: notifs.length,                                           color:"#2563eb" },
          { label:"Non lues",       value: unread,                                                  color:"#2563eb" },
          { label:"Congés",         value: notifs.filter(n=>["conge_demande","conge_decision"].includes(n.type)).length, color:"#2563eb" },
          { label:"Tâches",         value: notifs.filter(n=>["tache_assignee","tache_terminee"].includes(n.type)).length, color:"#2563eb"},
        ].map((s,i) => (
          <div key={i} style={S.statCard(s.color)}>
            <div style={{ fontSize:"28px", fontWeight:"800", color:s.color, lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:"12px", color:"#64748b", marginTop:"6px", fontWeight:"500" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Liste */}
      <div style={S.card}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px", flexWrap:"wrap", gap:"12px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
            <div style={S.cardTitle}>Notifications</div>
            <div className="ws-badge"><div className="ws-dot" /> Temps réel</div>
          </div>
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
            {["Tous","Non lues","Congé","Tâche"].map(f => (
              <button key={f} className={`filter-btn${filter===f?" active":""}`} onClick={()=>setFilter(f)}>{f}</button>
            ))}
            {unread > 0 && (
              <button className="btn-read-all" onClick={markAllRead}>✓ Tout marquer lu</button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign:"center", padding:"40px", color:"#94a3b8" }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize:"48px", marginBottom:"12px" }}>🔔</div>
            <div style={{ fontSize:"15px", fontWeight:"600", marginBottom:"6px" }}>Aucune notification</div>
            <div style={{ fontSize:"13px" }}>Les notifications apparaîtront ici en temps réel</div>
          </div>
        ) : filtered.map(n => {
          const cfg = typeConfig[n.type] || { icon:"🔔", color:"#3b82f6", bg:"#eff6ff", label:"Info" };
          return (
            <div key={n._id} className={`notif-row ${n.read ? "notif-read" : "notif-unread"}`}>
              <div style={{ width:"44px", height:"44px", borderRadius:"50%", background:cfg.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0 }}>
                {cfg.icon}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"3px", flexWrap:"wrap" }}>
                  <span style={{ fontSize:"14px", fontWeight: n.read ? "600" : "700", color:"#0f172a" }}>{n.title}</span>
                  <span style={S.badge(cfg.color, cfg.bg)}>{cfg.label}</span>
                  {!n.read && <span style={{ width:"8px", height:"8px", borderRadius:"50%", background:"#ef4444", display:"inline-block" }} />}
                </div>
                <div style={{ fontSize:"13px", color:"#334155", marginBottom:"4px" }}>{n.message}</div>
                <div style={{ fontSize:"12px", color:"#94a3b8" }}>{timeAgo(n.createdAt)}</div>
              </div>
              <button className="btn-delete" onClick={() => removeNotif(n._id)}>×</button>
            </div>
          );
        })}
      </div>
    </>
  );
}