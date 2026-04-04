import React, { useState, useEffect } from "react";
import axios from "axios";

const PROJECT_API = axios.create({ baseURL: "http://localhost:5000/api/projects" });
const TASK_API    = axios.create({ baseURL: "http://localhost:5000/api/tasks" });
const getH = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const DEPTS      = ["Data", "Cloud", "Security", "Non assigné"];
const deptColors = { "Data": "#3b82f6", "Cloud": "#10b981", "Security": "#ef4444", "Non assigné": "#94a3b8" };
const taskStatusOpts = ["À faire", "En cours", "Terminé"];
const priorityOpts   = ["Basse", "Normale", "Haute"];

const taskSt  = (s) => s === "Terminé" ? { c: "#059669", bg: "#f0fdf4" } : s === "En cours" ? { c: "#2563eb", bg: "#eff6ff" } : { c: "#64748b", bg: "#f1f5f9" };
const priorSt = (p) => p === "Haute" ? { c: "#dc2626", bg: "#fef2f2" } : p === "Normale" ? { c: "#2563eb", bg: "#eff6ff" } : { c: "#059669", bg: "#f0fdf4" };
const progress = (tasks) => !tasks?.length ? 0 : Math.round((tasks.filter(t => t.status === "Terminé").length / tasks.length) * 100);

