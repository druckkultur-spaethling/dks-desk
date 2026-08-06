export const initialCompanies = [
  {
    id: "vitanova",
    name: "VitaNova GmbH",
    shortName: "VitaNova",
    initials: "VN",
    primaryColor: "#0b7772",
    accentColor: "#9ed0c8",
    logoData: "",
    industry: "Nahrungsergänzung",
    customerNumber: "K-1048",
    assignedTeam: ["dk-andreas", "dk-heinz"]
  },
  {
    id: "musterwerke",
    name: "Musterwerke AG",
    shortName: "Musterwerke",
    initials: "MW",
    primaryColor: "#176f68",
    accentColor: "#b6d8d0",
    logoData: "",
    industry: "Industrie & Markenartikel",
    customerNumber: "K-0821",
    assignedTeam: ["dk-mirco", "dk-andreas"]
  },
  {
    id: "alpenkraft",
    name: "Alpenkraft Naturprodukte GmbH",
    shortName: "Alpenkraft",
    initials: "AK",
    primaryColor: "#416d62",
    accentColor: "#c3d5bd",
    logoData: "",
    industry: "Naturprodukte",
    customerNumber: "K-1196",
    assignedTeam: ["dk-heinz", "dk-mirco"]
  }
];

export const initialUsers = [
  {
    id: "dk-andreas",
    type: "internal",
    name: "Andreas Bauernfeind",
    firstName: "Andreas",
    email: "andreas@druckkultur.demo",
    phone: "+49 30 0000 1101",
    teamsAccount: "andreas@druckkultur.demo",
    password: "demo",
    roleLabel: "Kundenberatung & Auftragsplanung",
    initials: "AB",
    companyIds: ["vitanova", "musterwerke"],
    rights: { manageCompanies: true, viewAllProjects: true, approve: true, viewFinancials: true }
  },
  {
    id: "dk-heinz",
    type: "internal",
    name: "Heinz Späthling",
    firstName: "Heinz",
    email: "heinz@druckkultur.demo",
    phone: "+49 30 0000 1102",
    teamsAccount: "heinz@druckkultur.demo",
    password: "demo",
    roleLabel: "Geschäftsführung & Beratung",
    initials: "HS",
    companyIds: ["vitanova", "alpenkraft", "musterwerke"],
    rights: { manageCompanies: true, viewAllProjects: true, approve: true, viewFinancials: true }
  },
  {
    id: "dk-mirco",
    type: "internal",
    name: "Mirco Gruber",
    firstName: "Mirco",
    email: "mirco@druckkultur.demo",
    phone: "+49 30 0000 1103",
    teamsAccount: "mirco@druckkultur.demo",
    password: "demo",
    roleLabel: "Mailing & Digitaldruck",
    initials: "MG",
    companyIds: ["musterwerke", "alpenkraft"],
    rights: { manageCompanies: false, viewAllProjects: true, approve: true, viewFinancials: true }
  },
  {
    id: "vita-laura",
    type: "customer",
    companyId: "vitanova",
    name: "Laura Schneider",
    firstName: "Laura",
    email: "laura@vitanova.demo",
    phone: "+49 30 0000 2101",
    teamsAccount: "laura@vitanova.demo",
    password: "demo",
    roleLabel: "Teamleitung Marketing",
    initials: "LS",
    rights: { viewAllProjects: true, manageCompany: true, manageUsers: true, approve: true, viewFinancials: true, createRequests: true }
  },
  {
    id: "vita-maria",
    type: "customer",
    companyId: "vitanova",
    name: "Maria Müller",
    firstName: "Maria",
    email: "maria@vitanova.demo",
    phone: "+49 30 0000 2102",
    teamsAccount: "maria@vitanova.demo",
    password: "demo",
    roleLabel: "Marketing",
    initials: "MM",
    rights: { viewAllProjects: false, manageCompany: false, manageUsers: false, approve: true, viewFinancials: false, createRequests: true }
  },
  {
    id: "vita-thomas",
    type: "customer",
    companyId: "vitanova",
    name: "Thomas Weber",
    firstName: "Thomas",
    email: "thomas@vitanova.demo",
    phone: "+49 30 0000 2103",
    teamsAccount: "thomas@vitanova.demo",
    password: "demo",
    roleLabel: "Qualitätssicherung",
    initials: "TW",
    rights: { viewAllProjects: false, manageCompany: false, manageUsers: false, approve: true, viewFinancials: false, createRequests: false }
  },
  {
    id: "muster-sabine",
    type: "customer",
    companyId: "musterwerke",
    name: "Sabine König",
    firstName: "Sabine",
    email: "sabine@musterwerke.demo",
    phone: "+49 30 0000 3101",
    teamsAccount: "sabine@musterwerke.demo",
    password: "demo",
    roleLabel: "Leitung Marketing & Einkauf",
    initials: "SK",
    rights: { viewAllProjects: true, manageCompany: true, manageUsers: true, approve: true, viewFinancials: true, createRequests: true }
  },
  {
    id: "muster-david",
    type: "customer",
    companyId: "musterwerke",
    name: "David Hartmann",
    firstName: "David",
    email: "david@musterwerke.demo",
    phone: "+49 30 0000 3102",
    teamsAccount: "david@musterwerke.demo",
    password: "demo",
    roleLabel: "Produktmarketing",
    initials: "DH",
    rights: { viewAllProjects: false, manageCompany: false, manageUsers: false, approve: true, viewFinancials: false, createRequests: true }
  },
  {
    id: "muster-nina",
    type: "customer",
    companyId: "musterwerke",
    name: "Nina Berger",
    firstName: "Nina",
    email: "nina@musterwerke.demo",
    phone: "+49 30 0000 3103",
    teamsAccount: "nina@musterwerke.demo",
    password: "demo",
    roleLabel: "Einkauf",
    initials: "NB",
    rights: { viewAllProjects: true, manageCompany: false, manageUsers: false, approve: false, viewFinancials: true, createRequests: true }
  },
  {
    id: "alpen-lena",
    type: "customer",
    companyId: "alpenkraft",
    name: "Lena Hofmann",
    firstName: "Lena",
    email: "lena@alpenkraft.demo",
    phone: "+49 30 0000 4101",
    teamsAccount: "lena@alpenkraft.demo",
    password: "demo",
    roleLabel: "Brand Management",
    initials: "LH",
    rights: { viewAllProjects: true, manageCompany: true, manageUsers: true, approve: true, viewFinancials: true, createRequests: true }
  },
  {
    id: "alpen-jonas",
    type: "customer",
    companyId: "alpenkraft",
    name: "Jonas Meier",
    firstName: "Jonas",
    email: "jonas@alpenkraft.demo",
    phone: "+49 30 0000 4102",
    teamsAccount: "jonas@alpenkraft.demo",
    password: "demo",
    roleLabel: "Produktmanagement",
    initials: "JM",
    rights: { viewAllProjects: false, manageCompany: false, manageUsers: false, approve: true, viewFinancials: false, createRequests: true }
  }
];

