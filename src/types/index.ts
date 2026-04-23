export type Role = "user" | "admin";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  isDemo?: boolean;
  favorites?: Favorite[];
  createdAt?: string;
}

export interface Favorite {
  _id: string;
  from: string;
  to: string;
}

export interface Bus {
  _id: string;
  name?: string;
  fromCity: string;
  toCity: string;
  arrivalTime: string;
  frequency?: string;
  status: "approved" | "pending" | "rejected";
}

export interface RouteRequest {
  _id: string;
  fromCity: string;
  toCity: string;
  name?: string;
  notes?: string;
  contactEmail?: string;
  arrivalTime?: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  requestedBy?: { name: string; email: string } | null;
  createdAt: string;
}

export interface RideHistoryEntry {
  _id: string;
  bus: Bus;
  fromCity: string;
  toCity: string;
  createdAt: string;
}

export interface PopularRoute {
  from: string;
  to: string;
  count: number;
}
