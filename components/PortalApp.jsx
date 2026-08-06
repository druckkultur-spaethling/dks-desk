"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Icon from "./Icon";
import {
  initialCompanies,
  initialDocuments,
  initialMessages,
  initialProjects,
  initialUsers
} from "@/data/mock-data";

const STORAGE_KEY = "druckkultur-desk-demo-v2";

const baseNav = [
  { id: "dashboard", label: "Übersicht", icon: "home" },
  { id: "projects", label: "Projekte", icon: "projects" },
  { id: "messages", label: "Nachrichten", icon: "message" },
  { id: "documents", label: "Dokumente", icon: "document" },
  { id: "request", label: "Neues Projekt", icon: "plus" },
  { id: "team", label: "Ansprechpartner", icon: "users" }
];

const emptyRequest = {
  kind: "",
  title: "",
  description: "",
  quantity: "",
  deadline: "",
  fileName: ""
};

function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

function formatToday() {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long"
  }).format(new Date());
}

function getUser(users, id) {
  return users.find((user) => user.id === id);
}

function getCompany(companies, id) {
  return companies.find((company) => company.id === id);
}

function canSeeProject(user, project) {
  if (!user) return false;
  if (user.type === "internal") return user.companyIds.includes(project.companyId);
  if (user.companyId !== project.companyId) return false;
  return Boolean(user.rights.viewAllProjects || project.ownerUserIds.includes(user.id));
}

function receiptText(message, users, currentUser) {
  if (message.senderUserId !== currentUser.id) return "";
  const readers = message.readBy
    .filter((id) => id !== currentUser.id)
    .map((id) => getUser(users, id)?.name)
    .filter(Boolean);

  if (!readers.length) return "Zugestellt";
  if (readers.length === 1) return `Gelesen von ${readers[0]}`;
  return `Gelesen von ${readers.slice(0, 2).join(" und ")}${readers.length > 2 ? ` +${readers.length - 2}` : ""}`;
}

