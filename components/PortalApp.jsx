"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "./Icon";
import {
  initialCallbacks,
  initialCompanies,
  initialDocuments,
  initialMessages,
  initialProjects,
  initialUsers
} from "@/data/mock-data";

const APP_VERSION = "2.4";
const STORAGE_KEY = "druckkultur-desk-demo-v2.2";
const FILE_DB = "druckkultur-desk-files";
const FILE_STORE = "uploads";

const baseNav = [
  { id: "dashboard", label: "Übersicht", icon: "home" },
  { id: "projects", label: "Projekte", icon: "projects" },
  { id: "messages", label: "Nachrichten", icon: "message" },
  { id: "documents", label: "Dokumente", icon: "document" },
  { id: "request", label: "Neues Projekt", icon: "plus" },
  { id: "team", label: "Kontakte", icon: "users" }
];

const statusPresets = {
  "Anfrage eingegangen": { progress: 8, tone: "info", next: "Persönliche Prüfung durch druckkultur", detail: "Die Anfrage wird geprüft und einem Ansprechpartner zugeordnet." },
  "In Beratung": { progress: 18, tone: "info", next: "Anforderungen gemeinsam klären", detail: "Material, Ausführung, Termin und wirtschaftliche Umsetzung werden persönlich abgestimmt." },
  "Angebot liegt vor": { progress: 28, tone: "info", next: "Angebot prüfen und rückmelden", detail: "Das Angebot liegt im Dokumentenbereich bereit." },
  "Druckdaten werden geprüft": { progress: 42, tone: "info", next: "Prüfbericht abwarten", detail: "Die Druckdaten werden auf die vereinbarte Ausführung geprüft." },
  "Freigabe erforderlich": { progress: 55, tone: "warning", next: "Aktuelle Version verbindlich freigeben", detail: "Bitte Inhalt, Ausführung und gekennzeichnete Änderungen kontrollieren." },
  "In Produktion": { progress: 75, tone: "success", next: "Keine Aktion erforderlich", detail: "Das Projekt wird produziert. Interne Fertigungsschritte werden nicht einzeln als Kundenstatus angezeigt." },
  "Versandbereit": { progress: 92, tone: "success", next: "Lieferung erfolgt", detail: "Die Ware ist fertiggestellt und für Versand oder Abholung vorbereitet." },
  "Geliefert": { progress: 100, tone: "success", next: "Projekt abgeschlossen", detail: "Die Lieferung wurde abgeschlossen. Dokumente bleiben im Projektarchiv verfügbar." }
};

const customerDocumentTypes = ["Druckdaten", "Anfrage", "Bestellung", "AB-Mahnung", "Liefermahnung", "Sonstiges"];
const internalDocumentTypes = ["Angebot", "AB", "Freigabedaten", "Lieferschein", "Sonstiges"];
const financialDocumentTypes = new Set(["Angebot", "AB", "Auftragsbestätigung"]);

const availabilityOptions = {
  available: { label: "Online / verfügbar", description: "Angemeldet und ansprechbar", tone: "available" },
  busy: { label: "Beschäftigt", description: "Antwort kann etwas dauern", tone: "busy" },
  meeting: { label: "Im Termin", description: "Vorübergehend nicht erreichbar", tone: "meeting" },
  away: { label: "Außer Haus", description: "Derzeit nicht im Betrieb", tone: "away" },
  dnd: { label: "Nicht stören", description: "Nur bei dringenden Anliegen", tone: "dnd" },
  offline: { label: "Offline", description: "Aktuell nicht angemeldet", tone: "offline" }
};

const emptyRequest = {
  kind: "",
  title: "",
  description: "",
  quantity: "",
  deadline: "",
  customerOrderNumber: "",
  orderDate: "",
  buyerName: "",
  buyerEmail: "",
  buyerPhone: "",
  supplierNumber: "",
  offerNumber: "",
  reference: "",
  customerArticleNumber: "",
  supplierArticleNumber: "",
  unitPrice: "",
  totalPrice: "",
  deliveryAddress: "",
  deliveryTerms: "",
  paymentTerms: "",
  specialInstructions: "",
  format: "",
  material: "",
  documentType: "Anfrage"
};

function classNames(...values) { return values.filter(Boolean).join(" "); }
function getUser(users, id) { return users.find((user) => user.id === id); }
function getCompany(companies, id) { return companies.find((company) => company.id === id); }
function formatToday() { return new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "2-digit", month: "long" }).format(new Date()); }
function formatDateTime() { return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date()); }
function formatDate() { return new Intl.DateTimeFormat("de-DE").format(new Date()); }
function formatBytes(bytes) { if (!bytes) return "0 KB"; const units = ["B", "KB", "MB", "GB"]; const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1); return `${(bytes / 1024 ** i).toFixed(i > 1 ? 1 : 0)} ${units[i]}`; }
function deriveCompanyShortName(name = "") {
  const trimmed = name.trim();
  const withoutLegalForm = trimmed.replace(/\s+(gmbh(?:\s*&\s*co\.\s*kg)?|ag|kg|ohg|ug(?:\s*\(haftungsbeschränkt\))?|e\.?k\.?|mbh)\s*$/i, "").trim();
  return withoutLegalForm || trimmed || "Firma";
}
function deriveInitials(name = "") {
  const ignored = new Set(["gmbh", "co", "kg", "ag", "ohg", "ug", "ek", "mbh"]);
  const parts = name.replace(/[^a-zA-ZÄÖÜäöüß0-9\s]/g, " ").split(/\s+/).filter(Boolean).filter((part) => !ignored.has(part.toLocaleLowerCase("de")));
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts.slice(0, 2).map((part) => part[0]).join("") || "DK").toUpperCase();
}
function normalizeCompanyForVersion(company) {
  const name = company.name?.trim() || "Unbenannte Firma";
  return { ...company, name, shortName: deriveCompanyShortName(name), initials: company.initials || deriveInitials(name), logoData: company.logoData || "" };
}
function optimizeLogoFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("Keine Bilddatei ausgewählt."));
    if (!file.type.startsWith("image/") && !/\.(png|jpe?g|webp|svg)$/i.test(file.name)) return reject(new Error("Bitte PNG, JPG, WebP oder SVG auswählen."));
    if (file.size > 5 * 1024 * 1024) return reject(new Error("Das Logo darf höchstens 5 MB groß sein."));
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      try {
        const maxSize = 420;
        const scale = Math.min(1, maxSize / Math.max(image.naturalWidth || maxSize, image.naturalHeight || maxSize));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round((image.naturalWidth || maxSize) * scale));
        canvas.height = Math.max(1, Math.round((image.naturalHeight || maxSize) * scale));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Logo konnte nicht verarbeitet werden.");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/webp", 0.88);
        URL.revokeObjectURL(url);
        if (!dataUrl || dataUrl === "data:,") throw new Error("Logo konnte nicht gespeichert werden.");
        resolve(dataUrl);
      } catch (error) { URL.revokeObjectURL(url); reject(error); }
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Die Bilddatei konnte nicht gelesen werden.")); };
    image.src = url;
  });
}
function telHref(phone = "") { return `tel:${phone.replace(/[^+\d]/g, "")}`; }
function teamsHref(account = "") { return `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(account)}`; }
function documentTypesFor(user) { return user?.type === "internal" ? internalDocumentTypes : customerDocumentTypes; }
function canSeeProject(user, project) {
  if (!user || !project) return false;
  if (user.type === "internal") return user.companyIds.includes(project.companyId);
  return user.companyId === project.companyId && Boolean(user.rights.viewAllProjects || project.ownerUserIds.includes(user.id));
}
function threadIdForMessage(message) { return message.threadId || `project:${message.projectId}`; }
function directThreadId(companyId, firstId, secondId) { return `direct:${companyId}:${[firstId, secondId].sort().join(":")}`; }
function receiptText(message, users, currentUser) {
  if (message.senderUserId !== currentUser.id) return "";
  const readers = (message.readBy || []).filter((id) => id !== currentUser.id).map((id) => getUser(users, id)?.name).filter(Boolean);
  if (!readers.length) return "Zugestellt";
  if (readers.length === 1) return `Gelesen von ${readers[0]}`;
  return `Gelesen von ${readers.slice(0, 2).join(" und ")}${readers.length > 2 ? ` +${readers.length - 2}` : ""}`;
}
function buildSteps(status) {
  const stages = ["Anfrage", "Angebot", "Druckdaten", "Freigabe", "Produktion", "Lieferung"];
  const currentByStatus = {
    "Anfrage eingegangen": 0,
    "In Beratung": 0,
    "Angebot liegt vor": 1,
    "Druckdaten werden geprüft": 2,
    "Freigabe erforderlich": 3,
    "In Produktion": 4,
    "Versandbereit": 5,
    "Geliefert": 6
  };
  const current = currentByStatus[status] ?? 0;
  return stages.map((label, index) => ({
    label,
    state: index < current ? "done" : index === current && current < stages.length ? "current" : "upcoming",
    date: index < current ? "erledigt" : index === current ? "aktuell" : "offen",
    completed: index < current,
    completedAt: index < current ? "erledigt" : ""
  }));
}

function normalizeStatus(status) {
  const mapping = {
    "Druckdaten fehlen": "Druckdaten werden geprüft",
    "Rückfrage offen": "In Beratung",
    "Muster wird erstellt": "In Beratung",
    "Für Produktion freigegeben": "In Produktion",
    "Weiterverarbeitung": "In Produktion",
    "Abgeschlossen": "Geliefert",
    "Zurückgestellt": "In Beratung"
  };
  const normalized = mapping[status] || status;
  return statusPresets[normalized] ? normalized : "Anfrage eingegangen";
}

function normalizeProjectForVersion(project) {
  const status = normalizeStatus(project.status);
  const preset = statusPresets[status];
  const expectedLabels = ["Anfrage", "Angebot", "Druckdaten", "Freigabe", "Produktion", "Lieferung"];
  const hasCurrentWorkflow = Array.isArray(project.steps)
    && project.steps.length === expectedLabels.length
    && project.steps.every((step, index) => step.label === expectedLabels[index]);
  return {
    ...project,
    status,
    statusTone: preset.tone,
    progress: hasCurrentWorkflow ? Number(project.progress ?? preset.progress) : preset.progress,
    steps: hasCurrentWorkflow ? normalizeWorkflowSteps(project.steps) : buildSteps(status)
  };
}

function normalizeUserForVersion(user) {
  return user.type === "internal" && !user.availabilityStatus
    ? { ...user, availabilityStatus: "available" }
    : user;
}

function isProjectNewFor(project, user) {
  if (!project || !user || !Array.isArray(project.seenBy)) return false;
  if (project.createdByUserId === user.id || project.seenBy.includes(user.id)) return false;
  return canSeeProject(user, project);
}


function normalizeWorkflowSteps(steps = []) {
  let currentAssigned = false;
  return steps.map((step) => {
    const completed = Boolean(step.completed || step.state === "done");
    if (completed) return { ...step, completed: true, state: "done", completedAt: step.completedAt || step.date || "erledigt", date: step.completedAt || step.date || "erledigt" };
    if (!currentAssigned) {
      currentAssigned = true;
      return { ...step, completed: false, completedAt: "", state: "current", date: "aktuell" };
    }
    return { ...step, completed: false, completedAt: "", state: "upcoming", date: "offen" };
  });
}