const S = {
  card:      { background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  statCard:  (color) => ({ background: "white", borderRadius: "16px", padding: "22px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", borderTop: `4px solid ${color}` }),
  cardTitle: { fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "16px" },
  badge:     (color, bg) => ({ display: "inline-block", padding: "3px 10px", borderRadius: "99px", fontSize: "11.5px", fontWeight: "600", color, background: bg }),
  avatar:    (color = "#3b82f6") => ({ width: "28px", height: "28px", borderRadius: "50%", background: `linear-gradient(135deg, ${color}, ${color}cc)`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "10px", flexShrink: 0 }),
};

export default function ProjectDashboard({ empList = [] }) {
  const [projects,     setProjects]     = useState([]);
  const [projectTasks, setProjectTasks] = useState({});
  const [loading,      setLoading]      = useState(true);
  const [selProj,      setSelProj]      = useState(null);
  const [showAddProj,  setShowAddProj]  = useState(false);
  const [showAddTask,  setShowAddTask]  = useState(false);
  const [newProj, setNewProj] = useState({ name: "", dept: "Data", deadline: "", members: [] });
  const [newTask, setNewTask] = useState({ title: "", assignedTo: "", status: "À faire", priority: "Normale" });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const res = await PROJECT_API.get("/", getH());
      setProjects(res.data);
      const tasksMap = {};
      await Promise.all(res.data.map(async (p) => {
        try {
          const r = await TASK_API.get(`/project/${p._id}`, getH());
          tasksMap[p._id] = r.data;
        } catch { tasksMap[p._id] = []; }
      }));
      setProjectTasks(tasksMap);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const getTasks  = (projId) => projectTasks[projId] || [];
  const empById   = (authId) => empList.find(e => e.authId === authId);
  const syncTasks = selProj ? getTasks(selProj._id) : [];

  const createProject = async () => {
    if (!newProj.name) return;
    try {
      const res = await PROJECT_API.post("/", newProj, getH());
      setProjects(p => [...p, res.data]);
      setProjectTasks(t => ({ ...t, [res.data._id]: [] }));
      setNewProj({ name: "", dept: "Data", deadline: "", members: [] });
      setShowAddProj(false);
    } catch (err) { console.error(err); }
  };

  const removeProject = async (id) => {
    try {
      await PROJECT_API.delete(`/${id}`, getH());
      setProjects(p => p.filter(x => x._id !== id));
      if (selProj?._id === id) setSelProj(null);
    } catch (err) { console.error(err); }
  };

  const toggleMember = async (projId, authId) => {
    const proj    = projects.find(p => p._id === projId);
    const members = proj.members.includes(authId)
      ? proj.members.filter(m => m !== authId)
      : [...proj.members, authId];
    try {
      const res = await PROJECT_API.put(`/${projId}`, { ...proj, members }, getH());
      setProjects(p => p.map(x => x._id === projId ? res.data : x));
      if (selProj?._id === projId) setSelProj(res.data);
    } catch (err) { console.error(err); }
  };

  const createTask = async () => {
    if (!newTask.title || !selProj) return;
    try {
      const res = await TASK_API.post("/", { ...newTask, projectId: selProj._id }, getH());
      setProjectTasks(t => ({ ...t, [selProj._id]: [...(t[selProj._id] || []), res.data] }));
      setNewTask({ title: "", assignedTo: "", status: "À faire", priority: "Normale" });
      setShowAddTask(false);
    } catch (err) { console.error(err); }
  };

  const changeTaskStatus = async (taskId, status) => {
    try {
      const res = await TASK_API.patch(`/${taskId}`, { status }, getH());
      setProjectTasks(t => ({ ...t, [selProj._id]: t[selProj._id].map(x => x._id === taskId ? res.data : x) }));
    } catch (err) { console.error(err); }
  };

  const removeTask = async (taskId) => {
    try {
      await TASK_API.delete(`/${taskId}`, getH());
      setProjectTasks(t => ({ ...t, [selProj._id]: t[selProj._id].filter(x => x._id !== taskId) }));
    } catch (err) { console.error(err); }
  };

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
        .proj-card{background:white;border-radius:16px;padding:22px;box-shadow:0 1px 3px rgba(0,0,0,0.06);border:2px solid transparent;cursor:pointer;transition:border-color 0.15s,box-shadow 0.15s}
        .proj-card:hover{border-color:#3b82f6;box-shadow:0 4px 16px rgba(59,130,246,0.12)}
        .task-row{display:flex;align-items:center;gap:12px;padding:12px 14px;background:#f8fafc;border-radius:10px;margin-bottom:8px;transition:background 0.1s}
        .task-row:hover{background:#eff6ff}
        .inline-select{padding:4px 10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:12px;font-family:'Plus Jakarta Sans',sans-serif;cursor:pointer;outline:none;background:white}
        .action-btn{border:none;border-radius:8px;padding:6px 14px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:opacity 0.15s}
        .action-btn:hover{opacity:0.8}
        .primary-btn{border:none;border-radius:10px;padding:10px 20px;font-size:13.5px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;background:#1e40af;color:white;transition:background 0.15s}
        .primary-btn:hover{background:#1d4ed8}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px}
        .modal{background:white;border-radius:20px;padding:32px;width:100%;max-width:460px;box-shadow:0 20px 60px rgba(0,0,0,0.2);max-height:90vh;overflow-y:auto}
        .modal input,.modal select{width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;outline:none;margin-bottom:14px;background:#fafafa}
        .modal input:focus,.modal select:focus{border-color:#3b82f6;background:white}
        .progress-bar{height:8px;background:#e2e8f0;border-radius:99px;overflow:hidden}
        .progress-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#3b82f6,#1d4ed8);transition:width 0.6s ease}
        .emp-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 10px 4px 6px;background:#eff6ff;border-radius:99px;font-size:12px;font-weight:600;color:#1d4ed8;margin:3px}
        .checkbox-emp{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:10px;cursor:pointer;transition:background 0.1s}
        .checkbox-emp:hover{background:#eff6ff}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* ── LISTE PROJETS ── */}
      {!selProj && (<>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"20px", marginBottom:"28px" }}>
          {[
            { label:"Total projets",    value: projects.length },
            { label:"En cours",         value: projects.filter(p=>p.status==="En cours").length },
            { label:"Tâches totales",   value: Object.values(projectTasks).flat().length },
            { label:"Tâches terminées", value: Object.values(projectTasks).flat().filter(t=>t.status==="Terminé").length },
          ].map((s,i) => (
            <div key={i} style={S.statCard("#3b82f6")}>
              <div style={{ fontSize:"28px", fontWeight:"800", color:"#3b82f6", lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:"12px", color:"#64748b", marginTop:"6px", fontWeight:"500" }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:"20px" }}>
          <button className="primary-btn" onClick={()=>setShowAddProj(true)}>+ Nouveau projet</button>
        </div>
        {projects.length===0 ? (
          <div style={{ ...S.card, textAlign:"center", padding:"60px", color:"#94a3b8" }}>
            <div style={{ fontSize:"40px", marginBottom:"12px" }}>📁</div>
            <div style={{ fontSize:"15px", fontWeight:"600" }}>Aucun projet pour l'instant</div>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:"20px" }}>
            {projects.map(p => {
              const tasks = getTasks(p._id);
              const pct   = progress(tasks);
              const aEmps = (p.members||[]).map(id=>empById(id)).filter(Boolean);
              return (
                <div key={p._id} className="proj-card" onClick={()=>setSelProj(p)}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"12px" }}>
                    <div>
                      <div style={{ fontSize:"15px", fontWeight:"700", color:"#0f172a", marginBottom:"6px" }}>{p.name}</div>
                      <span style={S.badge(deptColors[p.dept]||"#64748b",(deptColors[p.dept]||"#64748b")+"22")}>{p.dept||"—"}</span>
                    </div>
                    <button className="action-btn" style={{ background:"#fef2f2", color:"#dc2626", fontSize:"11px" }}
                      onClick={e=>{e.stopPropagation();removeProject(p._id)}}>Suppr.</button>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
                    <span style={{ fontSize:"12px", color:"#64748b" }}>{tasks.filter(t=>t.status==="Terminé").length}/{tasks.length} tâches</span>
                    <span style={{ fontSize:"13px", fontWeight:"700", color:"#3b82f6" }}>{pct}%</span>
                  </div>
                  <div className="progress-bar" style={{ marginBottom:"14px" }}>
                    <div className="progress-fill" style={{ width:`${pct}%` }} />
                  </div>
                  {p.deadline && <div style={{ fontSize:"12px", color:"#94a3b8", marginBottom:"10px" }}>Deadline : {p.deadline}</div>}
                  <div style={{ display:"flex", flexWrap:"wrap", gap:"4px" }}>
                    {aEmps.length===0
                      ? <span style={{ fontSize:"12px", color:"#94a3b8" }}>Aucun employé assigné</span>
                      : aEmps.map(e=>(
                        <div key={e.authId} className="emp-chip">
                          <div style={S.avatar(deptColors[e.dept]||"#3b82f6")}>{e.name.split(" ").map(w=>w[0]).join("").slice(0,2)}</div>
                          {e.name.split(" ")[0]}
                        </div>
                      ))
                    }
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>)}

      {/* ── DÉTAIL PROJET ── */}
      {selProj && (()=>{
        const p     = selProj;
        const tasks = syncTasks;
        const pct   = progress(tasks);
        const aEmps = (p.members||[]).map(id=>empById(id)).filter(Boolean);
        return (<>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
            <div>
              <div style={{ fontSize:"22px", fontWeight:"700", color:"#0f172a" }}>{p.name}</div>
              <span style={S.badge(deptColors[p.dept]||"#64748b",(deptColors[p.dept]||"#64748b")+"22")}>{p.dept||"—"}</span>
              {p.deadline && <span style={{ fontSize:"12.5px", color:"#94a3b8", marginLeft:"10px" }}>Deadline : {p.deadline}</span>}
            </div>
            <div style={{ display:"flex", gap:"8px" }}>
              <button className="primary-btn" onClick={()=>setShowAddTask(true)}>+ Ajouter une tâche</button>
              <button className="action-btn" style={{ background:"#f1f5f9", color:"#64748b", padding:"10px 18px" }} onClick={()=>setSelProj(null)}>← Retour</button>
            </div>
          </div>

          <div style={{ ...S.card, marginBottom:"20px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
              <span style={{ fontSize:"13px", color:"#64748b" }}>{tasks.filter(t=>t.status==="Terminé").length}/{tasks.length} tâches terminées</span>
              <span style={{ fontSize:"16px", fontWeight:"800", color:"#3b82f6" }}>{pct}%</span>
            </div>
            <div className="progress-bar" style={{ marginBottom:"20px" }}>
              <div className="progress-fill" style={{ width:`${pct}%` }} />
            </div>
            <div style={{ fontSize:"13px", fontWeight:"700", color:"#334155", marginBottom:"10px" }}>Employés assignés</div>
            <div style={{ display:"flex", flexWrap:"wrap", marginBottom:"14px" }}>
              {aEmps.length===0
                ? <span style={{ fontSize:"13px", color:"#94a3b8" }}>Aucun employé assigné.</span>
                : aEmps.map(e=>(
                  <div key={e.authId} className="emp-chip">
                    <div style={S.avatar(deptColors[e.dept]||"#3b82f6")}>{e.name.split(" ").map(w=>w[0]).join("").slice(0,2)}</div>
                    {e.name}
                    <span style={{ cursor:"pointer", color:"#93c5fd", marginLeft:"2px", fontSize:"14px" }} onClick={()=>toggleMember(p._id,e.authId)}>×</span>
                  </div>
                ))
              }
            </div>
            <div style={{ fontSize:"12px", fontWeight:"700", color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"8px" }}>Ajouter des employés</div>
            <div style={{ display:"flex", flexWrap:"wrap" }}>
              {empList.filter(e=>!(p.members||[]).includes(e.authId)).map(e=>(
                <div key={e.authId} className="checkbox-emp" onClick={()=>toggleMember(p._id,e.authId)}>
                  <div style={{ width:"16px", height:"16px", border:"1.5px solid #bfdbfe", borderRadius:"4px", flexShrink:0 }} />
                  <span style={{ fontSize:"13px", color:"#334155" }}>{e.name}</span>
                  <span style={S.badge(deptColors[e.dept]||"#64748b",(deptColors[e.dept]||"#64748b")+"22")}>{e.dept}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={S.card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"18px" }}>
              <div style={S.cardTitle}>Tâches ({tasks.length})</div>
              <div style={{ display:"flex", gap:"8px" }}>
                {taskStatusOpts.map(s=>{
                  const st=taskSt(s);
                  return <span key={s} style={S.badge(st.c,st.bg)}>{s} · {tasks.filter(t=>t.status===s).length}</span>;
                })}
              </div>
            </div>
            {tasks.length===0 && <div style={{ textAlign:"center", padding:"32px", color:"#94a3b8", fontSize:"14px" }}>Aucune tâche.</div>}
            {tasks.map(t=>{
              const emp=empById(t.assignedTo);
              const st=taskSt(t.status);
              const pr=priorSt(t.priority);
              return (
                <div key={t._id} className="task-row">
                  <div style={{ width:"10px", height:"10px", borderRadius:"50%", background:st.c, flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:"13.5px", fontWeight:"600", color:"#0f172a" }}>{t.title}</div>
                    {emp && <div style={{ fontSize:"12px", color:"#94a3b8", marginTop:"2px" }}>Assigné à : {emp.name}</div>}
                  </div>
                  <span style={S.badge(pr.c,pr.bg)}>{t.priority}</span>
                  <select className="inline-select" value={t.status} onChange={e=>changeTaskStatus(t._id,e.target.value)}>
                    {taskStatusOpts.map(o=><option key={o}>{o}</option>)}
                  </select>
                  <button className="action-btn" style={{ background:"#fef2f2", color:"#dc2626", padding:"4px 10px", fontSize:"12px" }} onClick={()=>removeTask(t._id)}>×</button>
                </div>
              );
            })}
          </div>
        </>);
      })()}

      {/* MODAL Nouveau projet */}
      {showAddProj && (
        <div className="modal-bg" onClick={()=>setShowAddProj(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:"18px", fontWeight:"700", color:"#0f172a", marginBottom:"20px" }}>Nouveau projet</div>
            <input placeholder="Nom du projet" value={newProj.name} onChange={e=>setNewProj(p=>({...p,name:e.target.value}))} />
            <select value={newProj.dept} onChange={e=>setNewProj(p=>({...p,dept:e.target.value}))}>
              {DEPTS.map(d=><option key={d}>{d}</option>)}
            </select>
            <input placeholder="Deadline (ex: 30 Juin 2026)" value={newProj.deadline} onChange={e=>setNewProj(p=>({...p,deadline:e.target.value}))} />
            <div style={{ fontSize:"13px", fontWeight:"600", color:"#334155", marginBottom:"10px" }}>Assigner des employés</div>
            {empList.map(e=>(
              <div key={e.authId} className="checkbox-emp"
                onClick={()=>setNewProj(p=>({...p,members:p.members.includes(e.authId)?p.members.filter(i=>i!==e.authId):[...p.members,e.authId]}))}>
                <div style={{ width:"16px", height:"16px", border:`1.5px solid ${newProj.members.includes(e.authId)?"#3b82f6":"#d1d5db"}`, borderRadius:"4px", background:newProj.members.includes(e.authId)?"#3b82f6":"white", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {newProj.members.includes(e.authId)&&<span style={{ color:"white", fontSize:"10px", fontWeight:"700" }}>✓</span>}
                </div>
                <span style={{ fontSize:"13px", color:"#334155" }}>{e.name}</span>
                <span style={S.badge(deptColors[e.dept]||"#64748b",(deptColors[e.dept]||"#64748b")+"22")}>{e.dept}</span>
              </div>
            ))}
            <div style={{ display:"flex", gap:"10px", marginTop:"20px" }}>
              <button className="action-btn" style={{ flex:1, background:"#1e40af", color:"white", padding:"12px" }} onClick={createProject}>Créer le projet</button>
              <button className="action-btn" style={{ flex:1, background:"#f1f5f9", color:"#64748b", padding:"12px" }} onClick={()=>setShowAddProj(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL Ajouter tâche */}
      {showAddTask && selProj && (
        <div className="modal-bg" onClick={()=>setShowAddTask(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:"18px", fontWeight:"700", color:"#0f172a", marginBottom:"20px" }}>Ajouter une tâche</div>
            <input placeholder="Titre de la tâche" value={newTask.title} onChange={e=>setNewTask(p=>({...p,title:e.target.value}))} />
            <select value={newTask.assignedTo} onChange={e=>setNewTask(p=>({...p,assignedTo:e.target.value}))}>
              <option value="">— Assigner à un employé —</option>
              {(selProj.members||[]).map(authId=>{
                const emp=empById(authId);
                return emp?<option key={authId} value={authId}>{emp.name}</option>:null;
              })}
            </select>
            <select value={newTask.priority} onChange={e=>setNewTask(p=>({...p,priority:e.target.value}))}>
              {priorityOpts.map(o=><option key={o}>{o}</option>)}
            </select>
            <select value={newTask.status} onChange={e=>setNewTask(p=>({...p,status:e.target.value}))}>
              {taskStatusOpts.map(o=><option key={o}>{o}</option>)}
            </select>
            <div style={{ display:"flex", gap:"10px" }}>
              <button className="action-btn" style={{ flex:1, background:"#1e40af", color:"white", padding:"12px" }} onClick={createTask}>Ajouter</button>
              <button className="action-btn" style={{ flex:1, background:"#f1f5f9", color:"#64748b", padding:"12px" }} onClick={()=>setShowAddTask(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}