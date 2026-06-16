export type Priority = "Low" | "Medium" | "High";
export type Status = "Pending" | "In Progress" | "Resolved" | "Closed";
export type Category =
  | "Billing"
  | "Technical"
  | "Service"
  | "Product"
  | "Account"
  | "Other";

export interface Attachment {
  name: string;
  size: number;
  type: string;
  dataUrl: string; // mock: base64. Real API: S3 object key + signed URL
}

export interface ComplaintNote {
  id: string;
  authorEmail: string;
  authorName: string;
  text: string;
  createdAt: string;
  internal: boolean;
}

export interface Complaint {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  category: Category;
  subject: string;
  description: string;
  priority: Priority;
  status: Status;
  assignedTo?: string;
  attachment?: Attachment;
  notes: ComplaintNote[];
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
}

export const CATEGORIES: Category[] = [
  "Billing",
  "Technical",
  "Service",
  "Product",
  "Account",
  "Other",
];
export const PRIORITIES: Priority[] = ["Low", "Medium", "High"];
export const STATUSES: Status[] = ["Pending", "In Progress", "Resolved", "Closed"];