export const initialProjects = [
  {
    id: "DK-260184",
    companyId: "vitanova",
    ownerUserIds: ["vita-maria", "vita-thomas"],
    title: "Faltschachtel Magnesium Komplex",
    category: "Faltschachtel",
    status: "Freigabe erforderlich",
    statusTone: "warning",
    progress: 44,
    nextAction: "Druckfreigabe für Version 4",
    nextActionDetail: "Pflichttexte, EAN und Stanzkontur abschließend prüfen.",
    due: "Heute, 12:00 Uhr",
    delivery: "21. August 2026",
    contactUserId: "dk-andreas",
    quantity: "25.000 Stück",
    specification: "GC1 350 g/m² · 4/0-farbig · Dispersionslack · Automatikboden",
    updated: "vor 18 Minuten",
    steps: [
      { label: "Anfrage", state: "done", date: "29.07." },
      { label: "Angebot", state: "done", date: "30.07." },
      { label: "Druckdaten", state: "done", date: "04.08." },
      { label: "Freigabe", state: "current", date: "heute" },
      { label: "Produktion", state: "upcoming", date: "10.08." },
      { label: "Lieferung", state: "upcoming", date: "21.08." }
    ]
  },
  {
    id: "DK-260190",
    companyId: "vitanova",
    ownerUserIds: ["vita-laura"],
    title: "POS-Aufsteller Immun-Kampagne",
    category: "Display",
    status: "Druckdaten werden geprüft",
    statusTone: "info",
    progress: 34,
    nextAction: "Prüfbericht folgt",
    nextActionDetail: "druckkultur prüft Stanzkontur und Weißunterlegung.",
    due: "Heute Nachmittag",
    delivery: "28. August 2026",
    contactUserId: "dk-heinz",
    quantity: "1.200 Stück",
    specification: "Chromosulfatkarton · beidseitig kaschiert · formgestanzt",
    updated: "vor 42 Minuten",
    steps: [
      { label: "Anfrage", state: "done", date: "01.08." },
      { label: "Angebot", state: "done", date: "03.08." },
      { label: "Druckdaten", state: "current", date: "heute" },
      { label: "Freigabe", state: "upcoming", date: "offen" },
      { label: "Produktion", state: "upcoming", date: "offen" }
    ]
  },
  {
    id: "DK-260151",
    companyId: "vitanova",
    ownerUserIds: ["vita-thomas"],
    title: "Beipackzettel Produktlinie Zink",
    category: "Beipackzettel",
    status: "In Produktion",
    statusTone: "success",
    progress: 74,
    nextAction: "Keine Aktion erforderlich",
    nextActionDetail: "Falzung und Endkontrolle laufen.",
    due: "–",
    delivery: "12. August 2026",
    contactUserId: "dk-andreas",
    quantity: "80.000 Stück",
    specification: "40 g Dünndruck · 2/2-farbig · Kreuzbruchfalz",
    updated: "heute, 08:05 Uhr",
    steps: [
      { label: "Anfrage", state: "done", date: "15.07." },
      { label: "Freigabe", state: "done", date: "29.07." },
      { label: "Druck", state: "done", date: "05.08." },
      { label: "Falzung", state: "current", date: "heute" },
      { label: "Lieferung", state: "upcoming", date: "12.08." }
    ]
  },
  {
    id: "DK-260167",
    companyId: "musterwerke",
    ownerUserIds: ["muster-david", "muster-sabine"],
    title: "Herbstmailing 2026",
    category: "Mailing",
    status: "Angebot liegt vor",
    statusTone: "info",
    progress: 25,
    nextAction: "Angebot prüfen",
    nextActionDetail: "Zwei Varianten für Papier und Personalisierung stehen bereit.",
    due: "bis 10. August",
    delivery: "18. September 2026",
    contactUserId: "dk-mirco",
    quantity: "12.480 personalisierte Sendungen",
    specification: "Selfmailer · 6-seitig · variable Ansprache · portooptimiert",
    updated: "gestern",
    steps: [
      { label: "Anfrage", state: "done", date: "31.07." },
      { label: "Beratung", state: "done", date: "03.08." },
      { label: "Angebot", state: "current", date: "05.08." },
      { label: "Druckdaten", state: "upcoming", date: "offen" },
      { label: "Produktion", state: "upcoming", date: "offen" },
      { label: "Versand", state: "upcoming", date: "18.09." }
    ]
  },
  {
    id: "DK-260122",
    companyId: "musterwerke",
    ownerUserIds: ["muster-sabine"],
    title: "Imagebroschüre Produktwelten",
    category: "Broschüre",
    status: "In Produktion",
    statusTone: "success",
    progress: 72,
    nextAction: "Keine Aktion erforderlich",
    nextActionDetail: "Druck ist abgeschlossen. Die Broschüren werden gebunden.",
    due: "–",
    delivery: "14. August 2026",
    contactUserId: "dk-andreas",
    quantity: "3.500 Exemplare",
    specification: "64 Seiten · 170 g Bilderdruck matt · PUR-Klebebindung · Softtouch-Cover",
    updated: "heute, 07:42 Uhr",
    steps: [
      { label: "Anfrage", state: "done", date: "02.07." },
      { label: "Angebot", state: "done", date: "04.07." },
      { label: "Freigabe", state: "done", date: "29.07." },
      { label: "Druck", state: "done", date: "05.08." },
      { label: "Bindung", state: "current", date: "heute" },
      { label: "Lieferung", state: "upcoming", date: "14.08." }
    ]
  },
  {
    id: "DK-260201",
    companyId: "musterwerke",
    ownerUserIds: ["muster-nina"],
    title: "Ersatzteiletiketten Serie B",
    category: "Etiketten",
    status: "Rückfrage offen",
    statusTone: "warning",
    progress: 18,
    nextAction: "Materialauswahl bestätigen",
    nextActionDetail: "Für den Außeneinsatz stehen zwei Klebstoffvarianten zur Auswahl.",
    due: "Morgen, 10:00 Uhr",
    delivery: "2. September 2026",
    contactUserId: "dk-mirco",
    quantity: "18 Sorten · 42.000 Stück",
    specification: "Witterungsbeständige Folie · variable Daten · Rolle",
    updated: "vor 7 Minuten",
    steps: [
      { label: "Anfrage", state: "done", date: "04.08." },
      { label: "Beratung", state: "current", date: "heute" },
      { label: "Angebot", state: "upcoming", date: "offen" },
      { label: "Produktion", state: "upcoming", date: "offen" }
    ]
  },
  {
    id: "DK-260176",
    companyId: "alpenkraft",
    ownerUserIds: ["alpen-lena", "alpen-jonas"],
    title: "Naturkosmetik Geschenkverpackung",
    category: "Verpackung",
    status: "Muster wird erstellt",
    statusTone: "info",
    progress: 38,
    nextAction: "Mustertermin abwarten",
    nextActionDetail: "Weißmuster und zwei Materialvarianten werden vorbereitet.",
    due: "Muster bis 11. August",
    delivery: "30. September 2026",
    contactUserId: "dk-heinz",
    quantity: "8.000 Stück",
    specification: "Naturkarton · Blindprägung · Papierbanderole · kunststofffrei",
    updated: "vor 23 Minuten",
    steps: [
      { label: "Idee", state: "done", date: "28.07." },
      { label: "Konstruktion", state: "done", date: "02.08." },
      { label: "Muster", state: "current", date: "11.08." },
      { label: "Freigabe", state: "upcoming", date: "offen" },
      { label: "Produktion", state: "upcoming", date: "offen" }
    ]
  },
  {
    id: "DK-260143",
    companyId: "alpenkraft",
    ownerUserIds: ["alpen-lena"],
    title: "Produktkarten Kräuterlinie",
    category: "Printprodukt",
    status: "Abgeschlossen",
    statusTone: "neutral",
    progress: 100,
    nextAction: "Projekt abgeschlossen",
    nextActionDetail: "Lieferschein und Produktionsdaten sind archiviert.",
    due: "–",
    delivery: "30. Juli 2026",
    contactUserId: "dk-mirco",
    quantity: "6 Motive · je 2.000 Stück",
    specification: "Recyclingkarton · 4/4-farbig · partielle Relieflackierung",
    updated: "30. Juli",
    steps: [
      { label: "Anfrage", state: "done", date: "03.07." },
      { label: "Freigabe", state: "done", date: "14.07." },
      { label: "Produktion", state: "done", date: "24.07." },
      { label: "Lieferung", state: "done", date: "30.07." }
    ]
  }
];