function openFileDb() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) return reject(new Error("IndexedDB wird nicht unterstützt."));
    const request = window.indexedDB.open(FILE_DB, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(FILE_STORE)) request.result.createObjectStore(FILE_STORE); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function saveFileBlob(key, file) {
  const db = await openFileDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, "readwrite");
    tx.objectStore(FILE_STORE).put(file, key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
async function loadFileBlob(key) {
  const db = await openFileDb();
  const value = await new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, "readonly");
    const request = tx.objectStore(FILE_STORE).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return value;
}
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = filename;
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function PortalApp() {
  const [companies, setCompanies] = useState(() => initialCompanies.map(normalizeCompanyForVersion));
  const [users, setUsers] = useState(() => initialUsers.map(normalizeUserForVersion));
  const [projects, setProjects] = useState(() => initialProjects.map(normalizeProjectForVersion));
  const [messages, setMessages] = useState(initialMessages);
  const [documents, setDocuments] = useState(initialDocuments);
  const [callbacks, setCallbacks] = useState(initialCallbacks);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [notice, setNotice] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [messageTargetUserId, setMessageTargetUserId] = useState(null);
  const [callbackTargetUserId, setCallbackTargetUserId] = useState(null);
  const [dismissedCallbacks, setDismissedCallbacks] = useState([]);
  const storageWarningShown = useRef(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.companies)) setCompanies(parsed.companies.map(normalizeCompanyForVersion));
        if (Array.isArray(parsed.users)) setUsers(parsed.users.map(normalizeUserForVersion));
        if (Array.isArray(parsed.projects)) setProjects(parsed.projects.map(normalizeProjectForVersion));
        if (Array.isArray(parsed.messages)) setMessages(parsed.messages);
        if (Array.isArray(parsed.documents)) setDocuments(parsed.documents);
        if (Array.isArray(parsed.callbacks)) setCallbacks(parsed.callbacks);
        if (typeof parsed.currentUserId === "string") setCurrentUserId(parsed.currentUserId);
        if (typeof parsed.selectedCompanyId === "string") setSelectedCompanyId(parsed.selectedCompanyId);
      }
    } catch (error) { console.warn("Vorführstand konnte nicht geladen werden.", error); }
    finally { setHydrated(true); }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ companies, users, projects, messages, documents, callbacks, currentUserId, selectedCompanyId }));
      storageWarningShown.current = false;
    } catch (error) {
      console.error("Vorführstand konnte nicht gespeichert werden.", error);
      if (!storageWarningShown.current) {
        storageWarningShown.current = true;
        setNotice("Der Browserspeicher ist voll. Bitte ein kleineres Logo verwenden oder die Vorführung zurücksetzen.");
      }
    }
  }, [hydrated, companies, users, projects, messages, documents, callbacks, currentUserId, selectedCompanyId]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const currentUser = getUser(users, currentUserId);
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.type === "customer") setSelectedCompanyId(currentUser.companyId);
    else if (!selectedCompanyId || !currentUser.companyIds.includes(selectedCompanyId)) setSelectedCompanyId(currentUser.companyIds[0] || null);
  }, [currentUser, selectedCompanyId]);

  const accessibleCompanies = useMemo(() => {
    if (!currentUser) return [];
    return companies.filter((company) => currentUser.type === "internal" ? currentUser.companyIds.includes(company.id) : company.id === currentUser.companyId);
  }, [companies, currentUser]);
  const currentCompany = getCompany(companies, selectedCompanyId) || accessibleCompanies[0] || null;

  const visibleProjects = useMemo(() => {
    if (!currentUser || !currentCompany) return [];
    const query = searchTerm.trim().toLocaleLowerCase("de");
    return projects.filter((project) => project.companyId === currentCompany.id && canSeeProject(currentUser, project) && (!query || [project.id, project.title, project.category, project.status].join(" ").toLocaleLowerCase("de").includes(query)));
  }, [projects, currentCompany, currentUser, searchTerm]);
  const visibleProjectIds = useMemo(() => new Set(visibleProjects.map((project) => project.id)), [visibleProjects]);
  const visibleDocuments = useMemo(() => documents.filter((document) => visibleProjectIds.has(document.projectId) && (!document.financial || currentUser?.type === "internal" || currentUser?.rights.viewFinancials)), [documents, visibleProjectIds, currentUser]);
  const visibleMessages = useMemo(() => messages.filter((message) => {
    if (message.companyId !== currentCompany?.id) return false;
    if (message.threadType === "direct") return (message.participantUserIds || []).includes(currentUser?.id);
    return visibleProjectIds.has(message.projectId);
  }), [messages, currentCompany, currentUser, visibleProjectIds]);

  const unreadByCompany = useMemo(() => {
    const result = {};
    if (!currentUser) return result;
    accessibleCompanies.forEach((company) => {
      const projectIds = new Set(projects.filter((project) => project.companyId === company.id && canSeeProject(currentUser, project)).map((project) => project.id));
      result[company.id] = messages.filter((message) => {
        if (message.companyId !== company.id || message.senderUserId === currentUser.id || (message.readBy || []).includes(currentUser.id)) return false;
        if (message.threadType === "direct") return (message.participantUserIds || []).includes(currentUser.id);
        return projectIds.has(message.projectId);
      }).length;
    });
    return result;
  }, [accessibleCompanies, projects, messages, currentUser]);

  const newProjectsByCompany = useMemo(() => {
    const result = {};
    if (!currentUser) return result;
    accessibleCompanies.forEach((company) => {
      result[company.id] = projects.filter((project) => project.companyId === company.id && isProjectNewFor(project, currentUser)).length;
    });
    return result;
  }, [accessibleCompanies, projects, currentUser]);

  const pendingCallbacksByCompany = useMemo(() => {
    const result = {};
    accessibleCompanies.forEach((company) => {
      result[company.id] = callbacks.filter((entry) => entry.companyId === company.id && entry.status === "pending" && (currentUser?.type === "customer" ? entry.requesterUserId === currentUser.id : entry.assignedUserId === currentUser?.id)).length;
    });
    return result;
  }, [accessibleCompanies, callbacks, currentUser]);
  const pendingCallbacksForUser = callbacks.filter((entry) => entry.status === "pending" && currentUser?.type === "internal" && entry.assignedUserId === currentUser.id);
  const popupCallback = pendingCallbacksForUser.find((entry) => !dismissedCallbacks.includes(entry.id));
  const selectedProject = projects.find((project) => project.id === selectedProjectId && canSeeProject(currentUser, project)) || null;

  function login(email, password, loginType) {
    const normalized = email.trim().toLocaleLowerCase("de");
    const user = users.find((entry) => entry.email.toLocaleLowerCase("de") === normalized && entry.password === password && !entry.deleted && (!loginType || entry.type === loginType));
    if (!user) return false;
    if (user.type === "internal") {
      setUsers((current) => current.map((entry) => entry.id === user.id ? { ...entry, availabilityStatus: "available", availabilityUpdatedAt: formatDateTime() } : entry));
    }
    setCurrentUserId(user.id);
    setSelectedCompanyId(user.type === "customer" ? user.companyId : user.companyIds[0]);
    setActiveView(user.type === "internal" ? "companies" : "dashboard");
    setSelectedProjectId(null);
    setSearchTerm("");
    setDismissedCallbacks([]);
    return true;
  }
  function logout() {
    if (currentUser?.type === "internal") {
      setUsers((current) => current.map((user) => user.id === currentUser.id ? { ...user, availabilityStatus: "offline", availabilityUpdatedAt: formatDateTime() } : user));
    }
    setCurrentUserId(null); setSelectedCompanyId(null); setSelectedProjectId(null); setActiveView("dashboard"); setSearchTerm(""); setMessageTargetUserId(null);
  }
  function navigate(view) { setActiveView(view); if (view !== "project") setSelectedProjectId(null); setMobileMenuOpen(false); window.requestAnimationFrame(() => document.getElementById("main-content")?.focus()); }
  function switchCompany(companyId) { setSelectedCompanyId(companyId); setSelectedProjectId(null); setSearchTerm(""); setActiveView("dashboard"); setMobileMenuOpen(false); }
  function openProject(projectId) {
    if (currentUser) {
      setProjects((current) => current.map((project) => project.id === projectId && !(project.seenBy || []).includes(currentUser.id)
        ? { ...project, seenBy: [...(project.seenBy || []), currentUser.id] }
        : project));
    }
    setSelectedProjectId(projectId);
    setActiveView("project");
    setMobileMenuOpen(false);
  }
  function openDirectMessage(userId) { setMessageTargetUserId(userId); setActiveView("messages"); setSelectedProjectId(null); }

  function markThreadRead(threadId) {
    if (!currentUser) return;
    setMessages((current) => current.map((message) => threadIdForMessage(message) === threadId && message.senderUserId !== currentUser.id && !(message.readBy || []).includes(currentUser.id) ? { ...message, readBy: [...(message.readBy || []), currentUser.id] } : message));
  }
  function addProjectMessage(projectId, text) {
    const clean = text.trim();
    const project = projects.find((item) => item.id === projectId);
    if (!clean || !currentUser || !project || !canSeeProject(currentUser, project)) return;
    setMessages((current) => [...current, { id: `msg-${Date.now()}`, companyId: project.companyId, projectId, senderUserId: currentUser.id, text: clean, time: "Gerade eben", createdAt: new Date().toISOString(), readBy: [currentUser.id] }]);
    setNotice(currentUser.type === "customer" ? "Nachricht an das zuständige druckkultur-Team gesendet." : "Nachricht an den Kunden gesendet.");
  }
  function addDirectMessage(recipientId, text) {
    const clean = text.trim();
    if (!clean || !currentUser || !currentCompany) return;
    const threadId = directThreadId(currentCompany.id, currentUser.id, recipientId);
    setMessages((current) => [...current, { id: `direct-${Date.now()}`, companyId: currentCompany.id, projectId: null, threadType: "direct", threadId, participantUserIds: [currentUser.id, recipientId], senderUserId: currentUser.id, text: clean, time: "Gerade eben", createdAt: new Date().toISOString(), readBy: [currentUser.id] }]);
    setNotice("Direkte Nachricht gesendet.");
  }

  function approveProject(projectId) {
    if (!currentUser?.rights.approve) return setNotice("Für Freigaben fehlt diesem Benutzer die Berechtigung.");
    const preset = statusPresets["In Produktion"];
    setProjects((current) => current.map((project) => {
      if (project.id !== projectId) return project;
      const steps = normalizeWorkflowSteps((project.steps?.length ? project.steps : buildSteps(project.status)).map((step) => step.label === "Freigabe" ? { ...step, completed: true, completedAt: formatDate(), state: "done", date: formatDate() } : step));
      return { ...project, status: "In Produktion", statusTone: preset.tone, progress: preset.progress, nextAction: preset.next, nextActionDetail: `Freigegeben durch ${currentUser.name}. ${preset.detail}`, due: "–", updated: "gerade eben", steps };
    }));
    addProjectMessage(projectId, `Die aktuelle Version wurde von ${currentUser.name} verbindlich für die Produktion freigegeben.`);
    setNotice("Freigabe gespeichert und protokolliert.");
  }

  function updateProject(projectId, draft) {
    if (currentUser?.type !== "internal") return;
    const original = projects.find((project) => project.id === projectId);
    if (!original) return;
    const preset = statusPresets[draft.status] || statusPresets[original.status] || {};
    const statusChanged = draft.status !== original.status;
    const oldSteps = normalizeWorkflowSteps(original.steps?.length ? original.steps : buildSteps(original.status));
    const newSteps = normalizeWorkflowSteps(draft.steps?.length ? draft.steps : oldSteps);
    const workflowChanges = newSteps.flatMap((step, index) => {
      const before = oldSteps[index];
      if (!before || Boolean(before.completed) === Boolean(step.completed)) return [];
      return [{
        id: `workflow-${Date.now()}-${index}`,
        status: `${step.label}: ${step.completed ? "erledigt" : "wieder geöffnet"}`,
        note: draft.statusNote || (step.completed ? "Arbeitsschritt wurde als erledigt markiert." : "Erledigt-Markierung wurde zurückgenommen."),
        byUserId: currentUser.id,
        at: formatDateTime()
      }];
    });
    const statusEntry = statusChanged ? [{
      id: `status-${Date.now()}`,
      status: draft.status,
      note: draft.statusNote || draft.nextActionDetail || "",
      byUserId: currentUser.id,
      at: formatDateTime()
    }] : [];
    setProjects((current) => current.map((project) => project.id === projectId ? {
      ...project,
      status: draft.status,
      statusTone: preset.tone || project.statusTone || "info",
      progress: Number(draft.progress),
      nextAction: draft.nextAction,
      nextActionDetail: draft.nextActionDetail,
      due: draft.due,
      delivery: draft.delivery,
      contactUserId: draft.contactUserId,
      ownerUserIds: draft.ownerUserIds,
      updated: "gerade eben",
      steps: newSteps,
      statusHistory: [...(project.statusHistory || []), ...statusEntry, ...workflowChanges]
    } : project));
    if (statusChanged) addProjectMessage(projectId, `Neuer Projektstatus: ${draft.status}. Nächster Schritt: ${draft.nextAction}.`);
    else if (workflowChanges.length) addProjectMessage(projectId, `Projektverlauf aktualisiert: ${workflowChanges.map((entry) => entry.status).join(", ")}.`);
    else addProjectMessage(projectId, `Projektangaben wurden aktualisiert. Nächster Schritt: ${draft.nextAction}.`);
    setNotice(workflowChanges.length ? "Erledigt-Status im Projektverlauf gespeichert." : statusChanged ? `Status „${draft.status}“ wurde gespeichert.` : "Projektangaben wurden aktualisiert.");
  }

  async function uploadDocument(projectId, file, meta = {}, companyIdOverride = null) {
      if (!file || !currentUser) return null;
      if (file.size > 20 * 1024 * 1024) { setNotice("Für die Vorführung sind Dateien bis 20 MB möglich."); return null; }
      const project = projects.find((item) => item.id === projectId);
      const companyId = companyIdOverride || project?.companyId || currentCompany?.id;
      const blobKey = `file-${Date.now()}-${file.name}`;
      const documentType = meta.type || (currentUser.type === "internal" ? "Sonstiges" : "Druckdaten");
      try {
        await saveFileBlob(blobKey, file);
        const document = {
          id: `upload-${Date.now()}`,
          companyId,
          projectId,
          title: meta.title || file.name,
          type: documentType,
          version: meta.version || "",
          date: formatDate(),
          size: formatBytes(file.size),
          financial: typeof meta.financial === "boolean" ? meta.financial : financialDocumentTypes.has(documentType),
          fileName: file.name,
          mimeType: file.type,
          blobKey,
          uploadedBy: currentUser.id
        };
        setDocuments((current) => [document, ...current]);
        setMessages((current) => [...current, {
          id: `upload-message-${Date.now()}`,
          companyId,
          projectId,
          senderUserId: currentUser.id,
          text: `${documentType} hochgeladen: ${file.name} (${formatBytes(file.size)}).`,
          time: "Gerade eben",
          createdAt: new Date().toISOString(),
          readBy: [currentUser.id]
        }]);
        setNotice(`„${file.name}“ wurde als ${documentType} gespeichert.`);
        return document;
      } catch (error) {
        console.error(error);
        setNotice("Der Browser konnte die Datei nicht speichern. Bitte privaten Modus verlassen oder Speicherzugriff erlauben.");
        return null;
      }
    }

  async function downloadDocument(document, project) {
    try {
      if (document.blobKey) {
        const blob = await loadFileBlob(document.blobKey);
        if (!blob) throw new Error("Datei nicht gefunden");
        triggerDownload(blob, document.fileName || document.title);
        setNotice("Datei wird heruntergeladen.");
        return;
      }
      const content = ["druckkultur desk – VORFÜHRDOKUMENT", "", `Dokument: ${document.title}`, `Typ: ${document.type}`, `Projekt: ${project?.title || document.projectId}`, `Auftragsnummer: ${document.projectId}`, `Datum: ${document.date}`, "", "Dieses automatisch erstellte Dokument steht stellvertretend für die Originaldatei aus einer später angebundenen Dateiablage."].join("\n");
      triggerDownload(new Blob([content], { type: "text/plain;charset=utf-8" }), `${document.projectId}-${document.title.replace(/[^a-z0-9äöüß]+/gi, "-").toLowerCase()}.txt`);
      setNotice("Vorführdokument wird heruntergeladen.");
    } catch (error) { console.error(error); setNotice("Die hochgeladene Datei ist in diesem Browser nicht mehr verfügbar."); }
  }

  async function createRequest(request, file) {
      if (currentUser?.type === "customer" && !currentUser.rights.createRequests) return setNotice("Dieser Benutzer darf keine neuen Projekte anlegen.");
      const id = `DK-${String(Date.now()).slice(-6)}`;
      const companyId = currentCompany.id;
      const ownerUserIds = currentUser.type === "customer"
        ? [currentUser.id]
        : users.filter((user) => user.type === "customer" && !user.deleted && user.companyId === companyId && user.rights.viewAllProjects).slice(0, 1).map((user) => user.id);
      const specificationParts = [
        request.description,
        request.format ? `Format: ${request.format}` : "",
        request.material ? `Material: ${request.material}` : "",
        request.customerArticleNumber ? `Kundenartikel: ${request.customerArticleNumber}` : "",
        request.supplierArticleNumber ? `Lieferantenartikel: ${request.supplierArticleNumber}` : "",
        request.specialInstructions ? `Hinweise: ${request.specialInstructions}` : ""
      ].filter(Boolean);
      const project = {
        id,
        companyId,
        ownerUserIds,
        title: request.title || "Neue Projektidee",
        category: request.kind || "Beratungsanfrage",
        status: "Anfrage eingegangen",
        statusTone: "info",
        progress: 8,
        nextAction: "Persönliche Prüfung durch druckkultur",
        nextActionDetail: "Die Angaben und hochgeladenen Unterlagen werden gesichtet. Anschließend meldet sich der zuständige Ansprechpartner.",
        due: "Rückmeldung folgt",
        delivery: request.deadline || "noch offen",
        contactUserId: currentCompany.assignedTeam[0],
        quantity: request.quantity || "noch offen",
        specification: specificationParts.join(" · ") || "Details werden im persönlichen Gespräch geklärt.",
        customerOrderNumber: request.customerOrderNumber || "",
        orderDate: request.orderDate || "",
        buyerName: request.buyerName || "",
        buyerEmail: request.buyerEmail || "",
        buyerPhone: request.buyerPhone || "",
        supplierNumber: request.supplierNumber || "",
        offerNumber: request.offerNumber || "",
        reference: request.reference || "",
        customerArticleNumber: request.customerArticleNumber || "",
        supplierArticleNumber: request.supplierArticleNumber || "",
        unitPrice: request.unitPrice || "",
        totalPrice: request.totalPrice || "",
        deliveryAddress: request.deliveryAddress || "",
        deliveryTerms: request.deliveryTerms || "",
        paymentTerms: request.paymentTerms || "",
        specialInstructions: request.specialInstructions || "",
        format: request.format || "",
        material: request.material || "",
        updated: "gerade eben",
        createdAt: new Date().toISOString(),
        createdByUserId: currentUser.id,
        seenBy: [currentUser.id],
        steps: buildSteps("Anfrage eingegangen"),
        statusHistory: [{
          id: `status-${Date.now()}`,
          status: "Anfrage eingegangen",
          note: currentUser.type === "internal" ? "Projekt durch druckkultur angelegt." : "Projekt durch den Kunden angelegt.",
          byUserId: currentUser.id,
          at: formatDateTime()
        }]
      };
      setProjects((current) => [project, ...current]);
      setMessages((current) => [...current, {
        id: `request-${Date.now()}`,
        companyId,
        projectId: id,
        senderUserId: currentUser.id,
        text: `Neues Projekt angelegt: „${project.title}“.`,
        time: "Gerade eben",
        createdAt: new Date().toISOString(),
        readBy: [currentUser.id]
      }]);
      if (file) await uploadDocument(id, file, { type: request.documentType || (currentUser.type === "internal" ? "Sonstiges" : "Anfrage") }, companyId);
      setSelectedProjectId(id);
      setActiveView("project");
      setNotice("Projekt wurde angelegt und direkt geöffnet.");
    }

  function requestCallback(assignedUserId, form) {
      if (!currentUser || currentUser.type !== "customer") return;
      const contactMethod = form.contactMethod === "teams" ? "teams" : "phone";
      const contactValue = contactMethod === "teams"
        ? (currentUser.teamsAccount || currentUser.email)
        : currentUser.phone;
      const entry = {
        id: `cb-${Date.now()}`,
        companyId: currentCompany.id,
        requesterUserId: currentUser.id,
        assignedUserId,
        phone: currentUser.phone,
        teamsAccount: currentUser.teamsAccount || currentUser.email,
        contactMethod,
        contactValue,
        subject: form.subject || "Persönliche Rücksprache",
        preferredTime: form.preferredTime || "Möglichst bald",
        requestedAt: formatDateTime(),
        status: "pending",
        completedAt: ""
      };
      setCallbacks((current) => [entry, ...current]);
      setCallbackTargetUserId(null);
      setNotice(contactMethod === "teams"
        ? `Teams-Gespräch mit ${getUser(users, assignedUserId)?.firstName || "dem Projektteam"} angefordert.`
        : `Rückrufwunsch an ${getUser(users, assignedUserId)?.firstName || "das Projektteam"} gesendet.`);
    }
  function completeCallback(id) { setCallbacks((current) => current.map((entry) => entry.id === id ? { ...entry, status: "completed", completedAt: formatDateTime() } : entry)); setDismissedCallbacks((current) => current.filter((item) => item !== id)); setNotice("Rückruf als erledigt markiert."); }

  function updateAvailability(status) {
    if (!currentUser || currentUser.type !== "internal" || !availabilityOptions[status]) return;
    setUsers((current) => current.map((user) => user.id === currentUser.id ? { ...user, availabilityStatus: status, availabilityUpdatedAt: formatDateTime() } : user));
    setNotice(`Status auf „${availabilityOptions[status].label}“ gesetzt.`);
  }

  function updateCompany(companyId, patch) {
    setCompanies((current) => current.map((company) => {
      if (company.id !== companyId) return company;
      const name = patch.name?.trim() || company.name;
      const nameChanged = name !== company.name;
      return normalizeCompanyForVersion({ ...company, ...patch, name, shortName: deriveCompanyShortName(name), initials: nameChanged ? deriveInitials(name) : company.initials, logoUpdatedAt: Date.now() });
    }));
    setNotice("Firmenname, Kurzname, Initialen, Farbwelt und Logo wurden überall aktualisiert.");
  }
  function updateUser(userId, patch) {
    const target = users.find((user) => user.id === userId);
    if (!target || target.deleted) return false;
    const name = (patch.name ?? target.name).trim();
    const email = (patch.email ?? target.email).trim().toLocaleLowerCase("de");
    if (!name) { setNotice("Der Benutzername darf nicht leer sein."); return false; }
    if (!email || !email.includes("@")) { setNotice("Bitte eine gültige E-Mail-Adresse eintragen."); return false; }
    if (users.some((user) => !user.deleted && user.id !== userId && user.email.toLocaleLowerCase("de") === email)) { setNotice("Diese E-Mail-Adresse ist bereits einem anderen Benutzer zugeordnet."); return false; }
    setUsers((current) => current.map((user) => user.id === userId ? { ...user, ...patch, name, email, firstName: name.split(/\s+/)[0], initials: deriveInitials(name), rights: patch.rights ? { ...user.rights, ...patch.rights } : user.rights } : user));
    setNotice("Benutzerdaten und Rechte wurden gespeichert.");
    return true;
  }
  function inviteUser(companyId, form) {
    const email = form.email.trim().toLocaleLowerCase("de");
    if (users.some((user) => !user.deleted && user.email.toLocaleLowerCase("de") === email)) { setNotice("Diese E-Mail-Adresse ist bereits einem Benutzer zugeordnet."); return false; }
    const id = `${companyId}-${Date.now()}`;
    const name = form.name.trim();
    setUsers((current) => [...current, { id, type: "customer", companyId, name, firstName: name.split(/\s+/)[0], email, phone: form.phone.trim(), teamsAccount: form.teamsAccount.trim() || email, password: "demo", roleLabel: form.roleLabel.trim() || "Mitarbeiter/in", initials: deriveInitials(name), rights: { viewAllProjects: false, manageCompany: false, manageUsers: false, approve: false, viewFinancials: false, createRequests: true } }]);
    setNotice("Benutzer wurde angelegt und kann sich im Vorführmodus anmelden.");
    return true;
  }
  function deleteUser(userId) {
    const target = users.find((user) => user.id === userId && user.type === "customer");
    if (!target) return;
    if (target.id === currentUser?.id) { setNotice("Der aktuell angemeldete Benutzer kann nicht gelöscht werden."); return; }
    const companyUsers = users.filter((user) => user.type === "customer" && !user.deleted && user.companyId === target.companyId);
    if (companyUsers.length <= 1) { setNotice("Der letzte Benutzer einer Firma kann nicht gelöscht werden."); return; }
    const remainingManagers = companyUsers.filter((user) => user.id !== target.id && user.rights.manageUsers);
    if (target.rights.manageUsers && currentUser?.type === "customer" && remainingManagers.length === 0) { setNotice("Mindestens ein weiterer Firmenbenutzer muss Benutzer verwalten dürfen."); return; }
    if (!window.confirm(`Soll ${target.name} wirklich gelöscht werden? Die bisherigen Projekt- und Nachrichtenverläufe bleiben erhalten.`)) return;
    const fallbackOwner = companyUsers.find((user) => user.id !== target.id && user.rights.viewAllProjects)?.id || companyUsers.find((user) => user.id !== target.id)?.id;
    setUsers((current) => current.map((user) => user.id === target.id ? { ...user, deleted: true, deletedAt: formatDateTime(), availabilityStatus: "offline" } : user));
    setProjects((current) => current.map((project) => {
      if (project.companyId !== target.companyId || !project.ownerUserIds.includes(target.id)) return project;
      const ownerUserIds = project.ownerUserIds.filter((id) => id !== target.id);
      return { ...project, ownerUserIds: ownerUserIds.length ? ownerUserIds : (fallbackOwner ? [fallbackOwner] : []) };
    }));
    setCallbacks((current) => current.filter((entry) => entry.requesterUserId !== target.id));
    setNotice(`${target.name} wurde gelöscht. Der Login ist gesperrt; historische Projekt- und Nachrichtenverläufe bleiben erhalten.`);
  }
  function resetDemo() {
    setCompanies(initialCompanies.map(normalizeCompanyForVersion)); setUsers(initialUsers.map(normalizeUserForVersion)); setProjects(initialProjects.map(normalizeProjectForVersion)); setMessages(initialMessages); setDocuments(initialDocuments); setCallbacks(initialCallbacks); setCurrentUserId(null); setSelectedCompanyId(null); setActiveView("dashboard"); setSelectedProjectId(null); window.localStorage.removeItem(STORAGE_KEY);
    if ("indexedDB" in window) window.indexedDB.deleteDatabase(FILE_DB);
  }

  if (!hydrated) return <div className="loading-screen">druckkultur desk wird geladen …</div>;
  if (!currentUser) return <LoginScreen users={users} companies={companies} onLogin={login} />;

  const canManageCompany = currentUser.type === "internal" ? Boolean(currentUser.rights.manageCompanies) : Boolean(currentUser.rights.manageCompany || currentUser.rights.manageUsers);
  const navItems = [
    ...(currentUser.type === "internal" ? [{ id: "companies", label: "Firmenübersicht", icon: "layers" }, { id: "callbacks", label: "Rückrufzentrale", icon: "phone" }] : []),
    ...baseNav.filter((item) => item.id !== "request" || currentUser.type === "internal" || currentUser.rights.createRequests),
    ...(canManageCompany ? [{ id: "settings", label: "Firmeneinstellungen", icon: "shield" }] : [])
  ];
  const companyStyle = { "--brand": currentCompany?.primaryColor || "#0b7772", "--brand-soft": currentCompany?.accentColor || "#9ed0c8" };

  return (
    <div className="portal-root" style={companyStyle}>
      <a className="skip-link" href="#main-content">Zum Hauptinhalt</a>
      <Sidebar navItems={navItems} activeView={activeView} currentUser={currentUser} currentCompany={currentCompany} companies={accessibleCompanies} unreadByCompany={unreadByCompany} newProjectsByCompany={newProjectsByCompany} callbackByCompany={pendingCallbacksByCompany} mobileOpen={mobileMenuOpen} onNavigate={navigate} onSwitchCompany={switchCompany} onClose={() => setMobileMenuOpen(false)} onLogout={logout} onReset={resetDemo} onAvailabilityChange={updateAvailability} />
      <div className="app-column">
        <Topbar currentUser={currentUser} currentCompany={currentCompany} searchTerm={searchTerm} unreadCount={unreadByCompany[currentCompany?.id] || 0} callbackCount={pendingCallbacksForUser.length} onSearch={setSearchTerm} onMenu={() => setMobileMenuOpen(true)} onMessages={() => navigate("messages")} onCallbacks={() => navigate("callbacks")} onLogout={logout} />
        <main id="main-content" tabIndex="-1" className="main-content">
          {activeView === "companies" && currentUser.type === "internal" && <CompaniesView companies={accessibleCompanies} projects={projects} unreadByCompany={unreadByCompany} newProjectsByCompany={newProjectsByCompany} callbackByCompany={pendingCallbacksByCompany} users={users} onOpen={switchCompany} />}
          {activeView === "dashboard" && <DashboardView currentUser={currentUser} company={currentCompany} projects={visibleProjects} messages={visibleMessages} callbacks={callbacks} users={users} unreadByCompany={unreadByCompany} newProjectsByCompany={newProjectsByCompany} callbackByCompany={pendingCallbacksByCompany} companies={accessibleCompanies} onOpenProject={openProject} onNavigate={navigate} onApprove={approveProject} onSwitchCompany={switchCompany} />}
          {activeView === "projects" && <ProjectsView projects={visibleProjects} users={users} currentUser={currentUser} searchTerm={searchTerm} onSearch={setSearchTerm} onOpenProject={openProject} onCreateProject={() => navigate("request")} />}
          {activeView === "project" && selectedProject && <ProjectDetailView project={selectedProject} users={users} currentUser={currentUser} messages={messages.filter((message) => message.projectId === selectedProject.id)} documents={documents.filter((document) => document.projectId === selectedProject.id && (!document.financial || currentUser.type === "internal" || currentUser.rights.viewFinancials))} onBack={() => navigate("projects")} onApprove={() => approveProject(selectedProject.id)} onMessage={(text) => addProjectMessage(selectedProject.id, text)} onMarkRead={() => markThreadRead(`project:${selectedProject.id}`)} onDownload={(document) => downloadDocument(document, selectedProject)} onUpload={(file, meta) => uploadDocument(selectedProject.id, file, meta)} onUpdate={(draft) => updateProject(selectedProject.id, draft)} />}
          {activeView === "messages" && <MessagesView messages={visibleMessages} projects={visibleProjects} users={users} company={currentCompany} currentUser={currentUser} initialTargetUserId={messageTargetUserId} onTargetUsed={() => setMessageTargetUserId(null)} onSendProject={addProjectMessage} onSendDirect={addDirectMessage} onMarkRead={markThreadRead} />}
          {activeView === "documents" && <DocumentsView documents={visibleDocuments} projects={visibleProjects} currentUser={currentUser} onDownload={downloadDocument} onUpload={uploadDocument} />}
          {activeView === "request" && <RequestView company={currentCompany} currentUser={currentUser} onCreate={createRequest} />}
          {activeView === "team" && <TeamView company={currentCompany} users={users} currentUser={currentUser} onMessage={openDirectMessage} onCallback={(id) => setCallbackTargetUserId(id)} />}
          {activeView === "callbacks" && currentUser.type === "internal" && <CallbacksView callbacks={callbacks.filter((entry) => entry.assignedUserId === currentUser.id)} users={users} companies={companies} onComplete={completeCallback} onOpenCompany={switchCompany} />}
          {activeView === "settings" && canManageCompany && <CompanySettingsView company={currentCompany} users={users.filter((user) => user.type === "customer" && !user.deleted && user.companyId === currentCompany.id)} currentUser={currentUser} onUpdateCompany={updateCompany} onUpdateUser={updateUser} onInvite={inviteUser} onDeleteUser={deleteUser} />}
        </main>
      </div>
      {callbackTargetUserId && <CallbackRequestModal target={getUser(users, callbackTargetUserId)} currentUser={currentUser} onClose={() => setCallbackTargetUserId(null)} onSubmit={(form) => requestCallback(callbackTargetUserId, form)} />}
      {popupCallback && <CallbackPopup entry={popupCallback} requester={getUser(users, popupCallback.requesterUserId)} company={getCompany(companies, popupCallback.companyId)} onLater={() => setDismissedCallbacks((current) => [...current, popupCallback.id])} onComplete={() => completeCallback(popupCallback.id)} />}
      {notice && <div className="toast" role="status"><Icon name="check" size={20} />{notice}</div>}
    </div>
  );
}

