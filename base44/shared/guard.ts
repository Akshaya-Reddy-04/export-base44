import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";

// Small helpers shared by Rush Radar backend functions.
export function pageItems(response: any): any[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  return response.items ?? [];
}

export function isStaff(user: any): boolean {
  return user?.role === "admin" || user?.role === "staff";
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export { createClientFromRequest };