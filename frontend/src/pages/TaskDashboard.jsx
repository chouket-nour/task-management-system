import React, { useState, useEffect } from "react";
import axios from "axios";

const TASK_API    = axios.create({ baseURL: "http://localhost:5000/api/tasks" });
const PROJECT_API = axios.create({ baseURL: "http://localhost:5000/api/projects" });
const getH = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const taskStatusOpts = ["À faire", "En cours", "Terminé"];
const taskSt  = (s) => s === "Terminé" ? { c:"#059669", bg:"#f0fdf4" } : s === "En cours" ? { c:"#2563eb", bg:"#eff6ff" } : { c:"#64748b", bg:"#f1f5f9" };
const priorSt = (p) => p === "Haute" ? { c:"#dc2626", bg:"#fef2f2" } : p === "Normale" ? { c:"#2563eb", bg:"#eff6ff" } : { c:"#059669", bg:"#f0fdf4" };
const deptColors = { "Data":"#3b82f6", "Cloud":"#10b981", "Security":"#ef4444", "Non assigné":"#94a3b8" };

const S = {
  card:      { background:"white", borderRadius:"16px", padding:"24px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" },
  statCard:  (color) => ({ background:"white", borderRadius:"16px", padding:"22px 24px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)", borderTop:`4px solid ${color}` }),
  cardTitle: { fontSize:"15px", fontWeight:"700", color:"#0f172a", marginBottom:"16px" },
  badge:     (color, bg) => ({ display:"inline-block", padding:"3px 10px", borderRadius:"99px", fontSize:"11.5px", fontWeight:"600", color, background:bg }),
};