export const initialMessages = [
  {
    id: 101,
    companyId: "vitanova",
    projectId: "DK-260184",
    senderUserId: "dk-andreas",
    text: "Guten Morgen Frau Müller, Version 4 liegt bereit. Wir haben die Stanzkontur angepasst und den Pflichttext aus Ihrer letzten Rückmeldung übernommen.",
    time: "Heute, 08:14 Uhr",
    createdAt: "2026-08-06T08:14:00+02:00",
    readBy: ["dk-andreas", "vita-laura"]
  },
  {
    id: 102,
    companyId: "vitanova",
    projectId: "DK-260184",
    senderUserId: "vita-maria",
    text: "Danke. Ich prüfe die finale Version heute Vormittag noch mit der Qualitätssicherung.",
    time: "Heute, 08:26 Uhr",
    createdAt: "2026-08-06T08:26:00+02:00",
    readBy: ["vita-maria", "dk-andreas", "vita-thomas"]
  },
  {
    id: 103,
    companyId: "vitanova",
    projectId: "DK-260190",
    senderUserId: "dk-heinz",
    text: "Die Weißunterlegung ist technisch machbar. Wir schicken Ihnen heute noch einen markierten Prüfbericht mit zwei Empfehlungen.",
    time: "Heute, 08:48 Uhr",
    createdAt: "2026-08-06T08:48:00+02:00",
    readBy: ["dk-heinz"]
  },
  {
    id: 201,
    companyId: "musterwerke",
    projectId: "DK-260167",
    senderUserId: "dk-mirco",
    text: "Ich habe im Angebot zwei Papiervarianten gegenübergestellt. Variante B fühlt sich natürlicher an und passt aus meiner Sicht besser zur Kampagne.",
    time: "Gestern, 15:36 Uhr",
    createdAt: "2026-08-05T15:36:00+02:00",
    readBy: ["dk-mirco", "muster-sabine"]
  },
  {
    id: 202,
    companyId: "musterwerke",
    projectId: "DK-260201",
    senderUserId: "muster-nina",
    text: "Die Etiketten werden teilweise im Außenlager verwendet. Welche Klebstoffvariante hält Temperaturschwankungen besser aus?",
    time: "Heute, 09:03 Uhr",
    createdAt: "2026-08-06T09:03:00+02:00",
    readBy: ["muster-nina"]
  },
  {
    id: 301,
    companyId: "alpenkraft",
    projectId: "DK-260176",
    senderUserId: "alpen-jonas",
    text: "Können Sie beim Weißmuster zusätzlich prüfen, ob die Banderole auch ohne Klebepunkt sicher hält?",
    time: "Heute, 08:57 Uhr",
    createdAt: "2026-08-06T08:57:00+02:00",
    readBy: ["alpen-jonas"]
  },
  {
    id: 302,
    companyId: "alpenkraft",
    projectId: "DK-260176",
    senderUserId: "dk-heinz",
    text: "Ja, wir testen beide Varianten direkt am Muster und dokumentieren die Unterschiede mit Fotos.",
    time: "Heute, 09:10 Uhr",
    createdAt: "2026-08-06T09:10:00+02:00",
    readBy: ["dk-heinz"]
  }
];

