import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import TaskDashboard from "./TaskDashboard";
import CongeDashboard from "./Congedashboard";
import NotificationDashboard from "./NotificationDashboard";

const USER_API = axios.create({ baseURL: "http://localhost:5000/api/users" });
const getAuthHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const WORK_MODES = [
  { key: "Sur site",    label: "Sur site",    icon: "🏢", color: "#2563eb", bg: "#eff6ff" },
  { key: "Télétravail", label: "Télétravail", icon: "🏠", color: "#059669", bg: "#f0fdf4" },
  { key: "Congé",       label: "Congé",       icon: "🌴", color: "#d97706", bg: "#fffbeb" },
];

const DEPTS = ["Data", "Cloud", "Security", "Non assigné"];

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};

const S = {
  shell:    { display: "flex", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#f8fafc" },
  sidebar:  { width: "240px", flexShrink: 0, background: "#0f172a", display: "flex", flexDirection: "column", padding: "24px 0", position: "sticky", top: 0, height: "100vh" },
  main:     { flex: 1, display: "flex", flexDirection: "column", overflow: "auto" },
  topbar:   { background: "white", borderBottom: "1px solid #e2e8f0", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 },
  content:  { padding: "32px", flex: 1 },
  logo:     { padding: "0 20px 28px", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: "16px" },
  navItem:  (active) => ({ display: "flex", alignItems: "center", gap: "12px", padding: "10px 20px", cursor: "pointer", color: active ? "white" : "rgba(255,255,255,0.5)", background: active ? "rgba(255,255,255,0.1)" : "transparent", borderLeft: active ? "3px solid #3b82f6" : "3px solid transparent", fontSize: "14px", fontWeight: active ? "600" : "400", transition: "all 0.15s" }),
  grid4:    { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "28px" },
  grid2:    { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "28px" },
  card:     { background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  statCard: (color) => ({ background: "white", borderRadius: "16px", padding: "22px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", borderTop: `4px solid ${color}` }),
  cardTitle:{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "16px" },
  badge:    (color, bg) => ({ display: "inline-block", padding: "3px 10px", borderRadius: "99px", fontSize: "11.5px", fontWeight: "600", color, background: bg }),
  avatar:   (color = "#3b82f6") => ({ width: "36px", height: "36px", borderRadius: "50%", background: `linear-gradient(135deg, ${color}, ${color}cc)`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "13px", flexShrink: 0 }),
  logoutBtn:{ marginLeft: "20px", marginRight: "20px", padding: "10px 16px", background: "rgba(239,68,68,0.1)", border: "none", borderRadius: "10px", color: "#f87171", cursor: "pointer", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" },
};

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [active, setActive]   = useState("dashboard");
  const [user,   setUser]     = useState({ name: "Employé", role: "EMPLOYEE" });
  const [profile, setProfile] = useState({ department: "", phone: "", bio: "" });
  const [profileSaved,   setProfileSaved]   = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [attendance, setAttendance] = useState({});
  const [todayMode,  setTodayMode]  = useState(null);
  const [checkedIn,  setCheckedIn]  = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [toast, setToast] = useState(null);
  const socketRef = useRef(null);

  const typeConfig = {
    conge_demande:  {  color: "#d97706", bg: "#fffbeb" },
    conge_decision: { color: "#059669", bg: "#f0fdf4" },
    tache_assignee: {  color: "#2563eb", bg: "#eff6ff" },
    tache_terminee: {color: "#7c3aed", bg: "#f5f3ff" },
  };

  // Connexion WebSocket globale dès le montage
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // ✅ Charger le nombre de notifs non lues au démarrage
    axios.get("http://localhost:5000/api/notifications/mine", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      const unread = res.data.filter(n => !n.read).length;
      setUnreadNotifs(unread);
    }).catch(() => {});

    const socket = io("http://localhost:5006", { auth: { token } });
    socketRef.current = socket;
    socket.on("notification", (notif) => {
      setUnreadNotifs(p => p + 1);
      const cfg = typeConfig[notif.type] || { icon: "🔔", color: "#3b82f6", bg: "#eff6ff" };
      setToast({ ...notif, ...cfg });
      setTimeout(() => setToast(null), 5000);
    });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
    const loadData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const payload = JSON.parse(atob(token.split(".")[1]));
        const resProfile = await USER_API.get(`/${payload.id}`, { headers: getAuthHeader() });
        setProfile({ department: resProfile.data?.department || "", phone: resProfile.data?.phone || "", bio: resProfile.data?.bio || "" });
        const resAtt = await USER_API.get(`/attendance/${payload.id}`, { headers: getAuthHeader() });
        setAttendance(resAtt.data);
        const today = resAtt.data[todayKey()];
        if (today) { setTodayMode(today); setCheckedIn(true); }
      } catch (err) { console.error(err); }
    };
    loadData();
  }, []);

  const logout   = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login"); };
  const initials = user.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "E";

  const saveProfile = async () => {
    setProfileLoading(true);
    try {
      const token   = localStorage.getItem("token");
      const payload = JSON.parse(atob(token.split(".")[1]));
      await USER_API.patch(`/${payload.id}`, { department: profile.department, phone: profile.phone, bio: profile.bio }, { headers: getAuthHeader() });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) { console.error(err); }
    finally { setProfileLoading(false); }
  };

  const checkIn = async (mode) => {
    const key = todayKey();
    try {
      await USER_API.post("/attendance", { date: key, mode }, { headers: getAuthHeader() });
      setAttendance(prev => ({ ...prev, [key]: mode }));
      setTodayMode(mode);
      setCheckedIn(true);
    } catch (err) { console.error(err); }
  };

  const buildCalendar = () => {
    const now = new Date();
    const year = now.getFullYear(), month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay    = new Date(year, month, 1).getDay();
    const days = [];
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      days.push({ day: d, key, mode: attendance[key] || null });
    }
    return days;
  };

  const calDays   = buildCalendar();
  const monthName = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const navItems = [
    { key: "dashboard",     label: "Tableau de bord"     },
    { key: "tasks",         label: "Mes tâches" },
    { key: "conges",        label: "Mes congés" },
    { key: "projects",      label: "Projets" },
    { key: "notifications", label: "Notifications", badge: unreadNotifs },
  ];

  const [showDropdown, setShowDropdown] = useState(false);

  const pageTitle = () => {
    if (active === "profile")       return "Mon Profil";
    if (active === "dashboard")     return `Bonjour, ${user.name?.split(" ")[0]} `;
    if (active === "tasks")         return "Mes Tâches";
    if (active === "conges")        return "Mes Congés";
    if (active === "projects")      return "Mes Projets";
    if (active === "notifications") return "Notifications";
    return "";
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .nav-item:hover { background: rgba(255,255,255,0.08) !important; color: white !important; }
        .logout-btn:hover { background: rgba(239,68,68,0.2) !important; }
        .fade-in { animation: fadeIn 0.3s ease both; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .progress-bar { height: 6px; background: #e2e8f0; border-radius: 99px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, #3b82f6, #1d4ed8); transition: width 0.6s ease; }
        .mode-btn { border: 2px solid transparent; border-radius: 14px; padding: 18px 20px; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 8px; font-family: 'Plus Jakarta Sans', sans-serif; flex: 1; }
        .mode-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
        .mode-btn.selected { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
        .toast-notif { position: fixed; bottom: 28px; right: 28px; z-index: 999; background: white; border-radius: 16px; padding: 16px 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 14px; min-width: 320px; max-width: 420px; animation: slideUp 0.3s ease; }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .profile-input { width: 100%; padding: 11px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-family: 'Plus Jakarta Sans', sans-serif; outline: none; background: #fafafa; transition: border-color 0.2s; }
        .profile-input:focus { border-color: #3b82f6; background: white; }
        .profile-input:disabled { background: #f1f5f9; color: #64748b; }
        .cal-day { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; }
        .save-btn { padding: 11px 24px; background: #1e40af; color: white; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: background 0.15s; }
        .save-btn:hover { background: #1d4ed8; }
        .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .notif-row { display: flex; gap: 14px; padding: 16px; background: #f8fafc; border-radius: 12px; margin-bottom: 12px; align-items: flex-start; }
        .dropdown-menu { position: absolute; top: "calc(100% + 8px)"; right: 0; background: white; border-radius: 14px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); border: 1px solid #e2e8f0; min-width: 180px; z-index: 100; overflow: hidden; animation: fadeIn 0.15s ease; }
        .dropdown-item { display: flex; align-items: center; gap: 10px; padding: 12px 16px; font-size: 13.5px; font-weight: 500; color: #334155; cursor: pointer; transition: background 0.1s; }
        .dropdown-item:hover { background: #f8fafc; }
        .dropdown-item.danger { color: #dc2626; }
        .dropdown-item.danger:hover { background: #fef2f2; }
      `}</style>

      <div style={S.shell}>
        {/* ── SIDEBAR ── */}
        <div style={S.sidebar}>
          <div style={S.logo}>
            <img src="/assets/logo.png" alt="RFC" style={{ height: "36px" }}
              onError={e => { e.target.style.display = "none"; }} />
          </div>
          {navItems.map(item => (
            <div key={item.key} className="nav-item" style={S.navItem(active === item.key)} onClick={() => setActive(item.key)}>
              <span style={{ fontSize: "16px" }}>{item.icon}</span>
              {item.label}
              {item.badge > 0 && (
                <span style={{ marginLeft: "auto", background: "#ef4444", color: "white", borderRadius: "99px", fontSize: "11px", fontWeight: "700", padding: "2px 7px" }}>{item.badge}</span>
              )}
            </div>
          ))}
          <div style={{ flex: 1 }} />
        </div>

        {/* ── MAIN ── */}
        <div style={S.main}>
          <div style={S.topbar}>
            <div>
              <div style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", marginBottom: "2px" }}>{pageTitle()}</div>
              <div style={{ fontSize: "13px", color: "#94a3b8" }}>
                {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {todayMode && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "99px", background: WORK_MODES.find(w=>w.key===todayMode)?.bg, color: WORK_MODES.find(w=>w.key===todayMode)?.color, fontWeight: "700", fontSize: "13px" }}>
                  <span>{WORK_MODES.find(w=>w.key===todayMode)?.icon}</span>{todayMode}
                </div>
              )}
              <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setActive("notifications")}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🔔</div>
                {unreadNotifs > 0 && <div style={{ position: "absolute", top: "2px", right: "2px", width: "16px", height: "16px", background: "#ef4444", borderRadius: "50%", border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: "700", color: "white" }}>{unreadNotifs}</div>}
              </div>

              {/* Avatar + Dropdown */}
              <div style={{ position: "relative" }}>
                <div style={{ ...S.avatar(), cursor: "pointer" }} onClick={() => setShowDropdown(p => !p)}>{initials}</div>
                {showDropdown && (
                  <>
                    {/* Overlay pour fermer */}
                    <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setShowDropdown(false)} />
                    <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "white", borderRadius: "14px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1px solid #e2e8f0", minWidth: "200px", zIndex: 100, overflow: "hidden" }}>
                      {/* Header */}
                      <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                        <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#0f172a" }}>{user.name}</div>
                        <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Employé</div>
                      </div>
                      {/* Items */}
                      <div className="dropdown-item" onClick={() => { setActive("profile"); setShowDropdown(false); }}>
                        <span>👤</span> Mon Profil
                      </div>
                      <div className="dropdown-item" onClick={() => { setActive("notifications"); setShowDropdown(false); }}>
                        <span>🔔</span> Notifications
                        {unreadNotifs > 0 && <span style={{ marginLeft: "auto", background: "#ef4444", color: "white", borderRadius: "99px", fontSize: "11px", fontWeight: "700", padding: "2px 7px" }}>{unreadNotifs}</span>}
                      </div>
                      <div style={{ height: "1px", background: "#f1f5f9", margin: "4px 0" }} />
                      <div className="dropdown-item danger" onClick={() => { setShowDropdown(false); logout(); }}>
                        <span>⇦</span> Déconnexion
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={S.content} className="fade-in" key={active}>

            {/* ══ PROFIL ══ */}
            {active === "profile" && (
              <div style={{ maxWidth: "680px" }}>
                <div style={{ ...S.card, marginBottom: "24px", display: "flex", alignItems: "center", gap: "24px" }}>
                  <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "800", fontSize: "28px", flexShrink: 0 }}>{initials}</div>
                  <div>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a" }}>{user.name}</div>
                    <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>{user.email || ""}</div>
                    <div style={{ marginTop: "8px" }}>
                      {profile.department ? <span style={S.badge("#2563eb","#eff6ff")}>{profile.department}</span> : <span style={S.badge("#64748b","#f1f5f9")}>Département non assigné</span>}
                    </div>
                  </div>
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>Modifier mes informations</div>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Nom complet</label>
                    <input className="profile-input" value={user.name} disabled />
                  </div>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Email</label>
                    <input className="profile-input" value={user.email || ""} disabled />
                  </div>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Département</label>
                    <select className="profile-input" value={profile.department} onChange={e => setProfile(p => ({ ...p, department: e.target.value }))}>
                      <option value="">— Choisir un département —</option>
                      {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Téléphone</label>
                    <input className="profile-input" placeholder="+216 XX XXX XXX" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div style={{ marginBottom: "24px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Bio</label>
                    <textarea className="profile-input" placeholder="Décrivez-vous en quelques mots..." value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} style={{ minHeight: "90px", resize: "vertical" }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <button className="save-btn" onClick={saveProfile} disabled={profileLoading}>{profileLoading ? "Sauvegarde..." : "💾 Sauvegarder"}</button>
                    {profileSaved && <span style={{ color: "#059669", fontWeight: "600", fontSize: "13.5px" }}>✓ Profil mis à jour !</span>}
                  </div>
                </div>
              </div>
            )}

            {/* ══ DASHBOARD ══ */}
            {active === "dashboard" && (<>
              <div style={{ ...S.card, marginBottom: "28px", border: checkedIn ? "2px solid #bbf7d0" : "2px solid #bfdbfe" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>{checkedIn ? "Présence enregistrée" : " Indiquez votre mode de travail aujourd'hui"}</div>
                    <div style={{ fontSize: "13px", color: "#64748b", marginTop: "3px" }}>{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</div>
                  </div>
                  {checkedIn && <button onClick={() => { setCheckedIn(false); setTodayMode(null); }} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", color: "#64748b", cursor: "pointer" }}>Modifier</button>}
                </div>
                {!checkedIn ? (
                  <div style={{ display: "flex", gap: "12px" }}>
                    {WORK_MODES.map(m => (
                      <button key={m.key} className={`mode-btn${todayMode === m.key ? " selected" : ""}`} style={{ background: m.bg, borderColor: todayMode === m.key ? m.color : "transparent" }} onClick={() => checkIn(m.key)}>
                        <span style={{ fontSize: "28px" }}>{m.icon}</span>
                        <span style={{ fontSize: "13px", fontWeight: "700", color: m.color }}>{m.label}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 20px", background: WORK_MODES.find(w=>w.key===todayMode)?.bg, borderRadius: "12px" }}>
                    <span style={{ fontSize: "32px" }}>{WORK_MODES.find(w=>w.key===todayMode)?.icon}</span>
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: "700", color: WORK_MODES.find(w=>w.key===todayMode)?.color }}>{todayMode}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>Enregistré aujourd'hui</div>
                    </div>
                  </div>
                )}
              </div>

              <div style={S.grid4}>
                {[
                  { label: "Présences ce mois",    value: Object.values(attendance).filter(v=>v==="Sur site").length,    color: "#2563eb" },
                  { label: "Jours télétravail",     value: Object.values(attendance).filter(v=>v==="Télétravail").length, color: "#2563eb"},
                  { label: "Jours de congé pris",  value: Object.values(attendance).filter(v=>v==="Congé").length,       color: "#2563eb"},
                  { label: "Jours enregistrés",     value: Object.keys(attendance).length,                                color: "#2563eb"},
                ].map((s, i) => (
                  <div key={i} style={S.statCard(s.color)}>
                    <div style={{ fontSize: "24px", marginBottom: "10px" }}>{s.icon}</div>
                    <div style={{ fontSize: "28px", fontWeight: "800", color: s.color, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "6px", fontWeight: "500" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={S.grid2}>
                <div style={S.card}>
                  <div style={S.cardTitle}>Calendrier — {monthName}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "5px", marginBottom: "6px" }}>
                    {["L","M","M","J","V","S","D"].map((d, i) => (
                      <div key={i} style={{ textAlign: "center", fontSize: "11px", fontWeight: "700", color: "#94a3b8" }}>{d}</div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "5px" }}>
                    {calDays.map((d, i) => {
                      if (!d) return <div key={`e-${i}`} />;
                      const isToday = d.key === todayKey();
                      const m = d.mode ? WORK_MODES.find(w => w.key === d.mode) : null;
                      return (
                        <div key={d.key} className="cal-day" style={{ background: m ? m.bg : isToday ? "#eff6ff" : "#f8fafc", color: m ? m.color : isToday ? "#2563eb" : "#64748b", border: `2px solid ${isToday ? "#3b82f6" : "transparent"}`, fontWeight: isToday ? "800" : "600" }}>
                          {m ? m.icon : d.day}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>Actions rapides</div>
                  {[
                    { label: "Demander un congé", page: "conges"   },
                    { label: "Voir mes tâches",  page: "tasks"    },
                    { label: "Mes projets",  page: "projects" },
                  ].map((a, i) => (
                    <div key={i} onClick={() => setActive(a.page)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: "#f8fafc", borderRadius: "10px", marginBottom: "10px", cursor: "pointer", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background="#eff6ff"}
                      onMouseLeave={e => e.currentTarget.style.background="#f8fafc"}>
                      <span style={{ fontSize: "20px" }}>{a.icon}</span>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>{a.label}</span>
                      <span style={{ marginLeft: "auto", color: "#94a3b8" }}>→</span>
                    </div>
                  ))}
                </div>
              </div>
            </>)}

            {/* ══ TASKS ══ */}
            {active === "tasks" && <TaskDashboard />}

            {/* ══ CONGÉS ══ */}
            {active === "conges" && <CongeDashboard />}

            {/* ══ PROJECTS ══ */}
            {active === "projects" && <TaskDashboard />}

            {/* ══ NOTIFICATIONS ══ */}
            {active === "notifications" && <NotificationDashboard onUnreadCount={(count) => setUnreadNotifs(count)} />}

          </div>
        </div>
      </div>

      {/* ── TOAST TEMPS RÉEL ── */}
      {toast && (
        <div className="toast-notif" style={{ borderLeft: `4px solid ${toast.color}` }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: toast.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>
            {toast.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginBottom: "2px" }}>{toast.title}</div>
            <div style={{ fontSize: "12.5px", color: "#64748b" }}>{toast.message}</div>
          </div>
          <button onClick={() => setToast(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "18px", flexShrink: 0 }}>×</button>
        </div>
      )}
    </>
  );
}