function LoginScreen({ users, companies, onLogin }) {
  const [mode, setMode] = useState("customer");
  const candidates = users.filter((user) => user.type === mode && !user.deleted);
  const [email, setEmail] = useState(candidates[0]?.email || "");
  const [password, setPassword] = useState("demo");
  const [error, setError] = useState("");
  useEffect(() => { const first = users.find((user) => user.type === mode && !user.deleted); setEmail(first?.email || ""); setPassword("demo"); setError(""); }, [mode, users]);
  function submit(event) { event.preventDefault(); if (!onLogin(email, password, mode)) setError(`${mode === "customer" ? "Kundenkonto" : "Mitarbeiterkonto"} nicht gefunden oder Passwort falsch. Im Vorführmodus lautet das Passwort „demo“.`); }
  return <main className="login-page"><section className="login-brand"><div className="login-logo"><Icon name="print" size={40} /><span><strong>druckkultur</strong><small>desk</small></span></div><p className="eyebrow">Ihre externe Druckabteilung</p><h1>Direkter Kontakt. Alle Printprojekte an einem Ort.</h1><p>Beratung, Nachrichten, Dateien, Freigaben, Rückrufe und Projektsteuerung in einem gemeinsamen Arbeitsraum.</p><div className="login-features"><span><Icon name="users" size={22} /> Persönliche Ansprechpartner</span><span><Icon name="fileCheck" size={22} /> Echte Dateiablage im Browser</span><span><Icon name="phone" size={22} /> Sichtbare Rückrufwünsche</span></div></section><section className="login-panel"><div className="login-card"><div className="login-tabs"><button className={mode === "customer" ? "active" : ""} onClick={() => { setMode("customer"); setError(""); }}>Kundenlogin</button><button className={mode === "internal" ? "active" : ""} onClick={() => { setMode("internal"); setError(""); }}>Mitarbeiterlogin</button></div><div className="login-heading"><span className="eyebrow">Vorführmodus</span><h2>{mode === "customer" ? "Als Kunde anmelden" : "Als druckkultur-Mitarbeiter anmelden"}</h2></div><form onSubmit={submit}><label className="form-field"><span>E-Mail-Adresse</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label className="form-field"><span>Passwort</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button wide-button" type="submit">Anmelden <Icon name="arrow" size={19} /></button></form><div className="demo-accounts"><strong>Zugang auswählen</strong><p>Passwort ist bei allen Konten <code>demo</code>.</p><div className="demo-account-list">{candidates.map((user) => { const company = getCompany(companies, user.companyId); return <button key={user.id} onClick={() => { setEmail(user.email); setPassword("demo"); }}><span className="avatar">{user.initials}</span><span><strong>{user.name}</strong><small>{company ? `${company.shortName} · ` : ""}{user.roleLabel}</small></span></button>; })}</div></div><p className="demo-note"><Icon name="shield" size={17} />Die Vorführung speichert Änderungen in diesem Browser. Für den echten Mehrbenutzerbetrieb werden Server-Login, Datenbank und geschützte Dateiablage ergänzt.</p></div></section></main>;
}