export const initialDocuments = [
  { id: 1, companyId: "vitanova", projectId: "DK-260184", title: "Freigabeversion 4", type: "Freigabe-PDF", version: "V4", date: "06.08.2026", size: "4,8 MB", financial: false },
  { id: 2, companyId: "vitanova", projectId: "DK-260184", title: "Auftragsbestätigung", type: "Auftragsbestätigung", version: "", date: "31.07.2026", size: "186 KB", financial: true },
  { id: 3, companyId: "vitanova", projectId: "DK-260190", title: "Stanzkontur POS-Aufsteller", type: "Konstruktionsdatei", version: "V2", date: "05.08.2026", size: "1,4 MB", financial: false },
  { id: 4, companyId: "musterwerke", projectId: "DK-260167", title: "Angebot Herbstmailing", type: "Angebot", version: "V2", date: "05.08.2026", size: "324 KB", financial: true },
  { id: 5, companyId: "musterwerke", projectId: "DK-260122", title: "Druckfreigabe Imagebroschüre", type: "Freigabe-PDF", version: "final", date: "29.07.2026", size: "12,4 MB", financial: false },
  { id: 6, companyId: "musterwerke", projectId: "DK-260201", title: "Materialvergleich Klebstoff", type: "Beratung", version: "V1", date: "06.08.2026", size: "780 KB", financial: false },
  { id: 7, companyId: "alpenkraft", projectId: "DK-260176", title: "Konstruktion Geschenkverpackung", type: "Stanzzeichnung", version: "V3", date: "04.08.2026", size: "2,1 MB", financial: false },
  { id: 8, companyId: "alpenkraft", projectId: "DK-260143", title: "Lieferschein Produktkarten", type: "Lieferschein", version: "", date: "30.07.2026", size: "104 KB", financial: true }
];


export const initialCallbacks = [
  {
    id: "cb-demo-1",
    companyId: "musterwerke",
    requesterUserId: "muster-david",
    assignedUserId: "dk-andreas",
    phone: "+49 30 0000 3102",
    teamsAccount: "david@musterwerke.demo",
    contactMethod: "phone",
    contactValue: "+49 30 0000 3102",
    subject: "Kurze Abstimmung zum Herbstmailing",
    preferredTime: "Möglichst bald",
    requestedAt: "Heute, 09:42 Uhr",
    status: "pending",
    completedAt: ""
  }
];
