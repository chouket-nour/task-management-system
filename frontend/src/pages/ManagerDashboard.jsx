import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import ProjectDashboard from "./ProjectDashboard";
import CongeManagerDashboard from "./CongeManagerDashboard";
import NotificationDashboard from "./NotificationDashboard";

const USER_API    = axios.create({ baseURL: "http://localhost:5000/api/users" });
const PROJECT_API = axios.create({ baseURL: "http://localhost:5000/api/projects" });
const LEAVE_API   = axios.create({ baseURL: "http://localhost:5000/api/conges" });
const getAuthHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const getEmployees  = () => USER_API.get("/", { headers: getAuthHeader() });
const getAttendanceToday = (userId) => USER_API.get(`/attendance/${userId}`, { headers: getAuthHeader() });
const fetchProjects = () => PROJECT_API.get("/", { headers: getAuthHeader() });
const fetchLeaves   = () => LEAVE_API.get("/all", { headers: getAuthHeader() });

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};

const WORK_MODES = {
  "Sur site":    { icon: "🏢", color: "#2563eb", bg: "#eff6ff" },
  "Télétravail": { icon: "🏠", color: "#059669", bg: "#f0fdf4" },
  "Congé":       { icon: "🌴", color: "#d97706", bg: "#fffbeb" },
};

const depts      = ["Data", "Cloud", "Security", "Non assigné"];
const deptColors = { "Data":"#3b82f6", "Cloud":"#10b981", "Security":"#ef4444", "Non assigné":"#94a3b8" };

