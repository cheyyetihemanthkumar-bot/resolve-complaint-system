/**
 * API client.
 *
 * In preview, this uses a localStorage-backed mock store so the app is
 * fully usable without an AWS deployment.
 *
 * To wire to your real AWS backend:
 *   1. Set VITE_API_BASE_URL=https://<api-id>.execute-api.<region>.amazonaws.com
 *   2. Implement the fetch-based branch below (TODOs marked).
 *
 * The mock layer mirrors the REST endpoints documented in /backend/api.md.
 */

import {
  listComplaints,
  saveComplaints,
  getUsers,
  saveUsers,
  getSession,
  setSession,
} from "./mock-store";
import type { Complaint, ComplaintNote, Priority, Status, User } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;
const USE_MOCK = true;

function genId(prefix: string) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${s}`;
}

// =====================================================================
// AUTH
// =====================================================================

export async function signUp(input: {
  email: string;
  password: string;
  name: string;
}): Promise<User> {
  if (USE_MOCK) {
    const db = getUsers();
    if (db[input.email]) throw new Error("Account already exists for this email");
    const user: User = {
      id: `u_${Math.random().toString(36).slice(2, 9)}`,
      email: input.email,
      name: input.name,
      role: "user",
    };
    db[input.email] = { password: input.password, user };
    saveUsers(db);
    setSession(user);
    return user;
  }
  // TODO: call Cognito SignUp + auto-confirm via Lambda, then InitiateAuth
  throw new Error("Real Cognito flow not yet wired. See /backend/README.md");
}

export async function signIn(email: string, password: string): Promise<User> {
  if (USE_MOCK) {
    const db = getUsers();
    const entry = db[email];
    if (!entry || entry.password !== password) throw new Error("Invalid email or password");
    setSession(entry.user);
    return entry.user;
  }
  throw new Error("Real Cognito flow not yet wired. See /backend/README.md");
}

export async function signOut(): Promise<void> {
  setSession(null);
}

export function currentUser(): User | null {
  return getSession();
}

// =====================================================================
// COMPLAINTS — user
// =====================================================================

export async function createComplaint(input: {
  name: string;
  email: string;
  phone: string;
  category: Complaint["category"];
  subject: string;
  description: string;
  priority: Priority;
  attachment?: Complaint["attachment"];
}): Promise<Complaint> {
  const user = currentUser();
  if (!user) throw new Error("Not authenticated");
  if (USE_MOCK) {
    const now = new Date().toISOString();
    const complaint: Complaint = {
      id: genId("CMP"),
      userId: user.id,
      ...input,
      status: "Pending",
      notes: [],
      createdAt: now,
      updatedAt: now,
    };
    const all = listComplaints();
    all.unshift(complaint);
    saveComplaints(all);
    return complaint;
  }
  throw new Error("Real API not wired");
}

export async function listMyComplaints(): Promise<Complaint[]> {
  const user = currentUser();
  if (!user) return [];
  return listComplaints()
    .filter((c) => c.userId === user.id && !c.archived)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getComplaint(id: string): Promise<Complaint | null> {
  const all = listComplaints();
  return all.find((c) => c.id === id) ?? null;
}

// =====================================================================
// COMPLAINTS — admin
// =====================================================================

export async function listAllComplaints(): Promise<Complaint[]> {
  return listComplaints()
    .filter((c) => !c.archived)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateComplaintStatus(id: string, status: Status): Promise<Complaint> {
  const all = listComplaints();
  const idx = all.findIndex((c) => c.id === id);
  if (idx < 0) throw new Error("Not found");
  all[idx] = { ...all[idx], status, updatedAt: new Date().toISOString() };
  saveComplaints(all);
  return all[idx];
}

export async function assignComplaint(id: string, assignedTo: string): Promise<Complaint> {
  const all = listComplaints();
  const idx = all.findIndex((c) => c.id === id);
  if (idx < 0) throw new Error("Not found");
  all[idx] = { ...all[idx], assignedTo, updatedAt: new Date().toISOString() };
  saveComplaints(all);
  return all[idx];
}

export async function addNote(
  id: string,
  input: { text: string; internal: boolean }
): Promise<Complaint> {
  const user = currentUser();
  if (!user) throw new Error("Not authenticated");
  const all = listComplaints();
  const idx = all.findIndex((c) => c.id === id);
  if (idx < 0) throw new Error("Not found");
  const note: ComplaintNote = {
    id: `n_${Math.random().toString(36).slice(2, 8)}`,
    authorEmail: user.email,
    authorName: user.name,
    text: input.text,
    createdAt: new Date().toISOString(),
    internal: input.internal,
  };
  all[idx] = {
    ...all[idx],
    notes: [...all[idx].notes, note],
    updatedAt: new Date().toISOString(),
  };
  saveComplaints(all);
  return all[idx];
}

export async function archiveComplaint(id: string): Promise<void> {
  const all = listComplaints();
  const idx = all.findIndex((c) => c.id === id);
  if (idx < 0) return;
  all[idx] = { ...all[idx], archived: true, updatedAt: new Date().toISOString() };
  saveComplaints(all);
}

export async function deleteComplaint(id: string): Promise<void> {
  saveComplaints(listComplaints().filter((c) => c.id !== id));
}