function Sidebar({ navItems, activeView, currentUser, currentCompany, companies, unreadByCompany, newProjectsByCompany, callbackByCompany, mobileOpen, onNavigate, onSwitchCompany, onClose, onLogout, onReset, onAvailabilityChange }) {
  const availability = availabilityOptions[currentUser.availabilityStatus || "available"];
  return <><button className={classNames("mobile-backdrop", mobileOpen && "visible")} onClick={onClose} aria-label="Menü schließen" /><aside className={classNames("sidebar", mobileOpen && "mobile-open")}><div className="brand-lockup"><span className="brand-mark"><Icon name="print" size={28} /></span><span><strong>druckkultur</strong><small>desk</small></span></div><div className="company-identity"><CompanyLogo company={currentCompany} /><div><span>{currentUser.type === "internal" ? "Aktive Firma" : "Ihr Unternehmen"}</span><strong>{currentCompany?.name}</strong></div></div>{currentUser.type === "internal" && <div className="company-switcher"><div className="sidebar-label"><span>Firmen wechseln</span></div><div className="company-switch-list">{companies.map((company) => <button key={company.id} className={company.id === currentCompany?.id ? "active" : ""} onClick={() => onSwitchCompany(company.id)}><CompanyLogo company={company} compact /><span><strong>{company.name}</strong><small>{company.customerNumber}</small></span><span className="company-alerts">{(newProjectsByCompany[company.id] || 0) > 0 && <b className="project-badge" title="Neue Projekte"><Icon name="projects" size={12} />{newProjectsByCompany[company.id]}</b>}{(unreadByCompany[company.id] || 0) > 0 && <b className="count-badge" title="Ungelesene Nachrichten">{unreadByCompany[company.id]}</b>}{(callbackByCompany[company.id] || 0) > 0 && <b className="phone-badge" title="Offene Rückrufe"><Icon name="phone" size={12} />{callbackByCompany[company.id]}</b>}</span></button>)}</div></div>}<nav className="main-nav">{navItems.map((item) => <button key={item.id} className={activeView === item.id ? "active" : ""} onClick={() => onNavigate(item.id)}><Icon name={item.icon} size={22} /><span>{item.label}</span>{item.id === "projects" && (newProjectsByCompany[currentCompany?.id] || 0) > 0 && <b className="project-badge"><Icon name="projects" size={12} />{newProjectsByCompany[currentCompany.id]}</b>}{item.id === "messages" && (unreadByCompany[currentCompany?.id] || 0) > 0 && <b className="count-badge">{unreadByCompany[currentCompany.id]}</b>}{item.id === "callbacks" && (callbackByCompany[currentCompany?.id] || 0) > 0 && <b className="phone-badge">{callbackByCompany[currentCompany.id]}</b>}</button>)}</nav><div className="sidebar-footer"><div className="signed-in-user"><span className="avatar">{currentUser.initials}</span><span><strong>{currentUser.name}</strong><small>{currentUser.roleLabel}</small></span></div>{currentUser.type === "internal" && <label className={classNames("availability-select", availability.tone)}><span><i />Eigener Status</span><select value={currentUser.availabilityStatus || "available"} onChange={(event) => onAvailabilityChange(event.target.value)}>{Object.entries(availabilityOptions).map(([value, option]) => <option value={value} key={value}>{option.label}</option>)}</select><small>{availability.description}</small></label>}<div className="sidebar-version">Version {APP_VERSION}</div><div className="sidebar-footer-actions"><button onClick={onLogout}>Abmelden</button><button onClick={onReset}>Vorführung zurücksetzen</button></div></div></aside></>;
}
function Topbar({ currentUser, currentCompany, searchTerm, unreadCount, callbackCount, onSearch, onMenu, onMessages, onCallbacks, onLogout }) {
  return <header className="topbar"><button className="icon-button mobile-menu" onClick={onMenu}><Icon name="menu" /></button><div className="topbar-context"><span>{currentCompany?.shortName}</span><strong>{formatToday()}</strong></div><label className="global-search"><Icon name="search" size={21} /><input value={searchTerm} onChange={(event) => onSearch(event.target.value)} placeholder="Projekt, Auftrag oder Status suchen …" /></label><div className="topbar-actions">{currentUser.type === "internal" && <button className="notification-button callback-topbar" onClick={onCallbacks} aria-label={`${callbackCount} offene Rückrufe`}><Icon name="phone" size={22} />{callbackCount > 0 && <b>{callbackCount}</b>}</button>}<button className="notification-button" onClick={onMessages}><Icon name="bell" size={22} />{unreadCount > 0 && <b>{unreadCount}</b>}</button><div className="topbar-user"><span className="avatar">{currentUser.initials}</span><span><strong>{currentUser.firstName}</strong><small>{currentUser.type === "internal" ? "druckkultur" : currentUser.roleLabel}</small></span><button onClick={onLogout}><Icon name="external" size={17} /></button></div></div></header>;
}
function CompanyLogo({ company, compact = false }) { return company?.logoData ? <span className={classNames("company-logo", compact && "compact")}><img key={company.logoUpdatedAt || company.logoData.length} src={company.logoData} alt={`${company.name} Logo`} /></span> : <span className={classNames("company-logo", compact && "compact")}>{company?.initials || "DK"}</span>; }

function CompaniesView({ companies, projects, unreadByCompany, newProjectsByCompany, callbackByCompany, users, onOpen }) {
  return <div className="page-stack"><PageHeader eyebrow="Mandantenübersicht" title="Alle betreuten Firmen" lead="Neue Nachrichten, Rückrufwünsche und offene Entscheidungen bleiben sichtbar, auch wenn Sie gerade in einer anderen Firma arbeiten." /><section className="company-grid">{companies.map((company) => { const companyProjects = projects.filter((project) => project.companyId === company.id); const open = companyProjects.filter((project) => project.progress < 100).length; const attention = companyProjects.filter((project) => project.statusTone === "warning").length; const customerUsers = users.filter((user) => user.type === "customer" && !user.deleted && user.companyId === company.id).length; return <button className="company-card" key={company.id} onClick={() => onOpen(company.id)}><div className="company-card-head"><CompanyLogo company={company} /><div><span>{company.customerNumber}</span><h2>{company.name}</h2><p>{company.industry}</p></div><div className="company-card-alerts">{newProjectsByCompany[company.id] > 0 && <b className="project-new-pill"><Icon name="projects" size={14} /> {newProjectsByCompany[company.id]} neue Projekte</b>}{unreadByCompany[company.id] > 0 && <b className="new-pill">{unreadByCompany[company.id]} Nachrichten</b>}{callbackByCompany[company.id] > 0 && <b className="callback-pill"><Icon name="phone" size={14} /> {callbackByCompany[company.id]} Rückruf</b>}</div></div><div className="company-metrics"><div><strong>{open}</strong><span>laufende Projekte</span></div><div><strong>{attention}</strong><span>offene Entscheidungen</span></div><div><strong>{customerUsers}</strong><span>Kundenzugänge</span></div></div><span className="company-open">Arbeitsraum öffnen <Icon name="arrow" size={18} /></span></button>; })}</section></div>;
}

function DashboardView({ currentUser, company, projects, messages, callbacks, users, unreadByCompany, newProjectsByCompany, callbackByCompany, companies, onOpenProject, onNavigate, onApprove, onSwitchCompany }) {
  const attention = projects.filter((project) => project.statusTone === "warning" || project.status === "Angebot liegt vor");
  const unread = messages.filter((message) => message.senderUserId !== currentUser.id && !(message.readBy || []).includes(currentUser.id));
  const open = projects.filter((project) => project.progress < 100);
  const ownCallbacks = callbacks.filter((entry) => entry.status === "pending" && (currentUser.type === "internal" ? entry.assignedUserId === currentUser.id : entry.requesterUserId === currentUser.id));
  return <div className="page-stack"><section className="dashboard-hero"><div><p className="eyebrow">{currentUser.type === "internal" ? `Arbeitsraum · ${company.name}` : "Ihre externe Druckabteilung"}</p><h1>Guten Morgen, {currentUser.firstName}.</h1><p>{attention.length ? `${attention.length} Vorgänge benötigen Ihre Aufmerksamkeit.` : "Alle wichtigen Vorgänge sind aktuell geklärt."}</p></div><div className="hero-actions"><button className="primary-button" onClick={() => onNavigate("request")}><Icon name="plus" size={20} /> Neues Projekt</button><button className="secondary-button" onClick={() => onNavigate("messages")}><Icon name="message" size={20} /> Nachricht senden</button></div></section>{currentUser.type === "internal" && <section className="cross-company-strip"><div><span className="eyebrow">Firmenübergreifend</span><strong>Was außerhalb von {company.shortName} neu ist</strong></div><div className="cross-company-items">{companies.filter((item) => item.id !== company.id).map((item) => <button key={item.id} onClick={() => onSwitchCompany(item.id)}><CompanyLogo company={item} compact /><span><strong>{item.shortName}</strong><small>{newProjectsByCompany[item.id] || 0} Projekte · {unreadByCompany[item.id] || 0} Nachrichten · {callbackByCompany[item.id] || 0} Rückrufe</small></span>{((newProjectsByCompany[item.id] || 0) + (unreadByCompany[item.id] || 0) + (callbackByCompany[item.id] || 0)) > 0 && <b>{(newProjectsByCompany[item.id] || 0) + (unreadByCompany[item.id] || 0) + (callbackByCompany[item.id] || 0)}</b>}</button>)}</div></section>}<section className="summary-row"><button onClick={() => onNavigate("projects")}><span className="metric-icon warning"><Icon name="clock" /></span><span><strong>{attention.length}</strong><small>offene Entscheidungen</small></span></button><button onClick={() => onNavigate("messages")}><span className="metric-icon info"><Icon name="message" /></span><span><strong>{unread.length}</strong><small>ungelesene Nachrichten</small></span></button><button onClick={() => currentUser.type === "internal" ? onNavigate("callbacks") : onNavigate("team")}><span className="metric-icon"><Icon name="phone" /></span><span><strong>{ownCallbacks.length}</strong><small>{currentUser.type === "internal" ? "offene Rückrufe" : "angeforderte Rückrufe"}</small></span></button><button onClick={() => onNavigate("projects")}><span className="metric-icon success"><Icon name="projects" /></span><span><strong>{newProjectsByCompany[company.id] || 0}</strong><small>neue Projekte</small></span></button></section><section className="dashboard-focus-grid"><div className="panel focus-panel"><PanelHeader title="Jetzt wichtig" subtitle="Nur Vorgänge, bei denen eine Entscheidung oder Reaktion nötig ist" action="Alle Projekte" onAction={() => onNavigate("projects")} /><div className="focus-list">{attention.length ? attention.slice(0, 5).map((project) => <article key={project.id}><button onClick={() => onOpenProject(project.id)}><span className={classNames("status-dot", project.statusTone)} /><span><small>{project.id} · {project.category}</small><strong>{project.nextAction}</strong><p>{project.title}</p></span><time>{project.due}</time></button>{project.status === "Freigabe erforderlich" && currentUser.rights.approve && <button className="small-action" onClick={() => onApprove(project.id)}>Freigeben</button>}</article>) : <EmptyState title="Nichts offen" text="Derzeit ist keine Entscheidung erforderlich." />}</div></div><div className="panel"><PanelHeader title="Neu eingegangen" subtitle="Nachrichten aus den Projekten" action="Postfach" onAction={() => onNavigate("messages")} /><div className="message-preview-list">{unread.length ? unread.slice(-4).reverse().map((message) => { const sender = getUser(users, message.senderUserId); const project = projects.find((item) => item.id === message.projectId); return <button key={message.id} onClick={() => message.projectId ? onOpenProject(message.projectId) : onNavigate("messages")}><span className="avatar">{sender?.initials || "DK"}</span><span><strong>{sender?.name || "Projektteam"}</strong><small>{project?.title || "Direkte Nachricht"}</small><p>{message.text}</p></span><i /></button>; }) : <EmptyState title="Alles gelesen" text="Keine neue Nachricht wartet auf Sie." />}</div></div></section><section className="panel"><PanelHeader title="Laufende Projekte" subtitle={`${projects.length} sichtbare Projekte bei ${company.shortName}`} action="Alle öffnen" onAction={() => onNavigate("projects")} /><ProjectTable projects={projects.slice(0, 7)} onOpen={onOpenProject} /></section></div>;
}


function ProjectsView({ projects, users, currentUser, searchTerm, onSearch, onOpenProject, onCreateProject }) {
  const [filter, setFilter] = useState("Alle");
  const filters = ["Alle", "Offen", "Freigabe", "Produktion", "Abgeschlossen"];
  const filtered = projects.filter((project) =>
    filter === "Alle" ||
    (filter === "Offen" && project.progress < 100) ||
    (filter === "Freigabe" && (project.status.includes("Freigabe") || project.status.includes("Angebot"))) ||
    (filter === "Produktion" && (project.status === "In Produktion" || project.status === "Versandbereit")) ||
    (filter === "Abgeschlossen" && project.progress === 100)
  );
  return (
    <div className="page-stack">
      <div className="page-heading-with-action">
        <PageHeader
          eyebrow="Auftragsübersicht"
          title="Projekte"
          lead="Jedes Projekt besitzt eine vollständige Arbeitsseite mit Statussteuerung, Nachrichten, Dateien, Freigaben und Zuständigkeiten."
        />
        <button className="primary-button create-project-button" onClick={onCreateProject}>
          <Icon name="plus" size={20} /> Projekt erstellen
        </button>
      </div>
      <section className="toolbar">
        <div className="filter-tabs">
          {filters.map((item) => (
            <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>
          ))}
        </div>
        <label className="inline-search">
          <Icon name="search" size={20} />
          <input value={searchTerm} onChange={(event) => onSearch(event.target.value)} placeholder="Projekte filtern …" />
        </label>
      </section>
      <section className="project-card-grid">
        {filtered.map((project) => {
          const owners = project.ownerUserIds.map((id) => getUser(users, id)).filter(Boolean);
          const contact = getUser(users, project.contactUserId);
          return (
            <article className="project-card" key={project.id}>
              <div className="project-card-top">
                <span className="project-symbol"><Icon name={project.category.includes("Faltschachtel") || project.category.includes("Verpackung") ? "layers" : "print"} size={32} /></span>
                <span className="project-card-statuses">{isProjectNewFor(project, currentUser) && <b className="project-new-label">Neu eingegangen</b>}<span className={classNames("status-badge", project.statusTone)}>{project.status}</span></span>
              </div>
              <span className="project-meta">{project.id} · {project.category}</span>
              <h2>{project.title}</h2>
              <p>{project.specification}</p>
              <div className="project-progress">
                <div><span>Fortschritt</span><strong>{project.progress}%</strong></div>
                <i><b style={{ width: `${project.progress}%` }} /></i>
              </div>
              <dl className="card-details">
                <div><dt>Nächster Schritt</dt><dd>{project.nextAction}</dd></div>
                <div><dt>Liefertermin</dt><dd>{project.delivery}</dd></div>
                <div><dt>Kundenseite</dt><dd>{owners.map((owner) => owner.name).join(", ") || "Teamleitung"}</dd></div>
                <div><dt>druckkultur</dt><dd>{contact?.name || "Projektteam"}</dd></div>
              </dl>
              <button className="card-link" onClick={() => onOpenProject(project.id)}>
                Projekt vollständig öffnen <Icon name="arrow" size={19} />
              </button>
            </article>
          );
        })}
      </section>
      {!filtered.length && <EmptyState title="Keine Projekte gefunden" text="Für diese Auswahl gibt es keine sichtbaren Projekte." />}
    </div>
  );
}