export default function TaskDashboard() {
  const [myTasks,   setMyTasks]   = useState([]);
  const [projects,  setProjects]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("Tous");
  const [selProjId, setSelProjId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const userId = JSON.parse(atob(token.split(".")[1])).id;

        // Mes tâches depuis task-service
        const [resTasks, resProjs] = await Promise.all([
          TASK_API.get(`/member/${userId}`, getH()),
          PROJECT_API.get("/", getH()),
        ]);
        setMyTasks(resTasks.data);
        // Filtrer seulement les projets où l'employé est membre
        const myProjIds = [...new Set(resTasks.data.map(t => t.projectId))];
        setProjects(resProjs.data.filter(p => myProjIds.includes(p._id)));
      } catch (err) {
        console.error("TaskDashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateTaskStatus = async (taskId, status) => {
    try {
      const res = await TASK_API.patch(`/${taskId}`, { status }, getH());
      setMyTasks(p => p.map(t => t._id === taskId ? res.data : t));
    } catch (err) { console.error(err); }
  };

  const filteredTasks = filter === "Tous" ? myTasks : myTasks.filter(t => t.status === filter);
  const projById = (id) => projects.find(p => p._id === id);
  const projTasks = selProjId ? myTasks.filter(t => t.projectId === selProjId) : [];

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"80px", color:"#94a3b8", gap:"12px" }}>
      <div style={{ width:"24px", height:"24px", border:"3px solid #e2e8f0", borderTopColor:"#3b82f6", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      Chargement...
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        .task-card{background:white;border-radius:14px;padding:18px 20px;box-shadow:0 1px 3px rgba(0,0,0,0.06);border-left:4px solid #e2e8f0;margin-bottom:12px;transition:box-shadow 0.15s,transform 0.1s}
        .task-card:hover{box-shadow:0 4px 16px rgba(0,0,0,0.08);transform:translateY(-1px)}
        .proj-card-emp{background:white;border-radius:16px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.06);border:2px solid transparent;cursor:pointer;transition:border-color 0.15s}
        .proj-card-emp:hover{border-color:#3b82f6}
        .filter-btn{border:1.5px solid #e2e8f0;border-radius:99px;padding:6px 16px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.15s;background:white;color:#64748b}
        .filter-btn.active{background:#1e40af;color:white;border-color:#1e40af}
        .inline-select{padding:6px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:12px;font-family:'Plus Jakarta Sans',sans-serif;cursor:pointer;outline:none;background:white}
        .progress-bar{height:6px;background:#e2e8f0;border-radius:99px;overflow:hidden}
        .progress-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#3b82f6,#1d4ed8);transition:width 0.6s ease}
        .back-btn{border:none;border-radius:10px;padding:8px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;background:#f1f5f9;color:#64748b}
        .back-btn:hover{background:#e2e8f0}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"20px", marginBottom:"28px" }}>
        {[
          { label:"Total tâches",  value: myTasks.length,                                      color:"#2563eb" },
          { label:"À faire",       value: myTasks.filter(t=>t.status==="À faire").length,      color:"#2563eb" },
          { label:"En cours",      value: myTasks.filter(t=>t.status==="En cours").length,     color:"#2563eb" },
          { label:"Terminées",     value: myTasks.filter(t=>t.status==="Terminé").length,      color:"#2563eb"},
        ].map((s,i) => (
          <div key={i} style={S.statCard(s.color)}>
            <div style={{ fontSize:"28px", fontWeight:"800", color:s.color, lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:"12px", color:"#64748b", marginTop:"6px", fontWeight:"500" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {!selProjId && (<>
        {/* Mes projets */}
        <div style={{ ...S.card, marginBottom:"24px" }}>
          <div style={S.cardTitle}>Mes Projets ({projects.length})</div>
          {projects.length===0 ? (
            <div style={{ textAlign:"center", padding:"40px", color:"#94a3b8" }}>
              <div style={{ fontSize:"36px", marginBottom:"10px" }}>📋</div>
              <div style={{ fontSize:"14px", fontWeight:"600" }}>Aucun projet assigné pour l'instant</div>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:"16px" }}>
              {projects.map(p => {
                const tasks  = myTasks.filter(t => t.projectId === p._id);
                const done   = tasks.filter(t => t.status === "Terminé").length;
                const pct    = tasks.length ? Math.round((done/tasks.length)*100) : 0;
                return (
                  <div key={p._id} className="proj-card-emp" onClick={()=>setSelProjId(p._id)}>
                    <div style={{ fontSize:"14px", fontWeight:"700", color:"#0f172a", marginBottom:"6px" }}>{p.name}</div>
                    <span style={S.badge(deptColors[p.dept]||"#64748b",(deptColors[p.dept]||"#64748b")+"22")}>{p.dept||"—"}</span>
                    {p.deadline && <div style={{ fontSize:"12px", color:"#94a3b8", marginTop:"6px" }}>Deadline : {p.deadline}</div>}
                    <div style={{ display:"flex", justifyContent:"space-between", margin:"10px 0 6px" }}>
                      <span style={{ fontSize:"12px", color:"#64748b" }}>{tasks.length} tâche{tasks.length>1?"s":""}</span>
                      <span style={{ fontSize:"12px", fontWeight:"700", color:"#3b82f6" }}>{pct}%</span>
                    </div>
                    <div className="progress-bar"><div className="progress-fill" style={{ width:`${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Toutes mes tâches */}
        <div style={S.card}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"18px" }}>
            <div style={S.cardTitle}>Toutes mes tâches ({filteredTasks.length})</div>
            <div style={{ display:"flex", gap:"8px" }}>
              {["Tous","À faire","En cours","Terminé"].map(f=>(
                <button key={f} className={`filter-btn${filter===f?" active":""}`} onClick={()=>setFilter(f)}>{f}</button>
              ))}
            </div>
          </div>
          {filteredTasks.length===0 ? (
            <div style={{ textAlign:"center", padding:"40px", color:"#94a3b8", fontSize:"14px" }}>Aucune tâche.</div>
          ) : filteredTasks.map(t=>{
            const st  = taskSt(t.status);
            const pr  = priorSt(t.priority);
            const proj = projById(t.projectId);
            return (
              <div key={t._id} className="task-card" style={{ borderLeftColor:st.c }}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"12px" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:"14px", fontWeight:"700", color:"#0f172a", marginBottom:"4px" }}>{t.title}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
                      {proj && <span style={{ fontSize:"12px", color:"#94a3b8" }}>📁 {proj.name}</span>}
                      <span style={S.badge(pr.c,pr.bg)}>{t.priority}</span>
                    </div>
                  </div>
                  <select className="inline-select" value={t.status}
                    style={{ color:st.c, fontWeight:"600", background:st.bg, borderColor:st.c+"44" }}
                    onChange={e=>updateTaskStatus(t._id,e.target.value)}>
                    {taskStatusOpts.map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </>)}

      {/* Détail projet */}
      {selProjId && (()=>{
        const p = projById(selProjId);
        return (<>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
            <div>
              <div style={{ fontSize:"20px", fontWeight:"700", color:"#0f172a" }}>{p?.name}</div>
              {p?.dept && <span style={S.badge(deptColors[p.dept]||"#64748b",(deptColors[p.dept]||"#64748b")+"22")}>{p.dept}</span>}
            </div>
            <button className="back-btn" onClick={()=>setSelProjId(null)}>← Retour</button>
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}>Mes tâches dans ce projet ({projTasks.length})</div>
            {projTasks.length===0
              ? <div style={{ textAlign:"center", padding:"32px", color:"#94a3b8" }}>Aucune tâche assignée dans ce projet.</div>
              : projTasks.map(t=>{
                const st = taskSt(t.status);
                const pr = priorSt(t.priority);
                return (
                  <div key={t._id} className="task-card" style={{ borderLeftColor:st.c }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"12px" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:"14px", fontWeight:"700", color:"#0f172a", marginBottom:"4px" }}>{t.title}</div>
                        <span style={S.badge(pr.c,pr.bg)}>{t.priority}</span>
                      </div>
                      <select className="inline-select" value={t.status}
                        style={{ color:st.c, fontWeight:"600", background:st.bg, borderColor:st.c+"44" }}
                        onChange={e=>updateTaskStatus(t._id,e.target.value)}>
                        {taskStatusOpts.map(o=><option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </>);
      })()}
    </>
  );
}