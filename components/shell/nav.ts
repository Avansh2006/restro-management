"use client";

import { type LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ListOrdered,
  Armchair,
  CalendarCheck,
  ChefHat,
  MonitorSmartphone,
  UtensilsCrossed,
  Package,
  BookOpenText,
  Truck,
  ShoppingCart,
  BadgeCheck,
  CalendarClock,
  ScanFace,
  CalendarRange,
  Plane,
  Wallet,
  Users,
  Star,
  MessageSquareText,
  BarChart3,
  FileText,
  Store,
  ScrollText,
  Settings,
  QrCode,
  Smartphone,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/orders", label: "Live Orders", icon: ListOrdered },
      { href: "/tables", label: "Tables", icon: Armchair },
      { href: "/reservations", label: "Reservations", icon: CalendarCheck },
      { href: "/kds", label: "Kitchen", icon: ChefHat },
      { href: "/pos", label: "POS", icon: MonitorSmartphone },
      { href: "/menu", label: "Menu", icon: UtensilsCrossed },
    ],
  },
  {
    title: "Supply",
    items: [
      { href: "/inventory", label: "Inventory", icon: Package },
      { href: "/recipes", label: "Recipes", icon: BookOpenText },
      { href: "/suppliers", label: "Suppliers", icon: Truck },
      { href: "/purchase-orders", label: "Purchase Orders", icon: ShoppingCart },
    ],
  },
  {
    title: "People",
    items: [
      { href: "/employees", label: "Employees", icon: BadgeCheck },
      { href: "/attendance", label: "Attendance", icon: CalendarClock },
      { href: "/kiosk", label: "Face Kiosk", icon: ScanFace },
      { href: "/shifts", label: "Shifts", icon: CalendarRange },
      { href: "/leave", label: "Leave", icon: Plane },
      { href: "/payroll", label: "Payroll", icon: Wallet },
    ],
  },
  {
    title: "Guests",
    items: [
      { href: "/customers", label: "Customers", icon: Users },
      { href: "/loyalty", label: "Loyalty", icon: Star },
      { href: "/feedback", label: "Feedback", icon: MessageSquareText },
      { href: "/qr", label: "QR Ordering", icon: QrCode },
    ],
  },
  {
    title: "Insights",
    items: [
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/reports", label: "Reports", icon: FileText },
      { href: "/branches", label: "Branches", icon: Store },
      { href: "/audit-logs", label: "Audit Logs", icon: ScrollText },
    ],
  },
];

export const FOOTER_NAV: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings },
];

// Bottom nav for mobile (top-priority destinations)
export const MOBILE_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ListOrdered },
  { href: "/pos", label: "POS", icon: MonitorSmartphone },
  { href: "/tables", label: "Tables", icon: Armchair },
];

export interface ExperienceDef {
  key: string;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

export const EXPERIENCES: ExperienceDef[] = [
  { key: "owner", label: "Owner / Admin", description: "Full management dashboard", href: "/", icon: LayoutDashboard },
  { key: "manager", label: "Manager Operations", description: "Live orders & floor control", href: "/orders", icon: ListOrdered },
  { key: "pos", label: "POS Terminal", description: "Point of sale checkout", href: "/pos", icon: MonitorSmartphone },
  { key: "kitchen", label: "Kitchen Display", description: "KDS ticket screen", href: "/kds", icon: ChefHat },
  { key: "kiosk", label: "Attendance Kiosk", description: "Face punch-in kiosk", href: "/kiosk", icon: ScanFace },
  { key: "qr", label: "Customer QR Ordering", description: "Guest mobile ordering", href: "/qr", icon: QrCode },
  { key: "employee", label: "Employee Mobile", description: "Staff mobile app", href: "/mobile", icon: Smartphone },
];
