import type { ComponentType } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Activity,
  Users,
  UserPlus,
  FlaskConical,
  FileText,
  Ticket,
  Library,
  Bot,
  ShieldAlert,
} from "lucide-react";

export interface AdminNavItem {
  /** Path under /[locale]/admin, e.g. "/users". "" = the Overview root. */
  href: string;
  icon: ComponentType<{ className?: string }>;
  /** Key inside the admin.nav dictionary namespace. */
  labelKey: string;
  /** Highlight only on exact match (Overview root). */
  exact?: boolean;
}

export interface AdminNavGroup {
  /** Key inside the admin.nav dictionary namespace. */
  labelKey: string;
  items: AdminNavItem[];
}

/**
 * Sidebar IA: 4 groups, 12 destinations. Each entry is a real route under
 * app/[locale]/(app)/admin/. Detail pages (user-journey) are not listed.
 */
export const ADMIN_NAV: AdminNavGroup[] = [
  {
    labelKey: "groupOverview",
    items: [
      { href: "", icon: LayoutDashboard, labelKey: "overview", exact: true },
    ],
  },
  {
    labelKey: "groupGrowth",
    items: [
      { href: "/insights", icon: TrendingUp, labelKey: "insights" },
      { href: "/analytics", icon: Activity, labelKey: "traffic" },
      { href: "/users", icon: Users, labelKey: "users" },
      { href: "/visitors", icon: UserPlus, labelKey: "visitors" },
    ],
  },
  {
    labelKey: "groupResearch",
    items: [
      { href: "/research", icon: FlaskConical, labelKey: "research" },
      { href: "/psychometrics", icon: FileText, labelKey: "psychometrics" },
    ],
  },
  {
    labelKey: "groupOperations",
    items: [
      { href: "/invites", icon: Ticket, labelKey: "invites" },
      { href: "/careers", icon: Library, labelKey: "careers" },
      { href: "/ai", icon: Bot, labelKey: "aiUsage" },
      { href: "/moderation", icon: ShieldAlert, labelKey: "moderation" },
    ],
  },
];