const S = {
  shell:    { display:"flex", minHeight:"100vh", fontFamily:"'Plus Jakarta Sans', sans-serif", background:"#f8fafc" },
  sidebar:  { width:"240px", flexShrink:0, background:"#0f172a", display:"flex", flexDirection:"column", padding:"24px 0", position:"sticky", top:0, height:"100vh" },
  main:     { flex:1, display:"flex", flexDirection:"column", overflow:"auto" },
  topbar:   { background:"white", borderBottom:"1px solid #e2e8f0", padding:"16px 32px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 },
  content:  { padding:"32px", flex:1 },
  logo:     { padding:"0 20px 28px", borderBottom:"1px solid rgba(255,255,255,0.08)", marginBottom:"16px" },
  navItem:  (active) => ({ display:"flex", alignItems:"center", padding:"10px 20px", cursor:"pointer", color: active?"white":"rgba(255,255,255,0.5)", background: active?"rgba(255,255,255,0.1)":"transparent", borderLeft: active?"3px solid #3b82f6":"3px solid transparent", fontSize:"14px", fontWeight: active?"600":"400", transition:"all 0.15s" }),
  grid4:    { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"20px", marginBottom:"28px" },
  grid2:    { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px", marginBottom:"28px" },
  card:     { background:"white", borderRadius:"16px", padding:"24px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" },
  statCard: (color) => ({ background:"white", borderRadius:"16px", padding:"22px 24px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)", borderTop:`4px solid ${color}` }),
  cardTitle:{ fontSize:"15px", fontWeight:"700", color:"#0f172a", marginBottom:"16px" },
  badge:    (color, bg) => ({ display:"inline-block", padding:"3px 10px", borderRadius:"99px", fontSize:"11.5px", fontWeight:"600", color, background:bg }),
  avatar:   (color="#3b82f6") => ({ width:"36px", height:"36px", borderRadius:"50%", background:`linear-gradient(135deg, ${color}, ${color}cc)`, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:"700", fontSize:"13px", flexShrink:0 }),
  logoutBtn:{ marginLeft:"20px", marginRight:"20px", padding:"10px 16px", background:"rgba(239,68,68,0.1)", border:"none", borderRadius:"10px", color:"#f87171", cursor:"pointer", fontSize:"13px", fontWeight:"600", display:"flex", alignItems:"center", gap:"8px" },
};

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [active, setActive] = useState("dashboard");
  const [user,   setUser]   = useState({ name:"Manager", role:"MANAGER" });

  const [empList,         setEmpList]         = useState([]);
  const [empLoading,      setEmpLoading]       = useState(true);
  const [empError,        setEmpError]         = useState("");
  const [todayAttendance, setTodayAttendance]  = useState({});
  const [projects,        setProjects]         = useState([]);
  const [pendingLeaves,   setPendingLeaves]    = useState(0);
  const [notifs,          setNotifs]           = useState([]);
  const [toast,           setToast]            = useState(null);
  const socketRef = useRef(null);

  const typeConfig = {
    conge_demande:  { icon: "📅", color: "#d97706", bg: "#fffbeb" },
    conge_decision: { icon: "✅", color: "#059669", bg: "#f0fdf4" },
    tache_assignee: { icon: "📋", color: "#2563eb", bg: "#eff6ff" },
    tache_terminee: { icon: "🏆", color: "#7c3aed", bg: "#f5f3ff" },
  };

  // WebSocket global
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // ✅ Charger les notifs non lues au démarrage
    axios.get("http://localhost:5000/api/notifications/mine", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      const unread = res.data.filter(n => !n.read);
      setNotifs(unread);
    }).catch(() => {});

    const socket = io("http://localhost:5006", { auth: { token } });
    socketRef.current = socket;
    socket.on("notification", (notif) => {
      setNotifs(p => [notif, ...p]);
      if (notif.type === "conge_demande") setPendingLeaves(p => p + 1);
      const cfg = typeConfig[notif.type] || { icon: "🔔", color: "#3b82f6", bg: "#eff6ff" };
      setToast({ ...notif, ...cfg });
      setTimeout(() => setToast(null), 5000);
    });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) setUser(JSON.parse(s));
  }, []);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      setEmpLoading(true);
      setEmpError("");
      const res = await getEmployees();
      const mapped = res.data.filter(u => u.role === "EMPLOYEE").map(u => ({
        id: u._id, authId: u.authId, name: u.name, email: u.email,
        dept: u.department || "Non assigné",
        joinDate: new Date(u.createdAt).toLocaleDateString("fr-FR"),
      }));
      setEmpList(mapped);

      const today = todayKey();
      const attMap = {};
      await Promise.all(mapped.map(async (emp) => {
        try {
          const r = await getAttendanceToday(emp.authId);
          if (r.data[today]) attMap[emp.authId] = r.data[today];
        } catch {}
      }));
      setTodayAttendance(attMap);

      try {
        const resProj = await fetchProjects();
        setProjects(resProj.data);
      } catch {}

      try {
        const resLeave = await fetchLeaves();
        setPendingLeaves(resLeave.data.filter(l => l.status === "En attente").length);
      } catch {}

    } catch (err) {
      setEmpError("Impossible de charger les employés.");
    } finally {
      setEmpLoading(false);
    }
  };

  const logout      = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login"); };
  const initials    = user.name?.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) || "M";
  const unreadCount = notifs.filter(n => !n.read).length;

  const navItems = [
    { key:"dashboard",     label:"Tableau de bord" },
    { key:"employees",     label:"Employés" },
    { key:"projects",      label:"Projets & Tâches" },
    { key:"conges",        label:"Gestion des congés" },
    { key:"reports",       label:"Rapports" },
    { key:"notifications", label:"Notifications" },
  ];

  const pageTitle = () => {
    if (active==="dashboard")     return `Bonjour, ${user.name?.split(" ")[0]}`;
    if (active==="employees")     return "Gestion des Employés";
    if (active==="projects")      return "Projets & Tâches";
    if (active==="conges")        return "Gestion des Congés";
    if (active==="reports")       return "Rapports & Statistiques";
    if (active==="notifications") return "Notifications";
    return "";
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'Plus Jakarta Sans',sans-serif; }
        .nav-item:hover { background:rgba(255,255,255,0.08) !important; color:white !important; }
        .logout-btn:hover { background:rgba(239,68,68,0.2) !important; }
        .tr-hover:hover { background:#f8fafc; }
        .fade-in { animation:fadeIn 0.3s ease both; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .action-btn { border:none; border-radius:8px; padding:6px 14px; font-size:12.5px; font-weight:600; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; transition:opacity 0.15s; }
        .action-btn:hover { opacity:0.8; }
        .primary-btn { border:none; border-radius:10px; padding:10px 20px; font-size:13.5px; font-weight:600; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; background:#1e40af; color:white; transition:background 0.15s; }
        .primary-btn:hover { background:#1d4ed8; }
        .progress-bar { height:8px; background:#e2e8f0; border-radius:99px; overflow:hidden; }
        .progress-fill { height:100%; border-radius:99px; background:linear-gradient(90deg,#3b82f6,#1d4ed8); transition:width 0.6s ease; }
        .loading-spinner { display:flex; align-items:center; justify-content:center; padding:60px; color:#94a3b8; font-size:14px; gap:12px; }
        .spinner-ring { width:24px; height:24px; border:3px solid #e2e8f0; border-top-color:#3b82f6; border-radius:50%; animation:spin 0.8s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg)} }
        .toast-notif { position:fixed; bottom:28px; right:28px; z-index:999; background:white; border-radius:16px; padding:16px 20px; box-shadow:0 8px 32px rgba(0,0,0,0.15); display:flex; align-items:center; gap:14px; min-width:320px; max-width:420px; animation:slideUp 0.3s ease; }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={S.shell}>
        {/* SIDEBAR */}
        <div style={S.sidebar}>
          <div style={S.logo}>
            <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
              <img src="/assets/logo.png" alt="RFC" style={{ height:"36px" }}
                onError={e=>{e.target.style.display="none";e.target.nextSibling.style.display="flex";}} />
              <div style={{ display:"none", alignItems:"center", height:"36px", color:"white", fontSize:"22px", fontWeight:"800", letterSpacing:"-1px" }}>RFC</div>
            </div>
          </div>
          {navItems.map(item => (
            <div key={item.key} className="nav-item" style={S.navItem(active===item.key)} onClick={()=>setActive(item.key)}>
              {item.label}
              {item.key==="conges" && pendingLeaves>0 && (
                <span style={{ marginLeft:"auto", background:"#ef4444", color:"white", borderRadius:"99px", fontSize:"11px", fontWeight:"700", padding:"2px 7px" }}>{pendingLeaves}</span>
              )}
              {item.key==="notifications" && unreadCount>0 && (
                <span style={{ marginLeft:"auto", background:"#ef4444", color:"white", borderRadius:"99px", fontSize:"11px", fontWeight:"700", padding:"2px 7px" }}>{unreadCount}</span>
              )}
            </div>
          ))}
          <div style={{ flex:1 }} />
          <div style={{ padding:"16px 20px", borderTop:"1px solid rgba(255,255,255,0.08)", marginBottom:"12px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <div style={S.avatar()}>{initials}</div>
              <div>
                <div style={{ color:"white", fontSize:"13px", fontWeight:"600" }}>{user.name}</div>
                <div style={{ color:"rgba(255,255,255,0.4)", fontSize:"11px" }}>Manager</div>
              </div>
            </div>
          </div>
          <button style={S.logoutBtn} className="logout-btn" onClick={logout}>⇦ Déconnexion</button>
        </div>

        {/* MAIN */}
        <div style={S.main}>
          <div style={S.topbar}>
            <div>
              <div style={{ fontSize:"22px", fontWeight:"700", color:"#0f172a", marginBottom:"2px" }}>{pageTitle()}</div>
              <div style={{ fontSize:"13px", color:"#94a3b8" }}>
                {new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
              </div>
            </div>
            <div style={{ display:"flex", gap:"10px", alignItems:"center" }}>
              <div style={{ position:"relative", cursor:"pointer" }} onClick={()=>setActive("notifications")}>
                <div style={{ width:"38px", height:"38px", borderRadius:"50%", background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px" }}>🔔</div>
                {unreadCount>0 && <div style={{ position:"absolute", top:"1px", right:"1px", width:"18px", height:"18px", background:"#ef4444", borderRadius:"50%", border:"2px solid white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", fontWeight:"700", color:"white" }}>{unreadCount}</div>}
              </div>
              <div style={S.avatar()}>{initials}</div>
            </div>
          </div>

          <div style={S.content} className="fade-in" key={active}>

            {/* ══ DASHBOARD ══ */}
            {active==="dashboard" && (<>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"20px", marginBottom:"28px" }}>
                {[
                  { label:"Total employés",     value: empLoading?"...":empList.length },
                  { label:"Total projets",       value: projects.length },
                  { label:"Projets en cours",    value: projects.filter(p=>p.status==="En cours").length },
                  { label:"Projets terminés",    value: projects.filter(p=>p.status==="Terminé").length },
                  { label:"Demandes en attente", value: pendingLeaves },
                ].map((s,i) => (
                  <div key={i} style={S.statCard("#3b82f6")}>
                    <div style={{ fontSize:"28px", fontWeight:"800", color:"#3b82f6", lineHeight:1 }}>{s.value}</div>
                    <div style={{ fontSize:"12px", color:"#64748b", marginTop:"6px", fontWeight:"500" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={S.grid2}>
                <div style={S.card}>
                  <div style={S.cardTitle}>Répartition par département</div>
                  {empLoading ? <div className="loading-spinner"><div className="spinner-ring"/></div>
                  : depts.map((d,i) => {
                    const count = empList.filter(e=>e.dept===d).length;
                    const pct   = empList.length ? Math.round((count/empList.length)*100) : 0;
                    return (
                      <div key={i} style={{ marginBottom:"14px" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
                          <span style={{ fontSize:"13px", fontWeight:"600", color:"#334155" }}>{d}</span>
                          <span style={{ fontSize:"13px", color:"#64748b" }}>{count} · {pct}%</span>
                        </div>
                        <div className="progress-bar"><div className="progress-fill" style={{ width:`${pct}%`, background:deptColors[d] }}/></div>
                      </div>
                    );
                  })}
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>Présence aujourd'hui</div>
                  {["Sur site","Télétravail","Congé"].map(mode => {
                    const count = Object.values(todayAttendance).filter(m=>m===mode).length;
                    const m     = WORK_MODES[mode];
                    return (
                      <div key={mode} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #f1f5f9" }}>
                        <span style={{ display:"inline-flex", alignItems:"center", gap:"6px", fontSize:"13.5px", fontWeight:"600", color:"#334155" }}>{m.icon} {mode}</span>
                        <span style={{ ...S.badge(m.color,m.bg), fontSize:"14px", fontWeight:"800" }}>{count}</span>
                      </div>
                    );
                  })}
                  <div style={{ padding:"10px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:"13.5px", fontWeight:"600", color:"#94a3b8" }}>— Non renseigné</span>
                    <span style={{ ...S.badge("#94a3b8","#f1f5f9"), fontSize:"14px", fontWeight:"800" }}>{empList.length - Object.keys(todayAttendance).length}</span>
                  </div>
                </div>
              </div>
            </>)}

            {/* ══ EMPLOYEES ══ */}
            {active==="employees" && (
              <div style={S.card}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
                  <div style={S.cardTitle}>Liste des employés ({empLoading?"...":empList.length})</div>
                  <button className="primary-btn" onClick={loadAll}>↻ Actualiser</button>
                </div>
                {empLoading ? <div className="loading-spinner"><div className="spinner-ring"/> Chargement...</div>
                : empError  ? <div style={{ textAlign:"center", padding:"40px", color:"#dc2626" }}>{empError}</div>
                : empList.length===0 ? (
                  <div style={{ textAlign:"center", padding:"60px", color:"#94a3b8" }}>
                    <div style={{ fontSize:"40px", marginBottom:"12px" }}>👥</div>
                    <div style={{ fontSize:"15px", fontWeight:"600" }}>Aucun employé trouvé</div>
                  </div>
                ) : (
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                      <tr style={{ borderBottom:"2px solid #f1f5f9" }}>
                        {["#","Nom","Email","Département","Date d'entrée","Statut","Actions"].map(h=>(
                          <th key={h} style={{ textAlign:"left", padding:"10px 12px", fontSize:"11.5px", fontWeight:"700", color:"#64748b", textTransform:"uppercase", letterSpacing:"0.5px" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {empList.map((e,idx) => (
                        <tr key={e.id} className="tr-hover" style={{ borderBottom:"1px solid #f8fafc" }}>
                          <td style={{ padding:"14px 12px", fontSize:"13px", color:"#94a3b8" }}>{idx+1}</td>
                          <td style={{ padding:"14px 12px" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                              <div style={{ ...S.avatar(deptColors[e.dept]||"#64748b"), width:"32px", height:"32px", fontSize:"11px" }}>
                                {e.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                              </div>
                              <span style={{ fontSize:"13.5px", fontWeight:"600", color:"#0f172a" }}>{e.name}</span>
                            </div>
                          </td>
                          <td style={{ padding:"14px 12px", fontSize:"13px", color:"#64748b" }}>{e.email}</td>
                          <td style={{ padding:"14px 12px" }}><span style={S.badge(deptColors[e.dept]||"#64748b",(deptColors[e.dept]||"#64748b")+"22")}>{e.dept}</span></td>
                          <td style={{ padding:"14px 12px", fontSize:"13.5px", color:"#64748b" }}>{e.joinDate}</td>
                          <td style={{ padding:"14px 12px" }}>
                            {(() => {
                              const mode = todayAttendance[e.authId];
                              const m    = mode ? WORK_MODES[mode] : null;
                              return m ? (
                                <span style={{ display:"inline-flex", alignItems:"center", gap:"5px", padding:"4px 10px", borderRadius:"99px", fontSize:"12px", fontWeight:"700", color:m.color, background:m.bg }}>{m.icon} {mode}</span>
                              ) : (
                                <span style={{ display:"inline-flex", alignItems:"center", gap:"5px", padding:"4px 10px", borderRadius:"99px", fontSize:"12px", fontWeight:"600", color:"#94a3b8", background:"#f1f5f9" }}>— Non renseigné</span>
                              );
                            })()}
                          </td>
                          <td style={{ padding:"14px 12px" }}>
                            <button className="action-btn" style={{ background:"#fef2f2", color:"#dc2626" }} onClick={()=>setEmpList(p=>p.filter(x=>x.id!==e.id))}>Supprimer</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* ══ PROJECTS ══ */}
            {active==="projects" && <ProjectDashboard empList={empList} />}

            {/* ══ CONGÉS ══ */}
            {active==="conges" && <CongeManagerDashboard onUpdate={async () => {
              try {
                const resLeave = await fetchLeaves();
                setPendingLeaves(resLeave.data.filter(l => l.status === "En attente").length);
              } catch {}
            }} />}

            {/* ══ REPORTS ══ */}
            {active==="reports" && (<>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"20px", marginBottom:"28px" }}>
                {[
                  { label:"Taux de présence", value:"94%",          sub:"Ce mois-ci" },
                  { label:"Total employés",   value:empList.length, sub:"Inscrits" },
                  { label:"Présents ce jour", value:Object.values(todayAttendance).filter(m=>m==="Sur site").length, sub:"Sur site" },
                  { label:"Total projets",    value:projects.length, sub:"En cours" },
                ].map((s,i) => (
                  <div key={i} style={S.statCard("#3b82f6")}>
                    <div style={{ fontSize:"28px", fontWeight:"800", color:"#3b82f6", lineHeight:1 }}>{s.value}</div>
                    <div style={{ fontSize:"12px", color:"#64748b", marginTop:"6px", fontWeight:"500" }}>{s.label}</div>
                    <div style={{ fontSize:"11px", color:"#94a3b8", marginTop:"3px" }}>{s.sub}</div>
                  </div>
                ))}
              </div>
              <div style={S.card}>
                <div style={S.cardTitle}>Résumé par département</div>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ borderBottom:"2px solid #f1f5f9" }}>
                      {["Département","Effectif","Sur site","Télétravail","Non renseigné"].map(h=>(
                        <th key={h} style={{ textAlign:"left", padding:"10px 12px", fontSize:"11.5px", fontWeight:"700", color:"#64748b", textTransform:"uppercase", letterSpacing:"0.5px" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {depts.map((d,i) => {
                      const dEmps   = empList.filter(e=>e.dept===d);
                      const surSite = dEmps.filter(e=>todayAttendance[e.authId]==="Sur site").length;
                      const tele    = dEmps.filter(e=>todayAttendance[e.authId]==="Télétravail").length;
                      const none    = dEmps.length - dEmps.filter(e=>todayAttendance[e.authId]).length;
                      return (
                        <tr key={i} className="tr-hover" style={{ borderBottom:"1px solid #f8fafc" }}>
                          <td style={{ padding:"14px 12px" }}><span style={S.badge(deptColors[d],deptColors[d]+"22")}>{d}</span></td>
                          <td style={{ padding:"14px 12px", fontSize:"14px", fontWeight:"700", color:"#0f172a" }}>{dEmps.length}</td>
                          <td style={{ padding:"14px 12px", fontSize:"13.5px", color:"#2563eb", fontWeight:"600" }}>{surSite}</td>
                          <td style={{ padding:"14px 12px", fontSize:"13.5px", color:"#059669", fontWeight:"600" }}>{tele}</td>
                          <td style={{ padding:"14px 12px", fontSize:"13.5px", color:"#94a3b8" }}>{none}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>)}

            {/* ══ NOTIFICATIONS ══ */}
            {active==="notifications" && <NotificationDashboard onUnreadCount={(count) => setNotifs(Array(count).fill({ read: false }))} />}

          </div>
        </div>
      </div>

      {/* ── TOAST TEMPS RÉEL ── */}
      {toast && (
        <div className="toast-notif" style={{ borderLeft:`4px solid ${toast.color}` }}>
          <div style={{ width:"42px", height:"42px", borderRadius:"50%", background:toast.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0 }}>
            {toast.icon}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:"14px", fontWeight:"700", color:"#0f172a", marginBottom:"2px" }}>{toast.title}</div>
            <div style={{ fontSize:"12.5px", color:"#64748b" }}>{toast.message}</div>
          </div>
          <button onClick={() => setToast(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"#94a3b8", fontSize:"18px", flexShrink:0 }}>×</button>
        </div>
      )}
    </>
  );
}