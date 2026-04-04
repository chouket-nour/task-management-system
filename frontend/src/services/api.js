import axios from "axios";

const BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const AUTH_API  = axios.create({ baseURL: `${BASE}/api/auth` });
const USER_API  = axios.create({ baseURL: `${BASE}/api/users` });
const PROJ_API  = axios.create({ baseURL: `${BASE}/api/projects` });
const TASK_API  = axios.create({ baseURL: `${BASE}/api/tasks` });
const CONGE_API = axios.create({ baseURL: `${BASE}/api/conges` });
const NOTIF_API = axios.create({ baseURL: `${BASE}/api/notifications` });

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});

// ── AUTH ──
export const signup = (name, email, password, role) =>
  AUTH_API.post("/signup", { name, email, password, role });

export const login = (email, password) =>
  AUTH_API.post("/login", { email, password });

export const logout = () =>
  AUTH_API.post("/logout", {}, getAuthHeader());

// ── USERS ──
export const getEmployees = () =>
  USER_API.get("/", getAuthHeader());

export const getEmployee = (id) =>
  USER_API.get(`/${id}`, getAuthHeader());

export const updateEmployee = (id, data) =>
  USER_API.patch(`/${id}`, data, getAuthHeader());

export const deleteEmployee = (id) =>
  USER_API.delete(`/${id}`, getAuthHeader());

export const getAttendanceToday = (userId) =>
  USER_API.get(`/attendance/${userId}`, getAuthHeader());

export const checkIn = (date, mode) =>
  USER_API.post("/attendance", { date, mode }, getAuthHeader());

// ── PROJECTS ──
export const getProjects = () =>
  PROJ_API.get("/", getAuthHeader());

export const getMyProjects = (userId) =>
  PROJ_API.get(`/member/${userId}`, getAuthHeader());

export const createProject = (data) =>
  PROJ_API.post("/", data, getAuthHeader());

export const updateProject = (id, data) =>
  PROJ_API.put(`/${id}`, data, getAuthHeader());

export const deleteProject = (id) =>
  PROJ_API.delete(`/${id}`, getAuthHeader());

// ── TASKS ──
export const getTasksByProject = (projectId) =>
  TASK_API.get(`/project/${projectId}`, getAuthHeader());

export const getMyTasks = (userId) =>
  TASK_API.get(`/member/${userId}`, getAuthHeader());

export const createTask = (data) =>
  TASK_API.post("/", data, getAuthHeader());

export const updateTask = (taskId, data) =>
  TASK_API.patch(`/${taskId}`, data, getAuthHeader());

export const deleteTask = (taskId) =>
  TASK_API.delete(`/${taskId}`, getAuthHeader());

// ── CONGES ──
export const demanderConge = (data) =>
  CONGE_API.post("/", data, getAuthHeader());

export const getMesConges = () =>
  CONGE_API.get("/my", getAuthHeader());

export const getAllConges = () =>
  CONGE_API.get("/all", getAuthHeader());

export const repondreConge = (id, status, managerNote = "") =>
  CONGE_API.patch(`/${id}`, { status, managerNote }, getAuthHeader());

export const deleteConge = (id) =>
  CONGE_API.delete(`/${id}`, getAuthHeader());

// ── NOTIFICATIONS ──
export const getMyNotifications = () =>
  NOTIF_API.get("/mine", getAuthHeader());

export const markAllRead = () =>
  NOTIF_API.patch("/read-all", {}, getAuthHeader());

export const deleteNotification = (id) =>
  NOTIF_API.delete(`/${id}`, getAuthHeader());