export default function PortalApp() {
  const [companies, setCompanies] = useState(initialCompanies);
  const [users, setUsers] = useState(initialUsers);
  const [projects, setProjects] = useState(initialProjects);
  const [messages, setMessages] = useState(initialMessages);
  const [documents] = useState(initialDocuments);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [notice, setNotice] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.companies)) setCompanies(parsed.companies);
        if (Array.isArray(parsed.users)) setUsers(parsed.users);
        if (Array.isArray(parsed.projects)) setProjects(parsed.projects);
        if (Array.isArray(parsed.messages)) setMessages(parsed.messages);
        if (typeof parsed.currentUserId === "string") setCurrentUserId(parsed.currentUserId);
        if (typeof parsed.selectedCompanyId === "string") setSelectedCompanyId(parsed.selectedCompanyId);
      }
    } catch (error) {
      console.warn("Lokaler Demo-Stand konnte nicht geladen werden.", error);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      companies,
      users,
      projects,
      messages,
      currentUserId,
      selectedCompanyId
    }));
  }, [hydrated, companies, users, projects, messages, currentUserId, selectedCompanyId]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 4200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setSelectedProjectId(null);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const currentUser = getUser(users, currentUserId);

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.type === "customer") {
      setSelectedCompanyId(currentUser.companyId);
      return;
    }
    if (!selectedCompanyId || !currentUser.companyIds.includes(selectedCompanyId)) {
      setSelectedCompanyId(currentUser.companyIds[0] || null);
    }
  }, [currentUser, selectedCompanyId]);

  const accessibleCompanies = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.type === "internal") {
      return companies.filter((company) => currentUser.companyIds.includes(company.id));
    }
    return companies.filter((company) => company.id === currentUser.companyId);
  }, [companies, currentUser]);

  const currentCompany = getCompany(companies, selectedCompanyId) || accessibleCompanies[0] || null;

  const visibleProjects = useMemo(() => {
    if (!currentUser || !currentCompany) return [];
    const query = searchTerm.trim().toLocaleLowerCase("de");
    return projects.filter((project) => {
      if (project.companyId !== currentCompany.id || !canSeeProject(currentUser, project)) return false;
      if (!query) return true;
      return [project.id, project.title, project.category, project.status]
        .join(" ")
        .toLocaleLowerCase("de")
        .includes(query);
    });
  }, [projects, currentCompany, currentUser, searchTerm]);

  const visibleProjectIds = useMemo(() => new Set(visibleProjects.map((project) => project.id)), [visibleProjects]);

  const visibleDocuments = useMemo(() => documents.filter((document) => {
    if (!visibleProjectIds.has(document.projectId)) return false;
    if (document.financial && currentUser?.type === "customer" && !currentUser.rights.viewFinancials) return false;
    return true;
  }), [documents, visibleProjectIds, currentUser]);

  const visibleMessages = useMemo(() => messages.filter((message) => visibleProjectIds.has(message.projectId)), [messages, visibleProjectIds]);

  const unreadByCompany = useMemo(() => {
    const result = {};
    if (!currentUser) return result;
    accessibleCompanies.forEach((company) => {
      const accessibleProjectIds = new Set(projects
        .filter((project) => project.companyId === company.id && canSeeProject(currentUser, project))
        .map((project) => project.id));
      result[company.id] = messages.filter((message) =>
        accessibleProjectIds.has(message.projectId)
        && message.senderUserId !== currentUser.id
        && !message.readBy.includes(currentUser.id)
      ).length;
    });
    return result;
  }, [accessibleCompanies, projects, messages, currentUser]);

  const totalUnread = Object.values(unreadByCompany).reduce((sum, count) => sum + count, 0);
  const selectedProject = projects.find((project) => project.id === selectedProjectId && canSeeProject(currentUser, project)) || null;

  function login(email, password) {
    const normalized = email.trim().toLocaleLowerCase("de");
    const user = users.find((entry) => entry.email.toLocaleLowerCase("de") === normalized && entry.password === password);
    if (!user) return false;
    setCurrentUserId(user.id);
    setSelectedCompanyId(user.type === "customer" ? user.companyId : user.companyIds[0]);
    setActiveView("dashboard");
    setSearchTerm("");
    return true;
  }

  function logout() {
    setCurrentUserId(null);
    setSelectedCompanyId(null);
    setSelectedProjectId(null);
    setActiveView("dashboard");
    setSearchTerm("");
  }

  function navigate(view) {
    setActiveView(view);
    setMobileMenuOpen(false);
    window.requestAnimationFrame(() => document.getElementById("main-content")?.focus());
  }

  function switchCompany(companyId) {
    setSelectedCompanyId(companyId);
    setSelectedProjectId(null);
    setSearchTerm("");
    setActiveView("dashboard");
    setMobileMenuOpen(false);
  }

  const markProjectMessagesRead = useCallback((projectId) => {
    if (!currentUser) return;
    setMessages((current) => {
      let changed = false;
      const next = current.map((message) => {
        if (message.projectId !== projectId || message.senderUserId === currentUser.id || message.readBy.includes(currentUser.id)) return message;
        changed = true;
        return { ...message, readBy: [...message.readBy, currentUser.id] };
      });
      return changed ? next : current;
    });
  }, [currentUser]);

  function approveProject(projectId) {
    if (!currentUser?.rights.approve) {
      setNotice("Für Freigaben fehlt diesem Benutzer die Berechtigung.");
      return;
    }
    setProjects((current) => current.map((project) => {
      if (project.id !== projectId) return project;
      return {
        ...project,
        status: "Für Produktion freigegeben",
        statusTone: "success",
        progress: Math.max(project.progress, 60),
        nextAction: "Keine Aktion erforderlich",
        nextActionDetail: `Freigegeben durch ${currentUser.name}. Das druckkultur-Team übernimmt die Produktion.`,
        due: "–",
        updated: "gerade eben",
        steps: project.steps.map((step) => {
          if (step.label === "Freigabe") return { ...step, state: "done", date: "heute" };
          if (step.label === "Produktion") return { ...step, state: "current", date: "heute" };
          return step;
        })
      };
    }));
    const project = projects.find((item) => item.id === projectId);
    setMessages((current) => [...current, {
      id: Date.now(),
      companyId: project.companyId,
      projectId,
      senderUserId: currentUser.id,
      text: `Die aktuelle Version wurde von ${currentUser.name} verbindlich für die Produktion freigegeben.`,
      time: "Gerade eben",
      createdAt: new Date().toISOString(),
      readBy: [currentUser.id]
    }]);
    setNotice("Freigabe gespeichert und nachvollziehbar protokolliert.");
  }

  function addMessage(projectId, text) {
    const cleanText = text.trim();
    if (!cleanText || !currentUser) return;
    const project = projects.find((item) => item.id === projectId);
    if (!project || !canSeeProject(currentUser, project)) return;
    setMessages((current) => [...current, {
      id: Date.now(),
      companyId: project.companyId,
      projectId,
      senderUserId: currentUser.id,
      text: cleanText,
      time: "Gerade eben",
      createdAt: new Date().toISOString(),
      readBy: [currentUser.id]
    }]);
    setNotice(currentUser.type === "customer" ? "Nachricht an Ihr druckkultur-Team gesendet." : "Nachricht an den Kunden gesendet.");
  }

  function createRequest(request) {
    if (!currentUser?.rights.createRequests && currentUser?.type === "customer") {
      setNotice("Dieser Benutzer darf keine neuen Projekte anlegen.");
      return;
    }
    const id = `DK-${String(Date.now()).slice(-6)}`;
    const companyId = currentCompany.id;
    const ownerUserIds = currentUser.type === "customer"
      ? [currentUser.id]
      : users.filter((user) => user.type === "customer" && user.companyId === companyId && user.rights.viewAllProjects).slice(0, 1).map((user) => user.id);
    const newProject = {
      id,
      companyId,
      ownerUserIds,
      title: request.title || "Neue Projektidee",
      category: request.kind || "Beratungsanfrage",
      status: "Anfrage eingegangen",
      statusTone: "info",
      progress: 8,
      nextAction: "Persönliche Prüfung durch druckkultur",
      nextActionDetail: "Die Angaben werden gesichtet. Anschließend meldet sich der zuständige Ansprechpartner.",
      due: "Rückmeldung folgt",
      delivery: request.deadline || "noch offen",
      contactUserId: currentCompany.assignedTeam[0],
      quantity: request.quantity || "noch offen",
      specification: request.description || "Details werden im persönlichen Gespräch geklärt.",
      updated: "gerade eben",
      steps: [
        { label: "Anfrage", state: "current", date: "heute" },
        { label: "Beratung", state: "upcoming", date: "offen" },
        { label: "Angebot", state: "upcoming", date: "offen" },
        { label: "Umsetzung", state: "upcoming", date: "offen" },
        { label: "Lieferung", state: "upcoming", date: "offen" }
      ]
    };
    setProjects((current) => [newProject, ...current]);
    setMessages((current) => [...current, {
      id: Date.now() + 1,
      companyId,
      projectId: id,
      senderUserId: currentUser.id,
      text: `Die Anfrage „${newProject.title}“ wurde angelegt${request.fileName ? `; Datei: ${request.fileName}` : ""}.`,
      time: "Gerade eben",
      createdAt: new Date().toISOString(),
      readBy: [currentUser.id]
    }]);
    setActiveView("projects");
    setSelectedProjectId(id);
    setNotice("Die Projektidee wurde persönlich an das zuständige Team übergeben.");
  }

  function updateCompany(companyId, patch) {
    setCompanies((current) => current.map((company) => company.id === companyId ? { ...company, ...patch } : company));
    setNotice("Firmeneinstellungen gespeichert.");
  }

  function updateUserRights(userId, rightsPatch) {
    setUsers((current) => current.map((user) => user.id === userId
      ? { ...user, rights: { ...user.rights, ...rightsPatch } }
      : user));
    setNotice("Berechtigungen aktualisiert.");
  }

  function inviteUser(companyId, form) {
    const id = `${companyId}-${Date.now()}`;
    setUsers((current) => [...current, {
      id,
      type: "customer",
      companyId,
      name: form.name,
      firstName: form.name.split(" ")[0],
      email: form.email,
      password: "demo",
      roleLabel: form.roleLabel || "Mitarbeiter/in",
      initials: form.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
      rights: {
        viewAllProjects: false,
        manageCompany: false,
        manageUsers: false,
        approve: false,
        viewFinancials: false,
        createRequests: true
      }
    }]);
    setNotice("Demobenutzer angelegt. In der Produktivversion wird eine sichere Einladung versendet.");
  }

  function resetDemo() {
    setCompanies(initialCompanies);
    setUsers(initialUsers);
    setProjects(initialProjects);
    setMessages(initialMessages);
    setCurrentUserId(null);
    setSelectedCompanyId(null);
    setActiveView("dashboard");
    setSelectedProjectId(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  if (!hydrated) return <div className="loading-screen">druckkultur desk wird geladen …</div>;

  if (!currentUser) {
    return <LoginScreen users={users} companies={companies} onLogin={login} />;
  }

  const canManageCompany = currentUser.type === "internal" || currentUser.rights.manageCompany || currentUser.rights.manageUsers;
  const navItems = [
    ...(currentUser.type === "internal" ? [{ id: "companies", label: "Firmenübersicht", icon: "layers" }] : []),
    ...baseNav.filter((item) => item.id !== "request" || currentUser.type === "internal" || currentUser.rights.createRequests),
    ...(canManageCompany ? [{ id: "settings", label: "Firmeneinstellungen", icon: "shield" }] : [])
  ];

  const companyStyle = {
    "--brand": currentCompany?.primaryColor || "#0b7772",
    "--brand-soft": currentCompany?.accentColor || "#9ed0c8"
  };

  return (
    <div className="portal-root" style={companyStyle}>
      <a className="skip-link" href="#main-content">Zum Hauptinhalt</a>

      <Sidebar
        navItems={navItems}
        activeView={activeView}
        currentUser={currentUser}
        currentCompany={currentCompany}
        companies={accessibleCompanies}
        unreadByCompany={unreadByCompany}
        totalUnread={totalUnread}
        mobileOpen={mobileMenuOpen}
        onNavigate={navigate}
        onSwitchCompany={switchCompany}
        onClose={() => setMobileMenuOpen(false)}
        onLogout={logout}
        onReset={resetDemo}
      />

      <div className="app-column">
        <Topbar
          currentUser={currentUser}
          currentCompany={currentCompany}
          searchTerm={searchTerm}
          unreadCount={unreadByCompany[currentCompany?.id] || 0}
          onSearch={setSearchTerm}
          onMenu={() => setMobileMenuOpen(true)}
          onMessages={() => navigate("messages")}
          onLogout={logout}
        />

        <main id="main-content" tabIndex="-1" className="main-content">
          {activeView === "companies" && currentUser.type === "internal" && (
            <CompaniesView
              companies={accessibleCompanies}
              projects={projects}
              unreadByCompany={unreadByCompany}
              users={users}
              onOpen={switchCompany}
            />
          )}
          {activeView === "dashboard" && (
            <DashboardView
              currentUser={currentUser}
              company={currentCompany}
              projects={visibleProjects}
              messages={visibleMessages}
              users={users}
              unreadByCompany={unreadByCompany}
              companies={accessibleCompanies}
              onOpenProject={setSelectedProjectId}
              onNavigate={navigate}
              onApprove={approveProject}
              onSwitchCompany={switchCompany}
            />
          )}
          {activeView === "projects" && (
            <ProjectsView
              projects={visibleProjects}
              users={users}
              searchTerm={searchTerm}
              onSearch={setSearchTerm}
              onOpenProject={setSelectedProjectId}
            />
          )}
          {activeView === "messages" && (
            <MessagesView
              messages={visibleMessages}
              projects={visibleProjects}
              users={users}
              currentUser={currentUser}
              onSend={addMessage}
              onMarkRead={markProjectMessagesRead}
            />
          )}
          {activeView === "documents" && (
            <DocumentsView
              documents={visibleDocuments}
              projects={visibleProjects}
              onNotice={setNotice}
            />
          )}
          {activeView === "request" && (
            <RequestView company={currentCompany} onCreate={createRequest} />
          )}
          {activeView === "team" && (
            <TeamView company={currentCompany} users={users} currentUser={currentUser} onNotice={setNotice} />
          )}
          {activeView === "settings" && canManageCompany && (
            <CompanySettingsView
              company={currentCompany}
              users={users.filter((user) => user.type === "customer" && user.companyId === currentCompany.id)}
              currentUser={currentUser}
              onUpdateCompany={updateCompany}
              onUpdateRights={updateUserRights}
              onInvite={inviteUser}
            />
          )}
        </main>
      </div>

      {selectedProject && (
        <ProjectDrawer
          project={selectedProject}
          users={users}
          currentUser={currentUser}
          messages={messages.filter((message) => message.projectId === selectedProject.id)}
          documents={documents.filter((document) => document.projectId === selectedProject.id && (!document.financial || currentUser.type === "internal" || currentUser.rights.viewFinancials))}
          onClose={() => setSelectedProjectId(null)}
          onApprove={() => approveProject(selectedProject.id)}
          onMessage={(text) => addMessage(selectedProject.id, text)}
          onMarkRead={() => markProjectMessagesRead(selectedProject.id)}
          onDownload={(document) => downloadDemoDocument(document, selectedProject, setNotice)}
        />
      )}

      {notice && <div className="toast" role="status"><Icon name="check" size={18} />{notice}</div>}
    </div>
  );
}

function LoginScreen({ users, companies, onLogin }) {
  const [mode, setMode] = useState("customer");
  const candidates = users.filter((user) => user.type === mode);
  const [email, setEmail] = useState(candidates[0]?.email || "");
  const [password, setPassword] = useState("demo");
  const [error, setError] = useState("");

  useEffect(() => {
    const first = users.find((user) => user.type === mode);
    setEmail(first?.email || "");
    setPassword("demo");
    setError("");
  }, [mode, users]);

  function submit(event) {
    event.preventDefault();
    if (!onLogin(email, password)) {
      setError("E-Mail oder Passwort stimmen nicht. Für die Demo lautet das Passwort „demo“.");
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="login-logo"><Icon name="print" size={36} /><span><strong>druckkultur</strong><small>desk</small></span></div>
        <p className="eyebrow">Ihre externe Druckabteilung</p>
        <h1>Direkter Kontakt. Klare Zuständigkeiten. Alle Printprojekte an einem Ort.</h1>
        <p>Kein Online-Shop, sondern ein gemeinsamer Arbeitsraum für Beratung, Dateien, Freigaben, Dokumente und schnelle Entscheidungen.</p>
        <div className="login-features">
          <span><Icon name="users" size={20} /> Persönliche Ansprechpartner</span>
          <span><Icon name="fileCheck" size={20} /> Nachvollziehbare Freigaben</span>
          <span><Icon name="message" size={20} /> Projektbezogene Kommunikation</span>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-tabs" role="tablist">
            <button className={mode === "customer" ? "active" : ""} onClick={() => setMode("customer")}>Kundenlogin</button>
            <button className={mode === "internal" ? "active" : ""} onClick={() => setMode("internal")}>Mitarbeiterlogin</button>
          </div>
          <div className="login-heading">
            <span className="eyebrow">Geschützter Projektraum</span>
            <h2>{mode === "customer" ? "Bei Ihrer Druckabteilung anmelden" : "Firmen und Projekte betreuen"}</h2>
          </div>
          <form onSubmit={submit}>
            <label className="form-field"><span>E-Mail-Adresse</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required /></label>
            <label className="form-field"><span>Passwort</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button wide-button" type="submit">Anmelden <Icon name="arrow" size={18} /></button>
          </form>
          <div className="demo-accounts">
            <strong>Demo-Zugänge</strong>
            <p>Account auswählen; Passwort ist immer <code>demo</code>.</p>
            <div className="demo-account-list">
              {candidates.slice(0, mode === "customer" ? 6 : 3).map((user) => {
                const company = getCompany(companies, user.companyId);
                return (
                  <button key={user.id} onClick={() => { setEmail(user.email); setPassword("demo"); setError(""); }}>
                    <span className="avatar small">{user.initials}</span>
                    <span><strong>{user.name}</strong><small>{company ? `${company.shortName} · ` : ""}{user.roleLabel}</small></span>
                  </button>
                );
              })}
            </div>
          </div>
          <p className="demo-note"><Icon name="shield" size={16} /> Dies ist eine lokale Funktionsdemo. Eine echte Anmeldung benötigt serverseitige Authentifizierung, Datenbank und sichere Sitzungen.</p>
        </div>
      </section>
    </main>
  );
}

function Sidebar({ navItems, activeView, currentUser, currentCompany, companies, unreadByCompany, totalUnread, mobileOpen, onNavigate, onSwitchCompany, onClose, onLogout, onReset }) {
  return (
    <>
      <button className={classNames("mobile-backdrop", mobileOpen && "visible")} onClick={onClose} aria-label="Menü schließen" />
      <aside className={classNames("sidebar", mobileOpen && "mobile-open")}>
        <div className="brand-lockup"><span className="brand-mark"><Icon name="print" size={25} /></span><span><strong>druckkultur</strong><small>desk</small></span></div>

        <div className="company-identity">
          <CompanyLogo company={currentCompany} />
          <div><span>{currentUser.type === "internal" ? "Aktive Firma" : "Ihr Unternehmen"}</span><strong>{currentCompany?.name}</strong></div>
        </div>

        {currentUser.type === "internal" && (
          <div className="company-switcher">
            <div className="sidebar-label"><span>Firmen wechseln</span>{totalUnread > 0 && <b>{totalUnread} neu</b>}</div>
            <div className="company-switch-list">
              {companies.map((company) => (
                <button key={company.id} className={company.id === currentCompany?.id ? "active" : ""} onClick={() => onSwitchCompany(company.id)}>
                  <CompanyLogo company={company} compact />
                  <span><strong>{company.shortName}</strong><small>{company.customerNumber}</small></span>
                  {(unreadByCompany[company.id] || 0) > 0 && <b className="count-badge">{unreadByCompany[company.id]}</b>}
                </button>
              ))}
            </div>
          </div>
        )}

        <nav className="main-nav" aria-label="Portalnavigation">
          {navItems.map((item) => (
            <button key={item.id} className={activeView === item.id ? "active" : ""} onClick={() => onNavigate(item.id)}>
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
              {item.id === "messages" && (unreadByCompany[currentCompany?.id] || 0) > 0 && <b className="count-badge">{unreadByCompany[currentCompany.id]}</b>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="signed-in-user"><span className="avatar">{currentUser.initials}</span><span><strong>{currentUser.name}</strong><small>{currentUser.roleLabel}</small></span></div>
          <div className="sidebar-footer-actions"><button onClick={onLogout}>Abmelden</button><button onClick={onReset}>Demo zurücksetzen</button></div>
        </div>
      </aside>
    </>
  );
}

function Topbar({ currentUser, currentCompany, searchTerm, unreadCount, onSearch, onMenu, onMessages, onLogout }) {
  return (
    <header className="topbar">
      <button className="icon-button mobile-menu" onClick={onMenu} aria-label="Menü öffnen"><Icon name="menu" /></button>
      <div className="topbar-context"><span>{currentCompany?.shortName}</span><strong>{formatToday()}</strong></div>
      <label className="global-search"><Icon name="search" size={19} /><span className="sr-only">Projekte durchsuchen</span><input value={searchTerm} onChange={(event) => onSearch(event.target.value)} placeholder="Auftrag, Projekt oder Status suchen …" /></label>
      <div className="topbar-actions">
        <button className="notification-button" onClick={onMessages} aria-label={`${unreadCount} ungelesene Nachrichten`}><Icon name="bell" size={21} />{unreadCount > 0 && <b>{unreadCount}</b>}</button>
        <div className="topbar-user"><span className="avatar small">{currentUser.initials}</span><span><strong>{currentUser.firstName}</strong><small>{currentUser.type === "internal" ? "druckkultur" : currentUser.roleLabel}</small></span><button onClick={onLogout} aria-label="Abmelden"><Icon name="external" size={16} /></button></div>
      </div>
    </header>
  );
}

function CompanyLogo({ company, compact = false }) {
  if (company?.logoData) return <span className={classNames("company-logo", compact && "compact")}><img src={company.logoData} alt={`${company.name} Logo`} /></span>;
  return <span className={classNames("company-logo", compact && "compact")}>{company?.initials || "DK"}</span>;
}

function CompaniesView({ companies, projects, unreadByCompany, users, onOpen }) {
  return (
    <div className="page-stack">
      <section className="page-header"><div><p className="eyebrow">Mandantenübersicht</p><h1>Alle betreuten Firmen</h1><p className="lead">Neue Nachrichten, offene Freigaben und laufende Projekte bleiben sichtbar – unabhängig davon, in welcher Firma Sie gerade arbeiten.</p></div></section>
      <section className="company-grid">
        {companies.map((company) => {
          const companyProjects = projects.filter((project) => project.companyId === company.id);
          const open = companyProjects.filter((project) => project.progress < 100).length;
          const attention = companyProjects.filter((project) => project.statusTone === "warning").length;
          const customerUsers = users.filter((user) => user.type === "customer" && user.companyId === company.id).length;
          return (
            <button className="company-card" key={company.id} onClick={() => onOpen(company.id)}>
              <div className="company-card-head"><CompanyLogo company={company} /><div><span>{company.customerNumber}</span><h2>{company.name}</h2><p>{company.industry}</p></div>{unreadByCompany[company.id] > 0 && <b className="new-pill">{unreadByCompany[company.id]} neue Nachrichten</b>}</div>
              <div className="company-metrics"><div><strong>{open}</strong><span>laufende Projekte</span></div><div><strong>{attention}</strong><span>benötigen Aufmerksamkeit</span></div><div><strong>{customerUsers}</strong><span>Kundenzugänge</span></div></div>
              <span className="company-open">Firma öffnen <Icon name="arrow" size={17} /></span>
            </button>
          );
        })}
      </section>
    </div>
  );
}

function DashboardView({ currentUser, company, projects, messages, users, unreadByCompany, companies, onOpenProject, onNavigate, onApprove, onSwitchCompany }) {
  const actionProjects = projects.filter((project) => project.statusTone === "warning" || project.status === "Angebot liegt vor");
  const unread = messages.filter((message) => message.senderUserId !== currentUser.id && !message.readBy.includes(currentUser.id));
  const active = projects.filter((project) => project.progress < 100);

  return (
    <div className="page-stack">
      <section className="dashboard-hero">
        <div><p className="eyebrow">{currentUser.type === "internal" ? `Kundenarbeitsraum · ${company.name}` : "Ihre externe Druckabteilung"}</p><h1>Guten Morgen, {currentUser.firstName}.</h1><p>{currentUser.type === "customer" ? "Hier sehen Sie nur die Projekte und Informationen, für die Sie berechtigt sind." : "Alle offenen Entscheidungen, Nachrichten und Termine dieser Firma auf einen Blick."}</p></div>
        <div className="hero-actions"><button className="primary-button" onClick={() => onNavigate("request")}><Icon name="plus" size={18} /> Projekt anfragen</button><button className="secondary-button" onClick={() => onNavigate("messages")}><Icon name="message" size={18} /> Nachricht senden</button></div>
      </section>

      {currentUser.type === "internal" && (
        <section className="cross-company-strip">
          <div><span className="eyebrow">Firmenübergreifend</span><strong>Was außerhalb von {company.shortName} neu ist</strong></div>
          <div className="cross-company-items">
            {companies.filter((item) => item.id !== company.id).map((item) => (
              <button key={item.id} onClick={() => onSwitchCompany(item.id)}><CompanyLogo company={item} compact /><span><strong>{item.shortName}</strong><small>{unreadByCompany[item.id] || 0} ungelesen</small></span>{unreadByCompany[item.id] > 0 && <b>{unreadByCompany[item.id]}</b>}</button>
            ))}
          </div>
        </section>
      )}

      <section className="metric-grid">
        <article><span className="metric-icon warning"><Icon name="clock" /></span><div><strong>{actionProjects.length}</strong><span>offene Entscheidungen</span></div></article>
        <article><span className="metric-icon info"><Icon name="message" /></span><div><strong>{unread.length}</strong><span>ungelesene Nachrichten</span></div></article>
        <article><span className="metric-icon success"><Icon name="projects" /></span><div><strong>{active.length}</strong><span>laufende Projekte</span></div></article>
        <article><span className="metric-icon"><Icon name="users" /></span><div><strong>{currentUser.rights.viewAllProjects ? "Gesamt" : "Eigene"}</strong><span>Ihre Projektsicht</span></div></article>
      </section>

      <section className="dashboard-grid">
        <div className="panel action-panel">
          <PanelHeader title="Jetzt wichtig" subtitle="Entscheidungen, die den Ablauf beeinflussen" action="Alle Projekte" onAction={() => onNavigate("projects")} />
          <div className="action-list">
            {actionProjects.length ? actionProjects.slice(0, 4).map((project) => (
              <article key={project.id}>
                <button className="action-main" onClick={() => onOpenProject(project.id)}>
                  <span className={classNames("status-dot", project.statusTone)} />
                  <span><small>{project.id} · {project.category}</small><strong>{project.nextAction}</strong><p>{project.title}</p></span>
                  <time>{project.due}</time>
                </button>
                {project.status === "Freigabe erforderlich" && currentUser.rights.approve && <button className="small-action" onClick={() => onApprove(project.id)}>Freigeben</button>}
              </article>
            )) : <EmptyState title="Alles geklärt" text="Aktuell ist keine Entscheidung erforderlich." />}
          </div>
        </div>

        <div className="panel message-preview-panel">
          <PanelHeader title="Neue Nachrichten" subtitle="Direkt aus den Projekten" action="Postfach öffnen" onAction={() => onNavigate("messages")} />
          <div className="message-preview-list">
            {unread.length ? unread.slice(-4).reverse().map((message) => {
              const sender = getUser(users, message.senderUserId);
              const project = projects.find((item) => item.id === message.projectId);
              return <button key={message.id} onClick={() => onOpenProject(message.projectId)}><span className="avatar small">{sender?.initials || "DK"}</span><span><strong>{sender?.name || "Projektteam"}</strong><small>{project?.title}</small><p>{message.text}</p></span><i /></button>;
            }) : <EmptyState title="Alles gelesen" text="Keine neue Nachricht wartet auf Sie." />}
          </div>
        </div>
      </section>

      <section className="panel">
        <PanelHeader title="Laufende Projekte" subtitle={`${projects.length} für Sie sichtbare Projekte bei ${company.shortName}`} action="Projektübersicht" onAction={() => onNavigate("projects")} />
        <div className="project-table-wrap"><table className="project-table"><thead><tr><th>Projekt</th><th>Status</th><th>Fortschritt</th><th>Lieferung</th><th>Aktualisiert</th></tr></thead><tbody>{projects.slice(0, 6).map((project) => <tr key={project.id}><td><button className="table-project" onClick={() => onOpenProject(project.id)}><strong>{project.title}</strong><span>{project.id} · {project.category}</span></button></td><td><span className={classNames("status-badge", project.statusTone)}>{project.status}</span></td><td><div className="table-progress"><i><b style={{ width: `${project.progress}%` }} /></i><span>{project.progress}%</span></div></td><td>{project.delivery}</td><td>{project.updated}</td></tr>)}</tbody></table></div>
      </section>
    </div>
  );
}

function ProjectsView({ projects, users, searchTerm, onSearch, onOpenProject }) {
  const [filter, setFilter] = useState("Alle");
  const filters = ["Alle", "Offen", "Freigabe", "Produktion", "Abgeschlossen"];
  const filtered = projects.filter((project) => {
    if (filter === "Alle") return true;
    if (filter === "Offen") return project.progress < 100;
    if (filter === "Freigabe") return project.status.includes("Freigabe") || project.status.includes("Angebot") || project.status.includes("Rückfrage");
    if (filter === "Produktion") return project.status.includes("Produktion") || project.status.includes("Muster") || project.status.includes("Druckdaten");
    return project.progress === 100;
  });

  return (
    <div className="page-stack">
      <section className="page-header"><div><p className="eyebrow">Auftragsübersicht</p><h1>Projekte</h1><p className="lead">Status, nächste Schritte, zuständige Personen und Entscheidungen in einer gemeinsamen Ansicht.</p></div></section>
      <section className="toolbar"><div className="filter-tabs">{filters.map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div><label className="inline-search"><Icon name="search" size={18} /><input value={searchTerm} onChange={(event) => onSearch(event.target.value)} placeholder="Projekte filtern …" /></label></section>
      <section className="project-card-grid">
        {filtered.map((project) => {
          const owners = project.ownerUserIds.map((id) => getUser(users, id)).filter(Boolean);
          const contact = getUser(users, project.contactUserId);
          return (
            <article className="project-card" key={project.id}>
              <div className="project-card-top"><span className="project-symbol"><Icon name={project.category === "Faltschachtel" || project.category === "Verpackung" ? "layers" : "print"} size={28} /><i className="crop-mark top-left" /><i className="crop-mark bottom-right" /></span><span className={classNames("status-badge", project.statusTone)}>{project.status}</span></div>
              <span className="project-meta">{project.id} · {project.category}</span><h2>{project.title}</h2><p>{project.specification}</p>
              <div className="project-progress"><div><span>Fortschritt</span><strong>{project.progress}%</strong></div><i><b style={{ width: `${project.progress}%` }} /></i></div>
              <dl className="card-details"><div><dt>Nächster Schritt</dt><dd>{project.nextAction}</dd></div><div><dt>Liefertermin</dt><dd>{project.delivery}</dd></div><div><dt>Zugeordnet</dt><dd>{owners.map((owner) => owner.name).join(", ") || "Teamleitung"}</dd></div><div><dt>druckkultur</dt><dd>{contact?.firstName || "Projektteam"}</dd></div></dl>
              <button className="card-link" onClick={() => onOpenProject(project.id)}>Projekt öffnen <Icon name="arrow" size={17} /></button>
            </article>
          );
        })}
      </section>
      {!filtered.length && <EmptyState title="Keine Projekte gefunden" text="Für diese Auswahl gibt es keine sichtbaren Projekte." />}
    </div>
  );
}

function MessagesView({ messages, projects, users, currentUser, onSend, onMarkRead }) {
  const threadProjects = projects.filter((project) => messages.some((message) => message.projectId === project.id));
  const [activeProjectId, setActiveProjectId] = useState(threadProjects[0]?.id || projects[0]?.id || null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!activeProjectId || !projects.some((project) => project.id === activeProjectId)) {
      setActiveProjectId(threadProjects[0]?.id || projects[0]?.id || null);
    }
  }, [activeProjectId, projects, threadProjects]);

  useEffect(() => {
    if (activeProjectId) onMarkRead(activeProjectId);
  }, [activeProjectId, onMarkRead]);

  const activeProject = projects.find((project) => project.id === activeProjectId);
  const thread = messages.filter((message) => message.projectId === activeProjectId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div className="page-stack messages-page">
      <section className="page-header compact-header"><div><p className="eyebrow">Direkter Draht</p><h1>Nachrichten</h1><p className="lead">Jede Unterhaltung bleibt beim richtigen Projekt. Lesestatus und Zuständigkeit sind nachvollziehbar.</p></div></section>
      <section className="messages-layout">
        <aside className="thread-list">
          <header><strong>Projektunterhaltungen</strong><span>{threadProjects.length}</span></header>
          {threadProjects.map((project) => {
            const projectMessages = messages.filter((message) => message.projectId === project.id);
            const last = projectMessages[projectMessages.length - 1];
            const unread = projectMessages.filter((message) => message.senderUserId !== currentUser.id && !message.readBy.includes(currentUser.id)).length;
            return <button key={project.id} className={activeProjectId === project.id ? "active" : ""} onClick={() => setActiveProjectId(project.id)}><span className="thread-icon"><Icon name="projects" size={19} /></span><span><strong>{project.title}</strong><small>{project.id}</small><p>{last?.text || "Noch keine Nachricht"}</p></span>{unread > 0 && <b className="count-badge">{unread}</b>}</button>;
          })}
        </aside>

        <div className="conversation-panel">
          {activeProject ? (
            <>
              <header className="conversation-header"><div><span>{activeProject.id} · {activeProject.category}</span><h2>{activeProject.title}</h2></div><span className={classNames("status-badge", activeProject.statusTone)}>{activeProject.status}</span></header>
              <div className="message-stream">
                {thread.map((message) => {
                  const sender = getUser(users, message.senderUserId);
                  const own = message.senderUserId === currentUser.id;
                  return (
                    <article key={message.id} className={classNames("message-row", own && "own")}>
                      {!own && <span className="avatar small">{sender?.initials || "DK"}</span>}
                      <div className="message-bubble"><div className="message-author"><strong>{own ? "Sie" : sender?.name || "Projektteam"}</strong><time>{message.time}</time></div><p>{message.text}</p>{own && <small className="read-receipt"><Icon name={message.readBy.length > 1 ? "check" : "send"} size={14} />{receiptText(message, users, currentUser)}</small>}</div>
                    </article>
                  );
                })}
                {!thread.length && <EmptyState title="Neue Unterhaltung" text="Schreiben Sie die erste Nachricht zu diesem Projekt." />}
              </div>
              <form className="message-composer" onSubmit={(event) => { event.preventDefault(); onSend(activeProject.id, draft); setDraft(""); }}><textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows="3" placeholder="Nachricht zum Projekt schreiben …" /><div><span>Die Nachricht wird dem Projekt dauerhaft zugeordnet.</span><button className="primary-button" type="submit">Senden <Icon name="send" size={17} /></button></div></form>
            </>
          ) : <EmptyState title="Keine Unterhaltung verfügbar" text="Für Ihre Projektsicht gibt es noch keine Nachrichten." />}
        </div>
      </section>
    </div>
  );
}

function DocumentsView({ documents, projects, onNotice }) {
  const [filter, setFilter] = useState("Alle");
  const types = ["Alle", ...new Set(documents.map((document) => document.type))];
  const filtered = documents.filter((document) => filter === "Alle" || document.type === filter);
  return (
    <div className="page-stack">
      <section className="page-header"><div><p className="eyebrow">Aktuelle Dateien statt E-Mail-Suche</p><h1>Dokumente</h1><p className="lead">Nur Dokumente aus Projekten, für die Sie berechtigt sind. Kaufmännische Unterlagen werden zusätzlich nach Rolle gefiltert.</p></div></section>
      <section className="toolbar"><div className="filter-tabs">{types.map((type) => <button key={type} className={filter === type ? "active" : ""} onClick={() => setFilter(type)}>{type}</button>)}</div></section>
      <section className="document-grid">{filtered.map((document) => { const project = projects.find((item) => item.id === document.projectId); return <article className="document-card" key={document.id}><span className="document-icon"><Icon name={document.type.includes("Freigabe") ? "fileCheck" : "document"} size={25} /></span><div><span>{document.type}</span><h2>{document.title}</h2><p>{project?.title}</p><small>{document.date} · {document.size} {document.version && `· ${document.version}`}</small></div><button className="icon-button" onClick={() => downloadDemoDocument(document, project, onNotice)} aria-label={`${document.title} herunterladen`}><Icon name="download" size={19} /></button></article>; })}</section>
      {!filtered.length && <EmptyState title="Keine Dokumente" text="Für diesen Filter sind keine Dokumente sichtbar." />}
    </div>
  );
}

function RequestView({ company, onCreate }) {
  const [step, setStep] = useState(1);
  const [request, setRequest] = useState(emptyRequest);
  const fileRef = useRef(null);
  const kinds = ["Printprodukt", "Mailing", "Faltschachtel / Verpackung", "Veredelung", "Sonderproduktion", "Noch nicht sicher"];
  function update(key, value) { setRequest((current) => ({ ...current, [key]: value })); }
  function submit(event) { event.preventDefault(); if (step < 3) setStep((current) => current + 1); else { onCreate(request); setRequest(emptyRequest); setStep(1); } }

  return (
    <div className="page-stack">
      <section className="page-header"><div><p className="eyebrow">Kein Warenkorb, keine starre Konfiguration</p><h1>Neues Projekt besprechen</h1><p className="lead">Eine Idee, ein Muster oder eine grobe Beschreibung reicht. {company.name} erhält danach eine persönliche Rückmeldung.</p></div></section>
      <div className="request-layout">
        <section className="panel request-panel">
          <div className="stepper">{[1,2,3].map((item) => <span key={item} className={step >= item ? "active" : ""}><i>{step > item ? <Icon name="check" size={14} /> : item}</i><b>{item === 1 ? "Vorhaben" : item === 2 ? "Details" : "Übergabe"}</b></span>)}</div>
          <form onSubmit={submit}>
            {step === 1 && <div className="form-step"><h2>Was möchten Sie umsetzen?</h2><p>Wählen Sie die Richtung. Die technische Lösung klären wir gemeinsam.</p><div className="kind-grid">{kinds.map((kind) => <button type="button" key={kind} className={request.kind === kind ? "selected" : ""} onClick={() => update("kind", kind)}><Icon name={kind.includes("Verpackung") ? "layers" : "print"} size={23} /><span>{kind}</span>{request.kind === kind && <Icon name="check" size={17} />}</button>)}</div></div>}
            {step === 2 && <div className="form-step"><h2>Was wissen Sie bereits?</h2><p>Ungefähre Angaben genügen.</p><div className="form-grid"><label className="form-field wide"><span>Arbeitstitel</span><input value={request.title} onChange={(event) => update("title", event.target.value)} placeholder="z. B. neue Geschenkverpackung" /></label><label className="form-field wide"><span>Idee und gewünschte Wirkung</span><textarea rows="5" value={request.description} onChange={(event) => update("description", event.target.value)} placeholder="Was soll entstehen und was ist Ihnen dabei wichtig?" /></label><label className="form-field"><span>Ungefähre Menge</span><input value={request.quantity} onChange={(event) => update("quantity", event.target.value)} placeholder="z. B. 5.000 Stück" /></label><label className="form-field"><span>Wunschtermin</span><input type="date" value={request.deadline} onChange={(event) => update("deadline", event.target.value)} /></label></div></div>}
            {step === 3 && <div className="form-step"><h2>Persönlich übergeben</h2><p>Eine Datei ist freiwillig. In dieser Demo wird nur der Dateiname gespeichert.</p><button className="upload-zone" type="button" onClick={() => fileRef.current?.click()}><Icon name="upload" size={29} /><strong>{request.fileName || "Skizze, PDF oder Beispiel auswählen"}</strong><small>{request.fileName ? "Datei für die Anfrage vorgemerkt" : "Die echte Version erhält später einen sicheren Upload"}</small></button><input ref={fileRef} className="sr-only" type="file" onChange={(event) => update("fileName", event.target.files?.[0]?.name || "")} /><div className="handover-card"><div className="avatar large">DK</div><div><span>Persönliche Prüfung</span><h3>durch Ihr druckkultur-Team</h3><p>Keine automatische Preiszusage. Ein zuständiger Mensch prüft Idee, Termin und technische Möglichkeiten.</p></div></div></div>}
            <div className="form-navigation">{step > 1 ? <button type="button" className="ghost-button" onClick={() => setStep((current) => current - 1)}>Zurück</button> : <span />}<button className="primary-button" type="submit" disabled={step === 1 && !request.kind}>{step < 3 ? "Weiter" : "Persönlich übergeben"}<Icon name="arrow" size={17} /></button></div>
          </form>
        </section>
        <aside className="request-aside"><div className="aside-quote"><span className="quote-mark">„</span><p>Sie müssen noch nicht wissen, wie es technisch umgesetzt wird. Genau dafür sind wir da.</p><strong>Ihr druckkultur-Team</strong></div><div className="security-note"><Icon name="shield" size={21} /><div><strong>Rechte werden berücksichtigt</strong><span>Das neue Projekt wird Ihrem Benutzer zugeordnet und ist für Teamleiter entsprechend der Firmeneinstellungen sichtbar.</span></div></div></aside>
      </div>
    </div>
  );
}

function TeamView({ company, users, currentUser, onNotice }) {
  const internalTeam = company.assignedTeam.map((id) => getUser(users, id)).filter(Boolean);
  const customerTeam = users.filter((user) => user.type === "customer" && user.companyId === company.id);
  return (
    <div className="page-stack">
      <section className="page-header"><div><p className="eyebrow">Klare Zuständigkeiten</p><h1>{currentUser.type === "customer" ? "Ihre Ansprechpartner" : `Team bei ${company.shortName}`}</h1><p className="lead">Direkte Kontakte auf beiden Seiten und eine sichtbare Vertretung statt anonymer Tickets.</p></div></section>
      <section className="team-section"><div className="section-title"><h2>druckkultur-Team</h2><span>{internalTeam.length} zugeordnet</span></div><div className="team-grid">{internalTeam.map((person) => <article className="team-card" key={person.id}><div className="team-card-header"><div className="avatar xlarge">{person.initials}</div><span className="availability-label"><i />Heute erreichbar</span></div><span className="team-role">{person.roleLabel}</span><h2>{person.name}</h2><p>Kennt die Projekte, Entscheidungen und Besonderheiten dieser Firma.</p><div className="team-actions"><button className="secondary-button compact" onClick={() => onNotice(`Rückrufwunsch an ${person.firstName} vorgemerkt.`)}><Icon name="phone" size={16} /> Rückruf</button><button className="ghost-button compact" onClick={() => onNotice(`Nachrichtenansicht für ${person.firstName} wäre in der Produktivversion direkt verknüpft.`)}><Icon name="message" size={16} /> Nachricht</button></div></article>)}</div></section>
      {(currentUser.type === "internal" || currentUser.rights.viewAllProjects) && <section className="team-section"><div className="section-title"><h2>Kundenteam</h2><span>{customerTeam.length} Zugänge</span></div><div className="people-list">{customerTeam.map((person) => <article key={person.id}><span className="avatar">{person.initials}</span><div><strong>{person.name}</strong><span>{person.roleLabel}</span></div><div className="rights-summary"><span>{person.rights.viewAllProjects ? "Alle Projekte" : "Nur zugewiesene Projekte"}</span><span>{person.rights.approve ? "Freigabe" : "Keine Freigabe"}</span></div></article>)}</div></section>}
    </div>
  );
}

function CompanySettingsView({ company, users, currentUser, onUpdateCompany, onUpdateRights, onInvite }) {
  const [draft, setDraft] = useState({ name: company.name, primaryColor: company.primaryColor, accentColor: company.accentColor, logoData: company.logoData });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState({ name: "", email: "", roleLabel: "" });
  const canManageUsers = currentUser.type === "internal" || currentUser.rights.manageUsers;

  useEffect(() => setDraft({ name: company.name, primaryColor: company.primaryColor, accentColor: company.accentColor, logoData: company.logoData }), [company]);

  function readLogo(file) {
    if (!file) return;
    if (file.size > 800000) return;
    const reader = new FileReader();
    reader.onload = () => setDraft((current) => ({ ...current, logoData: String(reader.result || "") }));
    reader.readAsDataURL(file);
  }

  const rights = [
    ["viewAllProjects", "Alle Firmenprojekte sehen", "Andernfalls sieht der Benutzer nur ihm zugewiesene Aufträge."],
    ["approve", "Druckdaten freigeben", "Erlaubt verbindliche Freigaben im Projekt."],
    ["viewFinancials", "Angebote und Rechnungen sehen", "Blendet kaufmännische Dokumente ein."],
    ["createRequests", "Neue Projekte anfragen", "Erlaubt das Anlegen neuer Beratungsanfragen."],
    ["manageCompany", "Firmendarstellung verwalten", "Kann Logo, Farben und Firmendaten anpassen."],
    ["manageUsers", "Benutzer und Rechte verwalten", "Kann weitere Mitarbeiter der Firma verwalten."]
  ];

  return (
    <div className="page-stack">
      <section className="page-header"><div><p className="eyebrow">Mandant und Rollen</p><h1>Firmeneinstellungen</h1><p className="lead">Logo, Farbwelt und Zugriffsrechte werden für {company.name} zentral gesteuert.</p></div></section>
      <section className="settings-grid">
        <div className="panel settings-panel">
          <div className="settings-heading"><div><h2>Darstellung der Firma</h2><p>Der Projektraum übernimmt Logo und Akzentfarben des Kunden, bleibt aber transparent „betreut von druckkultur“.</p></div><CompanyLogo company={{ ...company, ...draft }} /></div>
          <div className="form-grid"><label className="form-field wide"><span>Firmenname</span><input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} /></label><label className="form-field"><span>Hauptfarbe</span><div className="color-field"><input type="color" value={draft.primaryColor} onChange={(event) => setDraft((current) => ({ ...current, primaryColor: event.target.value }))} /><input value={draft.primaryColor} onChange={(event) => setDraft((current) => ({ ...current, primaryColor: event.target.value }))} /></div></label><label className="form-field"><span>Akzentfarbe</span><div className="color-field"><input type="color" value={draft.accentColor} onChange={(event) => setDraft((current) => ({ ...current, accentColor: event.target.value }))} /><input value={draft.accentColor} onChange={(event) => setDraft((current) => ({ ...current, accentColor: event.target.value }))} /></div></label><label className="form-field wide"><span>Kundenlogo</span><input type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={(event) => readLogo(event.target.files?.[0])} /><small>Für die lokale Demo maximal 800 KB. Produktiv wird das Logo sicher gespeichert und optimiert.</small></label></div>
          <div className="settings-actions"><button className="ghost-button" onClick={() => setDraft((current) => ({ ...current, logoData: "" }))}>Logo entfernen</button><button className="primary-button" onClick={() => onUpdateCompany(company.id, draft)}>Darstellung speichern</button></div>
        </div>

        <div className="panel branding-preview" style={{ "--preview-primary": draft.primaryColor, "--preview-accent": draft.accentColor }}><span className="eyebrow">Vorschau</span><div className="preview-header"><CompanyLogo company={{ ...company, ...draft }} /><div><small>Ihre externe Druckabteilung</small><strong>{draft.name}</strong></div></div><div className="preview-project"><span>DK-260XXX</span><h3>Ihr Projekt auf einen Blick</h3><p>Nächster Schritt, Ansprechpartner und Termin sind sofort sichtbar.</p><button>Projekt öffnen</button></div></div>
      </section>

      <section className="panel user-settings-panel">
        <div className="settings-heading"><div><h2>Benutzer und Rechte</h2><p>Teamleiter können die gesamte Firma sehen. Andere Benutzer erhalten eine auf ihre Aufgaben begrenzte Sicht.</p></div>{canManageUsers && <button className="secondary-button" onClick={() => setInviteOpen((value) => !value)}><Icon name="plus" size={17} /> Benutzer hinzufügen</button>}</div>
        {inviteOpen && <form className="invite-form" onSubmit={(event) => { event.preventDefault(); onInvite(company.id, invite); setInvite({ name: "", email: "", roleLabel: "" }); setInviteOpen(false); }}><label className="form-field"><span>Name</span><input required value={invite.name} onChange={(event) => setInvite((current) => ({ ...current, name: event.target.value }))} /></label><label className="form-field"><span>E-Mail</span><input required type="email" value={invite.email} onChange={(event) => setInvite((current) => ({ ...current, email: event.target.value }))} /></label><label className="form-field"><span>Funktion</span><input value={invite.roleLabel} onChange={(event) => setInvite((current) => ({ ...current, roleLabel: event.target.value }))} placeholder="z. B. Marketing" /></label><button className="primary-button" type="submit">Demobenutzer anlegen</button></form>}
        <div className="user-rights-list">
          {users.map((person) => (
            <article key={person.id}>
              <header><span className="avatar">{person.initials}</span><div><h3>{person.name}</h3><p>{person.roleLabel} · {person.email}</p></div><span className={classNames("access-label", person.rights.viewAllProjects && "full")}>{person.rights.viewAllProjects ? "Firmensicht" : "Eigene Projekte"}</span></header>
              <div className="rights-grid">{rights.map(([key, label, detail]) => <label key={key} className="right-toggle"><span><strong>{label}</strong><small>{detail}</small></span><input type="checkbox" checked={Boolean(person.rights[key])} disabled={!canManageUsers || person.id === currentUser.id && key === "manageUsers"} onChange={(event) => onUpdateRights(person.id, { [key]: event.target.checked })} /><i /></label>)}</div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProjectDrawer({ project, users, currentUser, messages, documents, onClose, onApprove, onMessage, onMarkRead, onDownload }) {
  const [tab, setTab] = useState("overview");
  const [message, setMessage] = useState("");
  const contact = getUser(users, project.contactUserId);
  const owners = project.ownerUserIds.map((id) => getUser(users, id)).filter(Boolean);

  useEffect(() => { if (tab === "communication") onMarkRead(); }, [tab]);

  return (
    <div className="drawer-layer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <button className="drawer-backdrop" onClick={onClose} aria-label="Projekt schließen" />
      <section className="project-drawer">
        <header className="drawer-header"><div><span>{project.id} · {project.category}</span><h2 id="drawer-title">{project.title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Projekt schließen"><Icon name="close" /></button></header>
        <div className="drawer-tabs" role="tablist">{[["overview", "Übersicht"], ["files", `Dokumente (${documents.length})`], ["communication", `Nachrichten (${messages.length})`]].map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>)}</div>
        <div className="drawer-content">
          {tab === "overview" && <><section className={classNames("next-action-card", project.statusTone)}><div className="next-action-icon"><Icon name={project.statusTone === "warning" ? "clock" : "check"} size={24} /></div><div><span>Nächster Schritt</span><h3>{project.nextAction}</h3><p>{project.nextActionDetail}</p>{project.due !== "–" && <strong>Benötigt: {project.due}</strong>}</div>{project.status === "Freigabe erforderlich" && currentUser.rights.approve && <button className="primary-button" onClick={onApprove}>Version freigeben</button>}</section><section className="drawer-section"><div className="section-heading"><h3>Projektverlauf</h3><span>{project.progress}% abgeschlossen</span></div><div className="timeline">{project.steps.map((step, index) => <div className={classNames("timeline-step", step.state)} key={`${step.label}-${index}`}><i>{step.state === "done" ? <Icon name="check" size={13} /> : index + 1}</i><div><strong>{step.label}</strong><span>{step.date}</span></div></div>)}</div></section><section className="drawer-section"><div className="section-heading"><h3>Produktdetails</h3></div><dl className="detail-grid"><div><dt>Auflage</dt><dd>{project.quantity}</dd></div><div><dt>Liefertermin</dt><dd>{project.delivery}</dd></div><div className="wide"><dt>Ausführung</dt><dd>{project.specification}</dd></div><div><dt>druckkultur</dt><dd>{contact?.name}</dd></div><div><dt>Kundenseite</dt><dd>{owners.map((owner) => owner.name).join(", ")}</dd></div></dl></section></>}
          {tab === "files" && <div className="drawer-document-list">{documents.map((document) => <article key={document.id}><span className="file-icon"><Icon name="document" size={21} /></span><div><strong>{document.title}</strong><span>{document.type} · {document.date} · {document.size}</span></div><button className="icon-button" onClick={() => onDownload(document)} aria-label={`${document.title} herunterladen`}><Icon name="download" size={18} /></button></article>)}</div>}
          {tab === "communication" && <div className="drawer-communication"><div className="drawer-message-stream">{[...messages].sort((a,b) => new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime()).map((item) => { const sender = getUser(users, item.senderUserId); const own = item.senderUserId === currentUser.id; return <article key={item.id} className={classNames("message-bubble", own && "own")}><strong>{own ? "Sie" : sender?.name || "Projektteam"}</strong><p>{item.text}</p><time>{item.time}</time>{own && <small className="read-receipt"><Icon name={item.readBy.length > 1 ? "check" : "send"} size={13} />{receiptText(item, users, currentUser)}</small>}</article>; })}</div><form onSubmit={(event) => { event.preventDefault(); onMessage(message); setMessage(""); }}><label className="sr-only" htmlFor="drawer-message">Nachricht</label><textarea id="drawer-message" rows="3" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Nachricht zum Projekt …"/><button className="primary-button" type="submit">Senden <Icon name="send" size={16} /></button></form></div>}
        </div>
      </section>
    </div>
  );
}

function PanelHeader({ title, subtitle, action, onAction }) {
  return <header className="panel-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action && <button onClick={onAction}>{action}<Icon name="arrow" size={15} /></button>}</header>;
}

function EmptyState({ title, text }) {
  return <div className="empty-state"><span><Icon name="check" /></span><strong>{title}</strong><p>{text}</p></div>;
}

function downloadDemoDocument(document, project, onNotice) {
  const content = [
    "druckkultur desk – DEMODOKUMENT",
    "",
    `Dokument: ${document.title}`,
    `Typ: ${document.type}`,
    `Projekt: ${project?.title || document.projectId}`,
    `Auftragsnummer: ${document.projectId}`,
    `Datum: ${document.date}`,
    "",
    "Dieses Textdokument demonstriert den Download. In der Produktivversion wird die echte, zugriffsgeschützte Datei ausgeliefert."
  ].join("\n");
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = `${document.projectId}-${document.title.replace(/[^a-z0-9äöüß]+/gi, "-").toLowerCase()}.txt`;
  link.click();
  URL.revokeObjectURL(url);
  onNotice("Demodokument erstellt. Echte PDFs benötigen eine sichere Dateiablage.");
}
