import type { Complaint, User } from "./types";

const COMPLAINTS_KEY = "cms.complaints.v1";
const USERS_KEY = "cms.users.v1";
const SESSION_KEY = "cms.session.v1";

function isBrowser() {
  return typeof window !== "undefined";
}

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------- seed ----------
function seedIfEmpty() {
  if (!isBrowser()) return;
  const existing = read<Complaint[]>(COMPLAINTS_KEY, []);
  if (existing.length > 0) return;

  const now = Date.now();
  const demoUserId = "u_demo";
  const seed: Complaint[] = [
    {
      id: "CMP-1A2B3C",
      userId: demoUserId,
      name: "Jane Doe",
      email: "demo@user.com",
      phone: "+1 415 555 0101",
      category: "Billing",
      subject: "Charged twice for monthly subscription",
      description:
        "I was charged $29 twice on Nov 3rd for my monthly subscription. Please refund the duplicate charge.",
      priority: "High",
      status: "In Progress",
      assignedTo: "support@company.com",
      notes: [
        {
          id: "n1",
          authorEmail: "admin@company.com",
          authorName: "Admin",
          text: "Reached out to billing provider for refund.",
          createdAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
          internal: true,
        },
      ],
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 3).toISOString(),
      updatedAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: "CMP-4D5E6F",
      userId: demoUserId,
      name: "Jane Doe",
      email: "demo@user.com",
      phone: "+1 415 555 0101",
      category: "Technical",
      subject: "Mobile app crashes on launch",
      description:
        "iOS app crashes immediately after the splash screen on iPhone 13, iOS 17.4. Reinstalled twice.",
      priority: "Medium",
      status: "Pending",
      notes: [],
      createdAt: new Date(now - 1000 * 60 * 60 * 18).toISOString(),
      updatedAt: new Date(now - 1000 * 60 * 60 * 18).toISOString(),
    },
    {
      id: "CMP-7G8H9I",
      userId: "u_other",
      name: "Mark Singh",
      email: "mark@example.com",
      phone: "+44 20 7946 0991",
      category: "Service",
      subject: "Late delivery, package never arrived",
      description: "Order #4521 was promised on Nov 1 and still hasn't arrived.",
      priority: "High",
      status: "Resolved",
      assignedTo: "support@company.com",
      notes: [
        {
          id: "n2",
          authorEmail: "support@company.com",
          authorName: "Support",
          text: "Replacement shipped, tracking #ZX9911.",
          createdAt: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
          internal: false,
        },
      ],
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 6).toISOString(),
      updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
    },
    {
      id: "CMP-J0K1L2",
      userId: "u_other2",
      name: "Sara Lin",
      email: "sara@example.com",
      phone: "+1 212 555 0190",
      category: "Product",
      subject: "Feature request: dark mode export",
      description: "Would love to export reports keeping the dark theme.",
      priority: "Low",
      status: "Closed",
      notes: [],
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 10).toISOString(),
      updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 8).toISOString(),
    },
    {
      id: "CMP-M3N4O5",
      userId: "u_other3",
      name: "Alex Park",
      email: "alex@example.com",
      phone: "+1 503 555 0144",
      category: "Account",
      subject: "Can't reset password",
      description: "Reset email never arrives. Checked spam folder.",
      priority: "Medium",
      status: "Pending",
      notes: [],
      createdAt: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
      updatedAt: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
    },
  ];
  write(COMPLAINTS_KEY, seed);

  // demo users
  const users: Record<string, { password: string; user: User }> = {
    "demo@user.com": {
      password: "demo1234",
      user: { id: demoUserId, email: "demo@user.com", name: "Jane Doe", role: "user" },
    },
    "admin@company.com": {
      password: "admin1234",
      user: { id: "u_admin", email: "admin@company.com", name: "Admin User", role: "admin" },
    },
  };
  write(USERS_KEY, users);
}

if (isBrowser()) seedIfEmpty();

// ---------- complaints ----------
export function listComplaints(): Complaint[] {
  return read<Complaint[]>(COMPLAINTS_KEY, []);
}
export function saveComplaints(items: Complaint[]) {
  write(COMPLAINTS_KEY, items);
}

// ---------- users ----------
type UserDb = Record<string, { password: string; user: User }>;
export function getUsers(): UserDb {
  return read<UserDb>(USERS_KEY, {});
}
export function saveUsers(db: UserDb) {
  write(USERS_KEY, db);
}

// ---------- session ----------
export function getSession(): User | null {
  return read<User | null>(SESSION_KEY, null);
}
export function setSession(user: User | null) {
  write(SESSION_KEY, user);
}
