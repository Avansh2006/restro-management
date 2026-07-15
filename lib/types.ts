// ─── RestroOS shared domain types ────────────────────────────────────────────

export type ID = string;

// Orders
export type OrderChannel = "dine-in" | "takeaway" | "delivery" | "qr";
export type OrderStatus = "new" | "preparing" | "ready" | "served" | "paid" | "cancelled";
export type PaymentMethod = "card" | "cash" | "wallet" | "points";

export interface OrderItem {
  menuItemId: ID;
  name: string;
  price: number;
  qty: number;
  notes?: string;
  modifiers?: string[];
  kitchenStatus: "queued" | "cooking" | "done";
}

export interface Order {
  id: ID;
  number: number;
  channel: OrderChannel;
  status: OrderStatus;
  tableId?: ID;
  customerId?: ID;
  customerName?: string;
  items: OrderItem[];
  notes?: string;
  createdAt: string; // ISO
  updatedAt: string;
  paidAt?: string;
  paymentMethod?: PaymentMethod;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  branchId: ID;
}

// Tables
export type TableStatus = "available" | "occupied" | "reserved" | "dirty";
export type TableZone = "Main Dining" | "Patio" | "Bar Area";

export interface DiningTable {
  id: ID;
  name: string; // T-01
  seats: number;
  zone: TableZone;
  status: TableStatus;
  shape: "square" | "round" | "booth";
  currentOrderId?: ID;
  server?: string;
  occupiedSince?: string;
  branchId: ID;
}

// Reservations
export type ReservationStatus = "pending" | "confirmed" | "seated" | "completed" | "cancelled" | "no-show";

export interface Reservation {
  id: ID;
  customerName: string;
  phone: string;
  partySize: number;
  tableId?: ID;
  date: string; // yyyy-mm-dd
  time: string; // HH:mm
  status: ReservationStatus;
  notes?: string;
  branchId: ID;
}

// Menu
export interface MenuCategory {
  id: ID;
  name: string;
  sortOrder: number;
}

export interface MenuItem {
  id: ID;
  name: string;
  description: string;
  categoryId: ID;
  price: number;
  image?: string;
  station: "Grill" | "Cold" | "Saute" | "Bar" | "Pastry" | "Fry";
  available: boolean;
  trackStock: boolean;
  stock: number;
  popular?: boolean;
  taxRate: number; // e.g. 0.08
  modifiers?: string[];
}

// Inventory
export type InventoryCategory = "Produce" | "Meat" | "Dairy" | "Dry Goods" | "Beverage" | "Seafood";
export type InventoryUnit = "kg" | "g" | "L" | "ml" | "pcs" | "box";

export interface InventoryItem {
  id: ID;
  name: string;
  category: InventoryCategory;
  unit: InventoryUnit;
  stock: number;
  minStock: number;
  costPerUnit: number;
  supplierId?: ID;
  branchId: ID;
}

// Recipes
export interface RecipeIngredient {
  inventoryItemId: ID;
  qty: number;
}

export interface Recipe {
  id: ID;
  menuItemId: ID;
  name: string;
  yieldQty: number;
  prepMinutes: number;
  instructions: string[];
  ingredients: RecipeIngredient[];
}

// Suppliers
export interface Supplier {
  id: ID;
  name: string;
  contact: string;
  phone: string;
  email: string;
  categories: InventoryCategory[];
  rating: number; // 1-5
  active: boolean;
}

// Purchase orders
export type PurchaseOrderStatus = "draft" | "sent" | "confirmed" | "received" | "cancelled";

export interface PurchaseOrderLine {
  inventoryItemId: ID;
  name: string;
  qty: number;
  unitCost: number;
}

export interface PurchaseOrder {
  id: ID;
  number: string; // PO-1042
  supplierId: ID;
  status: PurchaseOrderStatus;
  lines: PurchaseOrderLine[];
  createdAt: string;
  expectedAt?: string;
  receivedAt?: string;
  total: number;
  branchId: ID;
}

// Employees / HR
export type EmployeeRole =
  | "Owner"
  | "Manager"
  | "Head Chef"
  | "Sous Chef"
  | "Line Cook"
  | "Server"
  | "Senior Waiter"
  | "Bartender"
  | "Barista"
  | "Host"
  | "Cleaner";

export interface Employee {
  id: ID;
  code: string; // EMP-042
  name: string;
  role: EmployeeRole;
  email: string;
  phone: string;
  hourlyRate: number;
  hiredAt: string;
  status: "active" | "on-leave" | "terminated";
  rating: number; // 1-5
  pin: string; // kiosk pin
  avatarColor: string;
  branchId: ID;
}

export interface AttendanceRecord {
  id: ID;
  employeeId: ID;
  date: string; // yyyy-mm-dd
  clockIn?: string; // HH:mm
  clockOut?: string;
  method: "kiosk" | "face" | "manual" | "mobile";
  status: "present" | "late" | "absent" | "half-day";
  branchId: ID;
}

export interface Shift {
  id: ID;
  employeeId: ID;
  date: string;
  start: string; // HH:mm
  end: string;
  role: string;
  status: "scheduled" | "in-progress" | "completed" | "missed";
  branchId: ID;
}

export type LeaveType = "vacation" | "sick" | "personal" | "unpaid";

export interface LeaveRequest {
  id: ID;
  employeeId: ID;
  type: LeaveType;
  from: string;
  to: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
}

export interface PayrollRecord {
  id: ID;
  employeeId: ID;
  period: string; // "2026-06"
  baseHours: number;
  overtimeHours: number;
  hourlyRate: number;
  bonus: number;
  deductions: number;
  gross: number;
  net: number;
  status: "draft" | "processed" | "paid";
}

// Customers / CRM
export type LoyaltyTier = "Bronze" | "Silver" | "Gold" | "Platinum";

export interface Customer {
  id: ID;
  name: string;
  phone: string;
  email: string;
  joinedAt: string;
  visits: number;
  totalSpent: number;
  loyaltyPoints: number;
  tier: LoyaltyTier;
  tags: string[];
  lastVisit?: string;
}

export interface Feedback {
  id: ID;
  customerId?: ID;
  customerName: string;
  rating: number; // 1-5
  comment: string;
  category: "food" | "service" | "ambience" | "value";
  date: string;
  status: "new" | "responded" | "archived";
  orderId?: ID;
}

// Branches
export interface Branch {
  id: ID;
  name: string;
  address: string;
  phone: string;
  manager: string;
  status: "open" | "closed";
  openingHours: string;
}

// Audit
export interface AuditLog {
  id: ID;
  at: string; // ISO
  actor: string;
  action: string;
  module: string;
  detail: string;
  severity: "info" | "warning" | "critical";
}

// Settings
export interface AppSettings {
  restaurantName: string;
  currency: string;
  taxRate: number;
  serviceCharge: number;
  activeBranchId: ID;
  kdsWarnMinutes: number;
  kdsCriticalMinutes: number;
  loyaltyEarnRate: number; // points per $1
  loyaltyRedeemValue: number; // $ per point
  notifications: {
    lowStock: boolean;
    newOrders: boolean;
    reservations: boolean;
  };
}

export type Experience =
  | "owner"
  | "manager"
  | "pos"
  | "kitchen"
  | "kiosk"
  | "qr"
  | "employee";