function ProjectDetailView({ project, users, currentUser, messages, documents, onBack, onApprove, onMessage, onMarkRead, onDownload, onUpload, onUpdate }) {
  const [tab, setTab] = useState("overview");
  const [draftMessage, setDraftMessage] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const contact = getUser(users, project.contactUserId);
  const owners = project.ownerUserIds.map((id) => getUser(users, id)).filter(Boolean);
  const history = [...(project.statusHistory || [])].reverse();
  useEffect(() => { if (tab === "messages") onMarkRead(); }, [tab]);

  return (
    <div className="page-stack project-detail-page">
      <button className="back-link" onClick={onBack}><Icon name="arrow" size={18} /> Zurück zur Projektübersicht</button>
      <section className="project-detail-header">
        <div>
          <span className="project-meta">{project.id} · {project.category}</span>
          <h1>{project.title}</h1>
          <p>{project.specification}</p>
        </div>
        <div className="project-header-status">
          <span className={classNames("status-badge", project.statusTone)}>{project.status}</span>
          <strong>{project.progress}%</strong>
          <small>Fortschritt</small>
        </div>
      </section>
      <div className="detail-tabs">
        {[["overview", "Übersicht"], ["messages", `Nachrichten (${messages.length})`], ["documents", `Dokumente (${documents.length})`]].map(([id, label]) => (
          <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="project-detail-grid">
          <div className="detail-main">
            <section className={classNames("next-action-card", project.statusTone)}>
              <div className="next-action-icon"><Icon name={project.statusTone === "warning" ? "clock" : "check"} size={27} /></div>
              <div>
                <span>Nächster Schritt</span>
                <h2>{project.nextAction}</h2>
                <p>{project.nextActionDetail}</p>
                {project.due !== "–" && <strong>Benötigt: {project.due}</strong>}
              </div>
              {project.status === "Freigabe erforderlich" && currentUser.rights.approve && (
                <button className="primary-button" onClick={onApprove}>Version freigeben</button>
              )}
            </section>

            <section className="panel detail-panel">
              <div className="section-heading"><h2>Projektverlauf</h2><span>{project.progress}% abgeschlossen</span></div>
              <div className="timeline full-timeline">
                {project.steps.map((step, index) => (
                  <div className={classNames("timeline-step", step.state)} key={`${step.label}-${index}`}>
                    <i>{step.state === "done" ? <Icon name="check" size={15} /> : index + 1}</i>
                    <div><strong>{step.label}</strong><span>{step.date}</span></div>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel detail-panel">
              <div className="section-heading"><h2>Statusprotokoll</h2><span>Nachvollziehbar für beide Seiten</span></div>
              <div className="status-history">
                {history.length ? history.map((entry) => {
                  const person = getUser(users, entry.byUserId);
                  return (
                    <article key={entry.id}>
                      <i />
                      <div>
                        <strong>{entry.status}</strong>
                        <p>{entry.note || "Status wurde aktualisiert."}</p>
                        <small>{entry.at} · {person?.name || "Projektteam"}</small>
                      </div>
                    </article>
                  );
                }) : <p className="muted-copy">Weitere Statusänderungen werden ab jetzt automatisch protokolliert.</p>}
              </div>
            </section>

            <section className="panel detail-panel">
              <div className="section-heading"><h2>Produkt und Zuständigkeiten</h2></div>
              <dl className="detail-grid">
                <div><dt>Auflage</dt><dd>{project.quantity}</dd></div>
                <div><dt>Liefertermin</dt><dd>{project.delivery}</dd></div>
                {project.customerOrderNumber && <div><dt>Bestellnummer</dt><dd>{project.customerOrderNumber}</dd></div>}
                {project.orderDate && <div><dt>Bestelldatum</dt><dd>{project.orderDate}</dd></div>}
                {project.offerNumber && <div><dt>Angebotsnummer</dt><dd>{project.offerNumber}</dd></div>}
                {project.reference && <div><dt>Referenz</dt><dd>{project.reference}</dd></div>}
                {project.customerArticleNumber && <div><dt>Kundenartikel</dt><dd>{project.customerArticleNumber}</dd></div>}
                {project.supplierArticleNumber && <div><dt>Unser Artikel</dt><dd>{project.supplierArticleNumber}</dd></div>}
                {project.buyerName && <div><dt>Einkauf</dt><dd>{project.buyerName}{project.buyerEmail ? ` · ${project.buyerEmail}` : ""}{project.buyerPhone ? ` · ${project.buyerPhone}` : ""}</dd></div>}
                {project.supplierNumber && <div><dt>Lieferantennummer</dt><dd>{project.supplierNumber}</dd></div>}
                {project.unitPrice && <div><dt>Einzelpreis</dt><dd>{project.unitPrice}</dd></div>}
                {project.totalPrice && <div><dt>Gesamtpreis</dt><dd>{project.totalPrice}</dd></div>}
                {project.deliveryAddress && <div className="wide"><dt>Lieferadresse</dt><dd className="preserve-lines">{project.deliveryAddress}</dd></div>}
                {project.deliveryTerms && <div><dt>Lieferbedingung</dt><dd>{project.deliveryTerms}</dd></div>}
                {project.paymentTerms && <div><dt>Zahlungsbedingung</dt><dd>{project.paymentTerms}</dd></div>}
                {project.format && <div><dt>Format</dt><dd>{project.format}</dd></div>}
                <div className="wide"><dt>Ausführung</dt><dd>{project.specification}</dd></div>
                <div><dt>druckkultur</dt><dd>{contact?.name}</dd></div>
                <div><dt>Kundenseite</dt><dd>{owners.map((owner) => owner.name).join(", ") || "Teamleitung"}</dd></div>
              </dl>
            </section>
          </div>
          <aside className="detail-side">
            {currentUser.type === "internal" ? (
              <ProjectControlPanel project={project} users={users} onSave={onUpdate} />
            ) : (
              <section className="panel contact-compact">
                <span className="eyebrow">Persönlicher Ansprechpartner</span>
                <div className="avatar xlarge">{contact?.initials}</div>
                <h2>{contact?.name}</h2>
                <p>{contact?.roleLabel}</p>
                <a className="secondary-button" href={telHref(contact?.phone)}><Icon name="phone" size={18} /> Direkt anrufen</a>
              </section>
            )}
          </aside>
        </div>
      )}

      {tab === "messages" && (
        <section className="panel project-communication">
          <div className="project-message-stream">
            {[...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((message) => {
              const sender = getUser(users, message.senderUserId);
              const own = message.senderUserId === currentUser.id;
              return (
                <article key={message.id} className={classNames("message-row", own && "own")}>
                  {!own && <span className="avatar">{sender?.initials || "DK"}</span>}
                  <div className="message-bubble">
                    <div className="message-author"><strong>{own ? "Sie" : sender?.name || "Projektteam"}</strong><time>{message.time}</time></div>
                    <p>{message.text}</p>
                    {own && <small className="read-receipt"><Icon name={(message.readBy || []).length > 1 ? "check" : "send"} size={15} />{receiptText(message, users, currentUser)}</small>}
                  </div>
                </article>
              );
            })}
          </div>
          <form className="message-composer" onSubmit={(event) => { event.preventDefault(); onMessage(draftMessage); setDraftMessage(""); }}>
            <textarea rows="4" value={draftMessage} onChange={(event) => setDraftMessage(event.target.value)} placeholder="Nachricht zum Projekt schreiben …" />
            <div><span>Die Nachricht bleibt dauerhaft diesem Projekt zugeordnet.</span><button className="primary-button" type="submit">Senden <Icon name="send" size={18} /></button></div>
          </form>
        </section>
      )}

      {tab === "documents" && (
        <section className="panel project-documents">
          <div className="documents-heading">
            <div><h2>Dateien und Dokumente</h2><p>Sie können jederzeit weitere Dokumente hochladen und die Dokumentart eindeutig auswählen.</p></div>
            <button className="primary-button" onClick={() => setUploadOpen((value) => !value)}><Icon name="upload" size={19} /> Dokument hochladen</button>
          </div>
          {uploadOpen && <UploadDocumentForm currentUser={currentUser} onUpload={async (file, meta) => { await onUpload(file, meta); setUploadOpen(false); }} />}
          <DocumentList documents={documents} project={project} onDownload={onDownload} />
        </section>
      )}
    </div>
  );
}

function ProjectControlPanel({ project, users, onSave }) {
  const customerUsers = users.filter((user) => user.type === "customer" && !user.deleted && user.companyId === project.companyId);
  const internalUsers = users.filter((user) => user.type === "internal" && user.companyIds.includes(project.companyId));
  const [draft, setDraft] = useState({
    status: project.status,
    progress: project.progress,
    nextAction: project.nextAction,
    nextActionDetail: project.nextActionDetail,
    statusNote: "",
    due: project.due,
    delivery: project.delivery,
    contactUserId: project.contactUserId,
    ownerUserIds: project.ownerUserIds,
    steps: normalizeWorkflowSteps(project.steps?.length ? project.steps : buildSteps(project.status))
  });

  useEffect(() => setDraft({
    status: project.status,
    progress: project.progress,
    nextAction: project.nextAction,
    nextActionDetail: project.nextActionDetail,
    statusNote: "",
    due: project.due,
    delivery: project.delivery,
    contactUserId: project.contactUserId,
    ownerUserIds: project.ownerUserIds,
    steps: normalizeWorkflowSteps(project.steps?.length ? project.steps : buildSteps(project.status))
  }), [project]);

  function changeStatus(status) {
    const preset = statusPresets[status];
    setDraft((current) => ({
      ...current,
      status,
      progress: preset.progress,
      nextAction: preset.next,
      nextActionDetail: preset.detail,
      due: status.includes("Freigabe") ? "Bitte zeitnah" : status === "Geliefert" ? "–" : current.due
    }));
  }

  function setStepCompleted(index, completed) {
    setDraft((current) => {
      const changed = current.steps.map((step, stepIndex) => stepIndex === index ? {
        ...step,
        completed,
        completedAt: completed ? formatDate() : "",
        state: completed ? "done" : "upcoming",
        date: completed ? formatDate() : "offen"
      } : step);
      const steps = normalizeWorkflowSteps(changed);
      const completedCount = steps.filter((step) => step.completed).length;
      return { ...current, steps, progress: Math.round((completedCount / Math.max(steps.length, 1)) * 100) };
    });
  }

  function toggleOwner(id) {
    setDraft((current) => ({
      ...current,
      ownerUserIds: current.ownerUserIds.includes(id)
        ? current.ownerUserIds.filter((item) => item !== id)
        : [...current.ownerUserIds, id]
    }));
  }

  return (
    <section className="panel project-control">
      <div className="control-heading">
        <span className="eyebrow">Mitarbeiterbereich</span>
        <h2>Projekt steuern</h2>
        <p>Die vorhandenen Projektstatus bleiben fest definiert. Im Projektverlauf können einzelne Arbeitsschritte zusätzlich als erledigt markiert werden.</p>
      </div>

      <label className="form-field">
        <span>Aktueller Projektstatus</span>
        <select value={draft.status} onChange={(event) => changeStatus(event.target.value)}>
          {Object.keys(statusPresets).map((status) => <option value={status} key={status}>{status}</option>)}
        </select>
      </label>

      <div className="workflow-editor">
        <div className="workflow-editor-heading">
          <div><strong>Projektverlauf</strong><span>Arbeitsschritte einzeln abschließen</span></div>
          <b>{draft.steps.filter((step) => step.completed).length}/{draft.steps.length} erledigt</b>
        </div>
        <div className="workflow-editor-list">
          {draft.steps.map((step, index) => (
            <article className={classNames(step.completed && "completed", step.state === "current" && "current")} key={`${step.label}-${index}`}>
              <span className="workflow-check">{step.completed ? <Icon name="check" size={17} /> : index + 1}</span>
              <div><strong>{step.label}</strong><small>{step.completed ? `Erledigt am ${step.completedAt || step.date}` : step.state === "current" ? "Aktueller Arbeitsschritt" : "Noch offen"}</small></div>
              <button type="button" className={step.completed ? "ghost-button compact" : "secondary-button compact"} onClick={() => setStepCompleted(index, !step.completed)}>
                {step.completed ? "Zurücknehmen" : "Als erledigt markieren"}
              </button>
            </article>
          ))}
        </div>
      </div>

      <label className="form-field">
        <span>Fortschritt: {draft.progress}%</span>
        <input type="range" min="0" max="100" value={draft.progress} onChange={(event) => setDraft((current) => ({ ...current, progress: event.target.value }))} />
      </label>
      <label className="form-field">
        <span>Nächster Schritt</span>
        <input value={draft.nextAction} onChange={(event) => setDraft((current) => ({ ...current, nextAction: event.target.value }))} />
      </label>
      <label className="form-field">
        <span>Erklärung für den Kunden</span>
        <textarea rows="4" value={draft.nextActionDetail} onChange={(event) => setDraft((current) => ({ ...current, nextActionDetail: event.target.value }))} />
      </label>
      <label className="form-field">
        <span>Notiz zur Änderung</span>
        <textarea rows="3" value={draft.statusNote} onChange={(event) => setDraft((current) => ({ ...current, statusNote: event.target.value }))} placeholder="Optional – erscheint im Statusprotokoll" />
      </label>
      <div className="control-two">
        <label className="form-field"><span>Benötigt bis</span><input value={draft.due} onChange={(event) => setDraft((current) => ({ ...current, due: event.target.value }))} /></label>
        <label className="form-field"><span>Liefertermin</span><input value={draft.delivery} onChange={(event) => setDraft((current) => ({ ...current, delivery: event.target.value }))} /></label>
      </div>
      <label className="form-field">
        <span>Zuständig bei druckkultur</span>
        <select value={draft.contactUserId} onChange={(event) => setDraft((current) => ({ ...current, contactUserId: event.target.value }))}>
          {internalUsers.map((user) => <option value={user.id} key={user.id}>{user.name}</option>)}
        </select>
      </label>
      <fieldset className="owner-fieldset">
        <legend>Sichtbar und zugeordnet beim Kunden</legend>
        {customerUsers.map((user) => (
          <label key={user.id}>
            <input type="checkbox" checked={draft.ownerUserIds.includes(user.id)} onChange={() => toggleOwner(user.id)} />
            <span>{user.name}<small>{user.roleLabel}</small></span>
          </label>
        ))}
      </fieldset>
      <button className="primary-button wide-button" onClick={() => onSave(draft)}>Projektänderungen speichern</button>
    </section>
  );
}

function MessagesView({ messages, projects, users, company, currentUser, initialTargetUserId, onTargetUsed, onSendProject, onSendDirect, onMarkRead }) {
  const possibleContacts = users.filter((user) =>
    currentUser.type === "internal"
      ? user.type === "customer" && !user.deleted && user.companyId === company.id
      : user.type === "internal" && company.assignedTeam.includes(user.id)
  );
  const directMessages = messages.filter((message) => message.threadType === "direct");
  const directPartners = new Map();
  directMessages.forEach((message) => {
    const partnerId = (message.participantUserIds || []).find((id) => id !== currentUser.id);
    if (partnerId) directPartners.set(partnerId, getUser(users, partnerId));
  });
  possibleContacts.forEach((user) => directPartners.set(user.id, user));

  const projectThreads = projects.map((project) => ({
    id: `project:${project.id}`,
    type: "project",
    project,
    title: project.title,
    subtitle: project.id
  }));
  const directThreads = [...directPartners.entries()].filter(([, user]) => user).map(([id, user]) => ({
    id: directThreadId(company.id, currentUser.id, id),
    type: "direct",
    partnerId: id,
    title: user.name,
    subtitle: user.deleted ? "Gelöschter Benutzer · Verlauf nur lesbar" : `Direkter Kontakt · ${user.roleLabel}`,
    disabled: Boolean(user.deleted)
  }));
  const threads = [...directThreads, ...projectThreads];
  const preferred = initialTargetUserId ? directThreadId(company.id, currentUser.id, initialTargetUserId) : null;

  const [activeThreadId, setActiveThreadId] = useState(null);
  const [draft, setDraft] = useState("");
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [newType, setNewType] = useState("direct");
  const [newTargetId, setNewTargetId] = useState("");

  useEffect(() => {
    setActiveThreadId(null);
    setDraft("");
    setNewMessageOpen(false);
  }, [company.id]);

  useEffect(() => {
    if (preferred) {
      setActiveThreadId(preferred);
      onTargetUsed();
    }
  }, [preferred]);

  useEffect(() => {
    if (activeThreadId) onMarkRead(activeThreadId);
  }, [activeThreadId]);

  const active = threads.find((thread) => thread.id === activeThreadId) || null;
  const threadMessages = active
    ? messages.filter((message) => threadIdForMessage(message) === active.id).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];

  function beginNewMessage() {
    setNewMessageOpen(true);
    setActiveThreadId(null);
    setNewType("direct");
    setNewTargetId(possibleContacts[0]?.id || "");
  }

  function openSelectedThread() {
    if (!newTargetId) return;
    const id = newType === "project"
      ? `project:${newTargetId}`
      : directThreadId(company.id, currentUser.id, newTargetId);
    setActiveThreadId(id);
    setNewMessageOpen(false);
    setDraft("");
  }

  function send(event) {
    event.preventDefault();
    if (!draft.trim() || !active || active.disabled) return;
    if (active.type === "project") onSendProject(active.project.id, draft);
    else onSendDirect(active.partnerId, draft);
    setDraft("");
  }

  return (
    <div className="page-stack">
      <div className="page-heading-with-action">
        <PageHeader
          eyebrow="Direkter Draht"
          title="Nachrichten"
          lead="Keine Unterhaltung wird automatisch geöffnet. Wählen Sie bewusst ein Projekt oder starten Sie eine neue persönliche Nachricht."
        />
        <button className="primary-button create-project-button" onClick={beginNewMessage}>
          <Icon name="plus" size={20} /> Neue Nachricht
        </button>
      </div>

      {newMessageOpen && (
        <section className="panel new-message-panel">
          <div>
            <span className="eyebrow">Neue Unterhaltung</span>
            <h2>Wem möchten Sie schreiben?</h2>
          </div>
          <div className="new-message-fields">
            <label className="form-field">
              <span>Art der Nachricht</span>
              <select value={newType} onChange={(event) => {
                const value = event.target.value;
                setNewType(value);
                setNewTargetId(value === "direct" ? possibleContacts[0]?.id || "" : projects[0]?.id || "");
              }}>
                <option value="direct">Direkte Nachricht an eine Person</option>
                <option value="project">Nachricht zu einem Projekt</option>
              </select>
            </label>
            <label className="form-field">
              <span>{newType === "direct" ? "Empfänger" : "Projekt"}</span>
              <select value={newTargetId} onChange={(event) => setNewTargetId(event.target.value)}>
                {newType === "direct"
                  ? possibleContacts.map((person) => <option key={person.id} value={person.id}>{person.name} · {person.roleLabel}</option>)
                  : projects.map((project) => <option key={project.id} value={project.id}>{project.id} · {project.title}</option>)}
              </select>
            </label>
          </div>
          <div className="new-message-actions">
            <button className="ghost-button" onClick={() => setNewMessageOpen(false)}>Abbrechen</button>
            <button className="primary-button" onClick={openSelectedThread} disabled={!newTargetId}>Unterhaltung öffnen</button>
          </div>
        </section>
      )}

      <section className="messages-layout">
        <aside className="thread-list">
          <header><strong>Unterhaltungen</strong><span>{threads.length}</span></header>
          {threads.map((thread) => {
            const list = messages.filter((message) => threadIdForMessage(message) === thread.id);
            const last = list[list.length - 1];
            const unread = list.filter((message) => message.senderUserId !== currentUser.id && !(message.readBy || []).includes(currentUser.id)).length;
            return (
              <button key={thread.id} className={active?.id === thread.id ? "active" : ""} onClick={() => setActiveThreadId(thread.id)}>
                <span className="thread-icon"><Icon name={thread.type === "direct" ? "users" : "projects"} size={21} /></span>
                <span>
                  <strong>{thread.title}</strong>
                  <small>{thread.subtitle}</small>
                  <p>{last?.text || "Noch keine Nachricht"}</p>
                </span>
                {unread > 0 && <b className="count-badge">{unread}</b>}
              </button>
            );
          })}
        </aside>

        <div className="conversation-panel">
          {active ? (
            <>
              <header className="conversation-header">
                <div><span>{active.subtitle}</span><h2>{active.title}</h2></div>
                {active.type === "direct" && <span className="status-badge success">Persönlicher Kontakt</span>}
              </header>
              <div className="message-stream">
                {threadMessages.map((message) => {
                  const sender = getUser(users, message.senderUserId);
                  const own = message.senderUserId === currentUser.id;
                  return (
                    <article key={message.id} className={classNames("message-row", own && "own")}>
                      {!own && <span className="avatar">{sender?.initials || "DK"}</span>}
                      <div className="message-bubble">
                        <div className="message-author"><strong>{own ? "Sie" : sender?.name || "Projektteam"}</strong><time>{message.time}</time></div>
                        <p>{message.text}</p>
                        {own && <small className="read-receipt"><Icon name={(message.readBy || []).length > 1 ? "check" : "send"} size={15} />{receiptText(message, users, currentUser)}</small>}
                      </div>
                    </article>
                  );
                })}
                {!threadMessages.length && <EmptyState title="Neue Unterhaltung" text="Schreiben Sie die erste Nachricht. Sie wird dem gewählten Kontakt oder Projekt zugeordnet." />}
              </div>
              <form className="message-composer" onSubmit={send}>
                <textarea rows="4" value={draft} disabled={Boolean(active.disabled)} onChange={(event) => setDraft(event.target.value)} placeholder={active.disabled ? "Dieser Benutzer wurde gelöscht. Der Verlauf bleibt lesbar." : active.type === "direct" ? `Nachricht an ${active.title} …` : "Nachricht zum Projekt …"} />
                <div>
                  <span>{active.type === "direct" ? "Persönliche Nachricht an den gewählten Kontakt." : "Dauerhaft dem Projekt zugeordnet."}</span>
                  <button className="primary-button" type="submit" disabled={Boolean(active.disabled)}>Senden <Icon name="send" size={18} /></button>
                </div>
              </form>
            </>
          ) : (
            <div className="conversation-empty">
              <span className="conversation-empty-icon"><Icon name="message" size={34} /></span>
              <h2>Keine Nachricht ausgewählt</h2>
              <p>Öffnen Sie links eine bestehende Unterhaltung oder beginnen Sie über „Neue Nachricht“ ein neues Gespräch.</p>
              <button className="primary-button" onClick={beginNewMessage}><Icon name="plus" size={18} /> Neue Nachricht</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function DocumentsView({ documents, projects, currentUser, onDownload, onUpload }) {
  const [filter, setFilter] = useState("Alle");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const types = ["Alle", ...new Set(documents.map((document) => document.type))];
  const filtered = documents.filter((document) => filter === "Alle" || document.type === filter);

  useEffect(() => {
    if (!projects.some((project) => project.id === projectId)) setProjectId(projects[0]?.id || "");
  }, [projects, projectId]);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Dateien statt E-Mail-Suche"
        title="Dokumente"
        lead="Dokumente können jederzeit hochgeladen, eindeutig klassifiziert und dem richtigen Projekt zugeordnet werden."
      />
      <section className="documents-toolbar">
        <div className="filter-tabs">
          {types.map((type) => <button key={type} className={filter === type ? "active" : ""} onClick={() => setFilter(type)}>{type}</button>)}
        </div>
        <button className="primary-button" onClick={() => setUploadOpen((value) => !value)}>
          <Icon name="upload" size={19} /> Dokument hochladen
        </button>
      </section>
      {uploadOpen && (
        <section className="panel upload-global">
          <label className="form-field">
            <span>Projekt</span>
            <select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.id} · {project.title}</option>)}
            </select>
          </label>
          <UploadDocumentForm
            currentUser={currentUser}
            onUpload={async (file, meta) => {
              await onUpload(projectId, file, meta);
              setUploadOpen(false);
            }}
          />
        </section>
      )}
      <section className="document-grid">
        {filtered.map((document) => {
          const project = projects.find((item) => item.id === document.projectId);
          return <DocumentCard key={document.id} document={document} project={project} onDownload={() => onDownload(document, project)} />;
        })}
      </section>
      {!filtered.length && <EmptyState title="Keine Dokumente" text="Für diesen Filter sind keine Dokumente sichtbar." />}
    </div>
  );
}

function UploadDocumentForm({ currentUser, onUpload, defaultType = "" }) {
  const types = documentTypesFor(currentUser);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState(defaultType && types.includes(defaultType) ? defaultType : types[0]);

  useEffect(() => {
    const next = defaultType && types.includes(defaultType) ? defaultType : types[0];
    setType(next);
  }, [currentUser?.type, defaultType]);

  return (
    <form className="upload-document-form" onSubmit={async (event) => {
      event.preventDefault();
      if (!file) return;
      await onUpload(file, { title: title || file.name, type });
      setFile(null);
      setTitle("");
    }}>
      <label className="form-field">
        <span>Dokumentart</span>
        <select value={type} onChange={(event) => setType(event.target.value)}>
          {types.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      <label className="form-field">
        <span>Anzeigename</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Optional – sonst Dateiname" />
      </label>
      <label className="file-picker">
        <Icon name="upload" size={26} />
        <span>
          <strong>{file?.name || "Datei auswählen"}</strong>
          <small>{file ? formatBytes(file.size) : "PDF, Bild, Office-Datei oder ZIP · bis 20 MB"}</small>
        </span>
        <input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
      </label>
      <button className="primary-button" type="submit" disabled={!file}>Als {type} hochladen</button>
    </form>
  );
}
function DocumentList({ documents, project, onDownload }) { return <div className="drawer-document-list">{documents.map((document) => <article key={document.id}><span className="file-icon"><Icon name="document" size={23} /></span><div><strong>{document.title}</strong><span>{document.type} · {document.date} · {document.size}{document.blobKey ? " · hochgeladen" : ""}</span></div><button className="icon-button" onClick={() => onDownload(document)}><Icon name="download" size={20} /></button></article>)}</div>; }
function DocumentCard({ document, project, onDownload }) { return <article className="document-card"><span className="document-icon"><Icon name={document.type.includes("Freigabe") ? "fileCheck" : "document"} size={28} /></span><div><span>{document.type}</span><h2>{document.title}</h2><p>{project?.title}</p><small>{document.date} · {document.size}{document.blobKey ? " · Originaldatei" : ""}</small></div><button className="icon-button" onClick={onDownload}><Icon name="download" size={21} /></button></article>; }


function RequestView({ company, currentUser, onCreate }) {
  const [step, setStep] = useState(1);
  const [request, setRequest] = useState({
    ...emptyRequest,
    documentType: currentUser.type === "internal" ? "Sonstiges" : "Anfrage"
  });
  const [file, setFile] = useState(null);
  const [analysisFile, setAnalysisFile] = useState(null);
  const [analysisState, setAnalysisState] = useState("idle");
  const [analysisInfo, setAnalysisInfo] = useState("");
  const fileRef = useRef(null);
  const analysisRef = useRef(null);
  const kinds = ["Printprodukt", "Mailing", "Faltschachtel / Verpackung", "Veredelung", "Sonderproduktion", "Noch nicht sicher"];
  const documentTypes = documentTypesFor(currentUser);

  function update(key, value) {
    setRequest((current) => ({ ...current, [key]: value }));
  }

  async function analyzeOrderPdf() {
    if (!analysisFile) return;
    if (analysisFile.type !== "application/pdf" && !analysisFile.name.toLowerCase().endsWith(".pdf")) {
      setAnalysisInfo("Bitte wählen Sie für die automatische Auswertung ein PDF aus.");
      return;
    }
    if (analysisFile.size > 8 * 1024 * 1024) {
      setAnalysisInfo("Für die KI-Auswertung sind PDFs bis 8 MB vorgesehen.");
      return;
    }
    setAnalysisState("loading");
    setAnalysisInfo("");
    try {
      const formData = new FormData();
      formData.append("file", analysisFile);
      formData.append("company", company.name);
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
      const response = await fetch(`${basePath}/api/analyze-order`, { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Die PDF-Analyse ist fehlgeschlagen.");
      const data = result.data || {};
      setRequest((current) => ({
        ...current,
        kind: data.kind || current.kind || "Printprodukt",
        title: data.title || current.title,
        description: data.description || current.description,
        quantity: data.quantity || current.quantity,
        deadline: data.deadline || current.deadline,
        customerOrderNumber: data.customerOrderNumber || current.customerOrderNumber,
        orderDate: data.orderDate || current.orderDate,
        buyerName: data.buyerName || current.buyerName,
        buyerEmail: data.buyerEmail || current.buyerEmail,
        buyerPhone: data.buyerPhone || current.buyerPhone,
        supplierNumber: data.supplierNumber || current.supplierNumber,
        offerNumber: data.offerNumber || current.offerNumber,
        reference: data.reference || current.reference,
        customerArticleNumber: data.customerArticleNumber || current.customerArticleNumber,
        supplierArticleNumber: data.supplierArticleNumber || current.supplierArticleNumber,
        unitPrice: data.unitPrice || current.unitPrice,
        totalPrice: data.totalPrice || current.totalPrice,
        deliveryAddress: data.deliveryAddress || current.deliveryAddress,
        deliveryTerms: data.deliveryTerms || current.deliveryTerms,
        paymentTerms: data.paymentTerms || current.paymentTerms,
        specialInstructions: data.specialInstructions || current.specialInstructions,
        format: data.format || current.format,
        material: data.material || current.material,
        documentType: currentUser.type === "internal" ? "Sonstiges" : "Bestellung"
      }));
      setFile(analysisFile);
      setAnalysisState("done");
      setAnalysisInfo(result.mode === "ai"
        ? "Die Bestellung wurde mit KI ausgewertet. Bitte die erkannten Angaben kurz kontrollieren."
        : "Vorführanalyse ohne hinterlegten API-Schlüssel: Die Felder wurden mit einem realistischen Muster befüllt. Für echte PDF-Auswertung OPENAI_API_KEY in Webflow hinterlegen.");
    } catch (error) {
      console.error(error);
      setAnalysisState("error");
      setAnalysisInfo(error.message || "Die PDF konnte nicht ausgewertet werden.");
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (step < 3) {
      setStep((current) => current + 1);
      return;
    }
    await onCreate(request, file);
    setRequest({
      ...emptyRequest,
      documentType: currentUser.type === "internal" ? "Sonstiges" : "Anfrage"
    });
    setFile(null);
    setAnalysisFile(null);
    setAnalysisState("idle");
    setAnalysisInfo("");
    setStep(1);
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Kein Warenkorb, sondern persönliche Beratung"
        title="Projekt erstellen"
        lead={`Ein Bestell-PDF kann die Felder automatisch vorbelegen. Alternativ reichen eine Idee, ein Muster oder wenige Stichpunkte für ${company.name}.`}
      />
      <div className="request-layout">
        <section className="panel request-panel">
          <div className="stepper">
            {[1, 2, 3].map((item) => (
              <span key={item} className={step >= item ? "active" : ""}>
                <i>{step > item ? <Icon name="check" size={15} /> : item}</i>
                <b>{item === 1 ? "Bestellung oder Idee" : item === 2 ? "Prüfen & ergänzen" : "Dokument & Übergabe"}</b>
              </span>
            ))}
          </div>

          <form onSubmit={submit}>
            {step === 1 && (
              <div className="form-step">
                <div className="ai-order-panel">
                  <div className="ai-order-heading">
                    <span className="ai-order-icon"><Icon name="fileCheck" size={27} /></span>
                    <div>
                      <span className="eyebrow">Bestell-PDF automatisch auslesen</span>
                      <h2>PDF hochladen – Felder automatisch befüllen</h2>
                      <p>Bestellnummer, Bestelldatum, Einkaufskontakt, Artikelnummern, Menge, Termin, Lieferadresse und besondere Vorgaben werden erkannt und anschließend zur Kontrolle angezeigt.</p>
                    </div>
                  </div>
                  <button className="upload-zone compact-upload" type="button" onClick={() => analysisRef.current?.click()}>
                    <Icon name="upload" size={30} />
                    <strong>{analysisFile?.name || "Bestell-PDF auswählen"}</strong>
                    <small>{analysisFile ? `${formatBytes(analysisFile.size)} · bereit zur Analyse` : "PDF bis 8 MB"}</small>
                  </button>
                  <input
                    ref={analysisRef}
                    className="sr-only"
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(event) => {
                      setAnalysisFile(event.target.files?.[0] || null);
                      setAnalysisState("idle");
                      setAnalysisInfo("");
                    }}
                  />
                  <button className="primary-button ai-analyze-button" type="button" disabled={!analysisFile || analysisState === "loading"} onClick={analyzeOrderPdf}>
                    {analysisState === "loading" ? "PDF wird ausgewertet …" : "Bestellung automatisch auslesen"}
                  </button>
                  {analysisInfo && <p className={classNames("analysis-info", analysisState)}>{analysisInfo}</p>}
                </div>

                <div className="manual-divider"><span>oder manuell beginnen</span></div>
                <h2>Was möchten Sie umsetzen?</h2>
                <p>Wählen Sie nur die grobe Richtung. Die technische Lösung klären wir gemeinsam.</p>
                <div className="kind-grid">
                  {kinds.map((kind) => (
                    <button type="button" key={kind} className={request.kind === kind ? "selected" : ""} onClick={() => update("kind", kind)}>
                      <Icon name={kind.includes("Verpackung") ? "layers" : "print"} size={26} />
                      <span>{kind}</span>
                      {request.kind === kind && <Icon name="check" size={18} />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="form-step">
                <h2>Erkannte Angaben prüfen und ergänzen</h2>
                <p>Alle Felder bleiben bearbeitbar. Ungefähre Angaben genügen.</p>
                <div className="form-grid">
                  <label className="form-field wide">
                    <span>Arbeitstitel / Produkt</span>
                    <input value={request.title} onChange={(event) => update("title", event.target.value)} placeholder="z. B. Faltschachtel Magnesium Komplex" />
                  </label>
                  <label className="form-field">
                    <span>Kunden-Bestellnummer</span>
                    <input value={request.customerOrderNumber} onChange={(event) => update("customerOrderNumber", event.target.value)} placeholder="z. B. PO-2026-1845" />
                  </label>
                  <label className="form-field">
                    <span>Bestelldatum</span>
                    <input value={request.orderDate} onChange={(event) => update("orderDate", event.target.value)} placeholder="z. B. 04.08.2026" />
                  </label>
                  <label className="form-field">
                    <span>Einkäufer/in</span>
                    <input value={request.buyerName} onChange={(event) => update("buyerName", event.target.value)} placeholder="Name aus der Bestellung" />
                  </label>
                  <label className="form-field">
                    <span>E-Mail Einkauf</span>
                    <input value={request.buyerEmail} onChange={(event) => update("buyerEmail", event.target.value)} placeholder="E-Mail aus der Bestellung" />
                  </label>
                  <label className="form-field">
                    <span>Telefon Einkauf</span>
                    <input value={request.buyerPhone} onChange={(event) => update("buyerPhone", event.target.value)} placeholder="Durchwahl aus der Bestellung" />
                  </label>
                  <label className="form-field">
                    <span>Lieferantennummer</span>
                    <input value={request.supplierNumber} onChange={(event) => update("supplierNumber", event.target.value)} placeholder="Kundenseitige Lieferantennummer" />
                  </label>
                  <label className="form-field">
                    <span>Angebotsnummer</span>
                    <input value={request.offerNumber} onChange={(event) => update("offerNumber", event.target.value)} placeholder="Optional" />
                  </label>
                  <label className="form-field">
                    <span>Referenz</span>
                    <input value={request.reference} onChange={(event) => update("reference", event.target.value)} placeholder="Optional" />
                  </label>
                  <label className="form-field">
                    <span>Kunden-Artikelnummer</span>
                    <input value={request.customerArticleNumber} onChange={(event) => update("customerArticleNumber", event.target.value)} placeholder="Artikelnummer des Kunden" />
                  </label>
                  <label className="form-field">
                    <span>Unsere Artikelnummer</span>
                    <input value={request.supplierArticleNumber} onChange={(event) => update("supplierArticleNumber", event.target.value)} placeholder="Falls in der Bestellung vorhanden" />
                  </label>
                  <label className="form-field">
                    <span>Ungefähre Menge</span>
                    <input value={request.quantity} onChange={(event) => update("quantity", event.target.value)} placeholder="z. B. 25.000 Stück" />
                  </label>
                  <label className="form-field">
                    <span>Format</span>
                    <input value={request.format} onChange={(event) => update("format", event.target.value)} placeholder="z. B. 59 × 59 × 110 mm" />
                  </label>
                  <label className="form-field">
                    <span>Material</span>
                    <input value={request.material} onChange={(event) => update("material", event.target.value)} placeholder="z. B. GC1 350 g/m²" />
                  </label>
                  <label className="form-field">
                    <span>Wunschtermin</span>
                    <input type="date" value={request.deadline} onChange={(event) => update("deadline", event.target.value)} />
                  </label>
                  <label className="form-field">
                    <span>Einzelpreis</span>
                    <input value={request.unitPrice} onChange={(event) => update("unitPrice", event.target.value)} placeholder="Optional" />
                  </label>
                  <label className="form-field">
                    <span>Gesamtpreis</span>
                    <input value={request.totalPrice} onChange={(event) => update("totalPrice", event.target.value)} placeholder="Optional" />
                  </label>
                  <label className="form-field wide">
                    <span>Lieferadresse</span>
                    <textarea rows="3" value={request.deliveryAddress} onChange={(event) => update("deliveryAddress", event.target.value)} placeholder="Wird aus der Bestellung übernommen" />
                  </label>
                  <label className="form-field">
                    <span>Lieferbedingung</span>
                    <input value={request.deliveryTerms} onChange={(event) => update("deliveryTerms", event.target.value)} placeholder="Optional" />
                  </label>
                  <label className="form-field">
                    <span>Zahlungsbedingung</span>
                    <input value={request.paymentTerms} onChange={(event) => update("paymentTerms", event.target.value)} placeholder="Optional" />
                  </label>
                  <label className="form-field wide">
                    <span>Besondere Bestellhinweise</span>
                    <textarea rows="3" value={request.specialInstructions} onChange={(event) => update("specialInstructions", event.target.value)} placeholder="Muster, Anlieferung, Kennzeichnung oder weitere Vorgaben" />
                  </label>
                  <label className="form-field wide">
                    <span>Beschreibung und Besonderheiten</span>
                    <textarea rows="6" value={request.description} onChange={(event) => update("description", event.target.value)} placeholder="Was soll entstehen und was ist Ihnen dabei wichtig?" />
                  </label>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="form-step">
                <h2>Dokument zuordnen und Projekt übergeben</h2>
                <p>Wählen Sie aus, um welche Dokumentart es sich handelt. Das Dokument erscheint anschließend direkt im Projekt.</p>
                <label className="form-field">
                  <span>Dokumentart</span>
                  <select value={request.documentType} onChange={(event) => update("documentType", event.target.value)}>
                    {documentTypes.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <button className="upload-zone" type="button" onClick={() => fileRef.current?.click()}>
                  <Icon name="upload" size={34} />
                  <strong>{file?.name || "PDF, Druckdaten oder weitere Datei auswählen"}</strong>
                  <small>{file ? `${formatBytes(file.size)} · wird als ${request.documentType} hochgeladen` : "Optional · bis 20 MB"}</small>
                </button>
                <input ref={fileRef} className="sr-only" type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
                <div className="handover-card">
                  <div className="avatar large">DK</div>
                  <div>
                    <span>Direkte Übergabe</span>
                    <h3>an Ihr druckkultur-Team</h3>
                    <p>Das Projekt öffnet sich nach dem Absenden sofort. Status, Dokumente und Zuständigkeiten können anschließend weiterbearbeitet werden.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="form-navigation">
              {step > 1 ? <button type="button" className="ghost-button" onClick={() => setStep((current) => current - 1)}>Zurück</button> : <span />}
              <button className="primary-button" type="submit" disabled={step === 1 && !request.kind && !analysisFile}>
                {step < 3 ? "Weiter" : "Projekt anlegen"} <Icon name="arrow" size={19} />
              </button>
            </div>
          </form>
        </section>

        <aside className="request-aside">
          <div className="aside-quote">
            <span className="quote-mark">„</span>
            <p>Eine Bestellung soll nicht abgeschrieben werden müssen. Das Portal übernimmt die Vorarbeit – die persönliche Prüfung bleibt bei uns.</p>
            <strong>Ihr druckkultur-Team</strong>
          </div>
          <div className="security-note">
            <Icon name="shield" size={23} />
            <div>
              <strong>KI nur als Unterstützung</strong>
              <span>Erkannte Angaben werden nie ungeprüft verbindlich übernommen. Ein Mitarbeiter kontrolliert die Bestellung und klärt offene Punkte persönlich.</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
function TeamView({ company, users, currentUser, onMessage, onCallback }) {
  const internalTeam = company.assignedTeam.map((id) => getUser(users, id)).filter(Boolean);
  const customerTeam = users.filter((user) => user.type === "customer" && !user.deleted && user.companyId === company.id);
  const people = currentUser.type === "customer" ? internalTeam : customerTeam;
  return <div className="page-stack"><PageHeader eyebrow="Klare Zuständigkeiten" title={currentUser.type === "customer" ? "Ihre Ansprechpartner" : `Kontakte bei ${company.shortName}`} lead="Nachrichten öffnen eine echte direkte Unterhaltung. Rückrufwünsche erscheinen beim zuständigen Mitarbeiter sofort und bleiben in seiner Rückrufzentrale sichtbar." /><section className="team-grid expanded-team">{people.map((person) => <article className="team-card" key={person.id}><div className="team-card-header"><div className="avatar xlarge">{person.initials}</div><span className={classNames("availability-label", person.type === "internal" ? (availabilityOptions[person.availabilityStatus || "available"]?.tone || "offline") : "contact")}><i />{person.type === "internal" ? (availabilityOptions[person.availabilityStatus || "available"]?.label || "Offline") : "Kundenkontakt"}</span></div><span className="team-role">{person.roleLabel}</span><h2>{person.name}</h2><p>{person.email}<br />{person.phone}</p><div className="team-actions"><button className="primary-button compact" onClick={() => onMessage(person.id)}><Icon name="message" size={18} /> Nachricht</button>{currentUser.type === "customer" ? <button className="secondary-button compact" onClick={() => onCallback(person.id)}><Icon name="phone" size={18} /> Rückruf wünschen</button> : <a className="secondary-button compact" href={telHref(person.phone)}><Icon name="phone" size={18} /> Direkt anrufen</a>}</div></article>)}</section>{currentUser.type === "internal" && <section className="panel contact-rights"><PanelHeader title="Kundenzugänge" subtitle="Sicht und Freigaberechte je Mitarbeiter" /><div className="people-list">{customerTeam.map((person) => <article key={person.id}><span className="avatar">{person.initials}</span><div><strong>{person.name}</strong><span>{person.roleLabel} · {person.phone}</span></div><div className="rights-summary"><span>{person.rights.viewAllProjects ? "Alle Projekte" : "Nur zugewiesene Projekte"}</span><span>{person.rights.approve ? "Freigabe erlaubt" : "Keine Freigabe"}</span></div></article>)}</div></section>}</div>;
}


function CallbackRequestModal({ target, currentUser, onClose, onSubmit }) {
  const [subject, setSubject] = useState("");
  const [preferredTime, setPreferredTime] = useState("Möglichst bald");
  const hasPhone = Boolean(currentUser.phone?.trim());
  const teamsAccount = currentUser.teamsAccount || currentUser.email;
  const [contactMethod, setContactMethod] = useState(hasPhone ? "phone" : "teams");

  return (
    <div className="modal-layer">
      <button className="modal-backdrop" onClick={onClose} />
      <section className="callback-request-modal" role="dialog" aria-modal="true">
        <header>
          <div><span className="eyebrow">Gespräch anfordern</span><h2>{target?.name}</h2></div>
          <button className="icon-button" onClick={onClose}><Icon name="close" /></button>
        </header>

        <div className="contact-method-grid">
          <button disabled={!hasPhone} className={contactMethod === "phone" ? "active" : ""} onClick={() => setContactMethod("phone")}>
            <Icon name="phone" size={23} />
            <span><strong>Telefonischer Rückruf</strong><small>{hasPhone ? currentUser.phone : "Keine Telefonnummer hinterlegt"}</small></span>
          </button>
          <button className={contactMethod === "teams" ? "active" : ""} onClick={() => setContactMethod("teams")}>
            <Icon name="users" size={23} />
            <span><strong>Microsoft Teams</strong><small>{teamsAccount}</small></span>
          </button>
        </div>

        <label className="form-field">
          <span>Worum geht es?</span>
          <textarea rows="4" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="z. B. kurze Abstimmung zur Freigabeversion" />
        </label>
        <label className="form-field">
          <span>Gewünschter Zeitpunkt</span>
          <select value={preferredTime} onChange={(event) => setPreferredTime(event.target.value)}>
            <option>Möglichst bald</option>
            <option>Heute Vormittag</option>
            <option>Heute Nachmittag</option>
            <option>Morgen Vormittag</option>
          </select>
        </label>
        <button className="primary-button wide-button" onClick={() => onSubmit({ subject, preferredTime, contactMethod })}>
          {contactMethod === "teams" ? "Teams-Gespräch anfordern" : "Rückrufwunsch senden"}
          <Icon name={contactMethod === "teams" ? "users" : "phone"} size={18} />
        </button>
      </section>
    </div>
  );
}

function CallbackPopup({ entry, requester, company, onLater, onComplete }) {
  const isTeams = entry.contactMethod === "teams";
  const contact = entry.contactValue || (isTeams ? entry.teamsAccount : entry.phone);
  return (
    <aside className="callback-popup" role="alert">
      <div className="callback-popup-icon"><Icon name={isTeams ? "users" : "phone"} size={28} /></div>
      <div className="callback-popup-content">
        <span className="eyebrow">Neue Gesprächsanfrage · {company?.shortName}</span>
        <h2>{requester?.name} möchte {isTeams ? "über Teams sprechen" : "zurückgerufen werden"}</h2>
        <p>{entry.subject}</p>
        <dl>
          <div><dt>Kontaktweg</dt><dd>{isTeams ? "Microsoft Teams" : "Telefon"}</dd></div>
          <div><dt>Kontakt</dt><dd>{contact}</dd></div>
          <div><dt>Zeitwunsch</dt><dd>{entry.preferredTime}</dd></div>
        </dl>
        <div className="callback-popup-actions">
          <a className="primary-button" href={isTeams ? teamsHref(contact) : telHref(contact)}>
            <Icon name={isTeams ? "users" : "phone"} size={19} /> {isTeams ? "Teams öffnen" : "Jetzt anrufen"}
          </a>
          <button className="secondary-button" onClick={onComplete}>Erledigt</button>
          <button className="ghost-button" onClick={onLater}>Später</button>
        </div>
        <small>{isTeams ? "Teams wird mit dem hinterlegten Kundenkonto geöffnet." : "Der Anruf wird an die am PC eingerichtete Telefonie-Anwendung übergeben."}</small>
      </div>
    </aside>
  );
}

function CallbacksView({ callbacks, users, companies, onComplete, onOpenCompany }) {
  const [filter, setFilter] = useState("pending");
  const filtered = callbacks.filter((entry) => filter === "all" || entry.status === filter);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Persönliche Reaktion statt Warteschleife"
        title="Gesprächszentrale"
        lead="Telefonische Rückrufe und Teams-Gespräche erscheinen mit Firma, Kontaktweg, Anlass und gewünschtem Zeitpunkt."
      />
      <div className="filter-tabs callback-filters">
        <button className={filter === "pending" ? "active" : ""} onClick={() => setFilter("pending")}>Offen</button>
        <button className={filter === "completed" ? "active" : ""} onClick={() => setFilter("completed")}>Erledigt</button>
        <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>Alle</button>
      </div>
      <section className="callback-list">
        {filtered.map((entry) => {
          const requester = getUser(users, entry.requesterUserId);
          const company = getCompany(companies, entry.companyId);
          const isTeams = entry.contactMethod === "teams";
          const contact = entry.contactValue || (isTeams ? entry.teamsAccount : entry.phone);
          return (
            <article className={classNames("callback-card", entry.status)} key={entry.id}>
              <div className="callback-card-icon"><Icon name={isTeams ? "users" : "phone"} size={25} /></div>
              <div className="callback-card-main">
                <span>{company?.name} · {entry.requestedAt}</span>
                <h2>{requester?.name}</h2>
                <p>{entry.subject}</p>
                <div className="callback-meta"><strong>{isTeams ? "Microsoft Teams" : contact}</strong><span>{entry.preferredTime}</span></div>
              </div>
              <div className="callback-card-actions">
                <button className="ghost-button" onClick={() => onOpenCompany(entry.companyId)}>Firma öffnen</button>
                <a className="primary-button" href={isTeams ? teamsHref(contact) : telHref(contact)}>
                  <Icon name={isTeams ? "users" : "phone"} size={18} /> {isTeams ? "Teams öffnen" : "Anrufen"}
                </a>
                {entry.status === "pending" && <button className="secondary-button" onClick={() => onComplete(entry.id)}>Erledigt</button>}
              </div>
            </article>
          );
        })}
      </section>
      {!filtered.length && <EmptyState title="Keine Gesprächsanfragen" text="Für diese Auswahl gibt es keine offenen Vorgänge." />}
    </div>
  );
}
function CompanySettingsView({ company, users, currentUser, onUpdateCompany, onUpdateUser, onInvite, onDeleteUser }) {
  const [draft, setDraft] = useState({ name: company.name, primaryColor: company.primaryColor, accentColor: company.accentColor, logoData: company.logoData });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState({ name: "", email: "", phone: "", teamsAccount: "", roleLabel: "" });
  const [logoMessage, setLogoMessage] = useState("");
  const canManageUsers = currentUser.type === "internal" ? Boolean(currentUser.rights.manageCompanies) : Boolean(currentUser.rights.manageUsers);
  const rights = [
    ["viewAllProjects", "Alle Firmenprojekte sehen"],
    ["approve", "Druckdaten freigeben"],
    ["viewFinancials", "Angebote und Rechnungen sehen"],
    ["createRequests", "Neue Projekte anfragen"],
    ["manageCompany", "Firmendarstellung verwalten"],
    ["manageUsers", "Benutzer und Rechte verwalten"]
  ];

  useEffect(() => {
    setDraft({ name: company.name, primaryColor: company.primaryColor, accentColor: company.accentColor, logoData: company.logoData });
    setLogoMessage("");
  }, [company.id, company.name, company.primaryColor, company.accentColor, company.logoData]);

  async function readLogo(file) {
    if (!file) return;
    setLogoMessage("Logo wird optimiert …");
    try {
      const logoData = await optimizeLogoFile(file);
      setDraft((current) => ({ ...current, logoData }));
      setLogoMessage(`„${file.name}“ wurde für das Portal optimiert. Bitte noch speichern.`);
    } catch (error) {
      setLogoMessage(error.message || "Das Logo konnte nicht verarbeitet werden.");
    }
  }

  function submitInvite(event) {
    event.preventDefault();
    if (!onInvite(company.id, invite)) return;
    setInvite({ name: "", email: "", phone: "", teamsAccount: "", roleLabel: "" });
    setInviteOpen(false);
  }

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Mandant und Rollen" title="Firmeneinstellungen" lead={`Logo, Farbwelt, Telefonnummern, Teams-Konten und Zugriffsrechte werden für ${company.name} zentral gesteuert.`} />

      <section className="settings-grid">
        <div className="panel settings-panel">
          <div className="settings-heading">
            <div><h2>Darstellung der Firma</h2><p>Firmenname und Logo werden nach dem Speichern auch im Firmenwechsel und in allen Übersichten aktualisiert.</p></div>
            <CompanyLogo company={{ ...company, ...draft }} />
          </div>
          <div className="form-grid">
            <label className="form-field wide">
              <span>Firmenname</span>
              <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
            </label>
            <label className="form-field">
              <span>Hauptfarbe</span>
              <div className="color-field"><input type="color" value={draft.primaryColor} onChange={(event) => setDraft((current) => ({ ...current, primaryColor: event.target.value }))} /><input value={draft.primaryColor} onChange={(event) => setDraft((current) => ({ ...current, primaryColor: event.target.value }))} /></div>
            </label>
            <label className="form-field">
              <span>Akzentfarbe</span>
              <div className="color-field"><input type="color" value={draft.accentColor} onChange={(event) => setDraft((current) => ({ ...current, accentColor: event.target.value }))} /><input value={draft.accentColor} onChange={(event) => setDraft((current) => ({ ...current, accentColor: event.target.value }))} /></div>
            </label>
            <label className="form-field wide">
              <span>Kundenlogo</span>
              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => readLogo(event.target.files?.[0])} />
              <small className="field-help">PNG, JPG, WebP oder SVG bis 5 MB; wird automatisch verkleinert.</small>
              {logoMessage && <small className="field-feedback">{logoMessage}</small>}
            </label>
          </div>
          <div className="settings-actions">
            <button className="ghost-button" onClick={() => { setDraft((current) => ({ ...current, logoData: "" })); setLogoMessage("Logo wird beim Speichern entfernt."); }}>Logo entfernen</button>
            <button className="primary-button" onClick={() => { onUpdateCompany(company.id, draft); setLogoMessage("Firmenangaben wurden gespeichert."); }}>Darstellung speichern</button>
          </div>
        </div>

        <div className="panel branding-preview" style={{ "--preview-primary": draft.primaryColor, "--preview-accent": draft.accentColor }}>
          <span className="eyebrow">Vorschau</span>
          <div className="preview-header"><CompanyLogo company={{ ...company, ...draft }} /><div><small>Ihre externe Druckabteilung</small><strong>{draft.name}</strong></div></div>
          <div className="preview-project"><span>DK-260XXX</span><h3>Ihr Projekt auf einen Blick</h3><p>Nächster Schritt, Ansprechpartner und Termin sind sofort sichtbar.</p><button>Projekt öffnen</button></div>
        </div>
      </section>

      <section className="panel user-settings-panel">
        <div className="settings-heading">
          <div><h2>Benutzer, Kontaktdaten und Rechte</h2><p>Änderungen werden erst mit „Benutzer speichern“ übernommen. Benutzer können gelöscht werden, ohne den bisherigen Projektverlauf zu verlieren.</p></div>
          {canManageUsers && <button className="secondary-button" onClick={() => setInviteOpen((value) => !value)}><Icon name="plus" size={18} /> Benutzer hinzufügen</button>}
        </div>

        {inviteOpen && (
          <form className="invite-form" onSubmit={submitInvite}>
            <label className="form-field"><span>Name</span><input required value={invite.name} onChange={(event) => setInvite((current) => ({ ...current, name: event.target.value }))} /></label>
            <label className="form-field"><span>E-Mail</span><input required type="email" value={invite.email} onChange={(event) => setInvite((current) => ({ ...current, email: event.target.value }))} /></label>
            <label className="form-field"><span>Telefon (optional)</span><input value={invite.phone} onChange={(event) => setInvite((current) => ({ ...current, phone: event.target.value }))} /></label>
            <label className="form-field"><span>Teams-Konto</span><input type="email" value={invite.teamsAccount} onChange={(event) => setInvite((current) => ({ ...current, teamsAccount: event.target.value }))} placeholder="meist die geschäftliche E-Mail" /></label>
            <label className="form-field"><span>Funktion</span><input value={invite.roleLabel} onChange={(event) => setInvite((current) => ({ ...current, roleLabel: event.target.value }))} /></label>
            <button className="primary-button" type="submit">Benutzer anlegen</button>
          </form>
        )}

        <div className="user-rights-list">
          {users.map((person) => (
            <UserSettingsCard
              key={person.id}
              person={person}
              currentUser={currentUser}
              canManageUsers={canManageUsers}
              rights={rights}
              onUpdateUser={onUpdateUser}
              onDeleteUser={onDeleteUser}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function UserSettingsCard({ person, currentUser, canManageUsers, rights, onUpdateUser, onDeleteUser }) {
  const makeDraft = (user) => ({
    name: user.name || "",
    roleLabel: user.roleLabel || "",
    email: user.email || "",
    phone: user.phone || "",
    teamsAccount: user.teamsAccount || user.email || "",
    rights: { ...user.rights }
  });
  const [draft, setDraft] = useState(() => makeDraft(person));
  const [error, setError] = useState("");

  useEffect(() => { setDraft(makeDraft(person)); setError(""); }, [person]);

  function updateField(key, value) { setDraft((current) => ({ ...current, [key]: value })); }
  function updateRight(key, value) { setDraft((current) => ({ ...current, rights: { ...current.rights, [key]: value } })); }
  function save() {
    if (!draft.name.trim()) return setError("Bitte einen Namen eintragen.");
    if (!draft.email.trim() || !draft.email.includes("@")) return setError("Bitte eine gültige E-Mail-Adresse eintragen.");
    const saved = onUpdateUser(person.id, {
      name: draft.name.trim(),
      roleLabel: draft.roleLabel.trim() || "Mitarbeiter/in",
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      teamsAccount: draft.teamsAccount.trim() || draft.email.trim(),
      rights: draft.rights
    });
    if (saved !== false) setError("");
  }

  return (
    <article>
      <header>
        <span className="avatar">{person.initials}</span>
        <div><h3>{person.name}</h3><p>{person.roleLabel} · {person.email}</p></div>
        <div className="user-card-actions">
          <span className={classNames("access-label", draft.rights.viewAllProjects && "full")}>{draft.rights.viewAllProjects ? "Firmensicht" : "Eigene Projekte"}</span>
          {canManageUsers && <button type="button" className="delete-user-button" disabled={person.id === currentUser.id} onClick={() => onDeleteUser(person.id)} title={person.id === currentUser.id ? "Aktuell angemeldeten Benutzer nicht löschen" : `${person.name} löschen`}><Icon name="trash" size={18} /><span>Löschen</span></button>}
        </div>
      </header>

      <div className="user-contact-row user-basic-row">
        <label className="form-field"><span>Name</span><input value={draft.name} disabled={!canManageUsers} onChange={(event) => updateField("name", event.target.value)} /></label>
        <label className="form-field"><span>Funktion</span><input value={draft.roleLabel} disabled={!canManageUsers} onChange={(event) => updateField("roleLabel", event.target.value)} /></label>
        <label className="form-field"><span>E-Mail / Login</span><input type="email" value={draft.email} disabled={!canManageUsers} onChange={(event) => updateField("email", event.target.value)} /></label>
      </div>
      <div className="user-contact-row">
        <label className="form-field"><span>Telefonnummer für Rückrufe</span><input value={draft.phone} disabled={!canManageUsers} onChange={(event) => updateField("phone", event.target.value)} /></label>
        <label className="form-field"><span>Microsoft-Teams-Konto</span><input value={draft.teamsAccount} disabled={!canManageUsers} onChange={(event) => updateField("teamsAccount", event.target.value)} /></label>
      </div>
      <div className="rights-grid">
        {rights.map(([key, label]) => (
          <label key={key} className="right-toggle">
            <span><strong>{label}</strong></span>
            <input type="checkbox" checked={Boolean(draft.rights[key])} disabled={!canManageUsers || (person.id === currentUser.id && key === "manageUsers")} onChange={(event) => updateRight(key, event.target.checked)} />
            <i />
          </label>
        ))}
      </div>
      {error && <p className="form-error user-save-error">{error}</p>}
      {canManageUsers && <div className="user-save-row"><button type="button" className="secondary-button" onClick={() => { setDraft(makeDraft(person)); setError(""); }}>Änderungen verwerfen</button><button type="button" className="primary-button" onClick={save}>Benutzer speichern</button></div>}
    </article>
  );
}

function ProjectTable({ projects, onOpen }) { return <div className="project-table-wrap"><table className="project-table"><thead><tr><th>Projekt</th><th>Status</th><th>Fortschritt</th><th>Lieferung</th><th></th></tr></thead><tbody>{projects.map((project) => <tr key={project.id}><td><button className="table-project" onClick={() => onOpen(project.id)}><strong>{project.title}</strong><span>{project.id} · {project.category}</span></button></td><td><span className={classNames("status-badge", project.statusTone)}>{project.status}</span></td><td><div className="table-progress"><i><b style={{ width: `${project.progress}%` }} /></i><span>{project.progress}%</span></div></td><td>{project.delivery}</td><td><button className="table-open" onClick={() => onOpen(project.id)}>Öffnen <Icon name="arrow" size={16} /></button></td></tr>)}</tbody></table></div>; }
function PageHeader({ eyebrow, title, lead }) { return <section className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="lead">{lead}</p></div></section>; }
function PanelHeader({ title, subtitle, action = null, onAction = null }) { return <header className="panel-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action && <button onClick={onAction}>{action}<Icon name="arrow" size={17} /></button>}</header>; }
function EmptyState({ title, text }) { return <div className="empty-state"><span><Icon name="check" /></span><strong>{title}</strong><p>{text}</p></div>; }
