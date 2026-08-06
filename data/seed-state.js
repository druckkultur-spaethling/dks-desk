import {
  initialCallbacks,
  initialCompanies,
  initialDocuments,
  initialMessages,
  initialProjects,
  initialUsers
} from "./mock-data";

export function createSeedState() {
  return JSON.parse(JSON.stringify({
    companies: initialCompanies,
    users: initialUsers,
    projects: initialProjects,
    messages: initialMessages,
    documents: initialDocuments,
    callbacks: initialCallbacks
  }));
}
