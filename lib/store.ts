"use client";

// ─── Central RestroOS store: single source of truth persisted to localStorage ─

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  AppSettings,
  AttendanceRecord,
  AuditLog,
  Branch,
  Customer,
  DiningTable,
  Employee,
  Feedback,
  ID,
  InventoryItem,
  LeaveRequest,
  MenuCategory,
  MenuItem,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PayrollRecord,
  PurchaseOrder,
  Recipe,
  Reservation,
  ReservationStatus,
  Shift,
  Supplier,
  TableStatus,
} from "./types";
import {
  ATTENDANCE,
  AUDIT_LOGS,
  BRANCHES,
  CUSTOMERS,
  EMPLOYEES,
  FEEDBACK,
  INVENTORY,
  LEAVE_REQUESTS,
  MENU_CATEGORIES,
  MENU_ITEMS,
  NEXT_ORDER_NUMBER,
  ORDERS,
  PAYROLL,
  PURCHASE_ORDERS,
  RECIPES,
  RESERVATIONS,
  SETTINGS,
  SHIFTS,
  SUPPLIERS,
} from "./seed";

export const STORAGE_KEY = "restroos-demo-v1";

let idCounter = 0;
export const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${(idCounter++).toString(36)}`;

const nowIso = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);
const nowHm = () =>
  new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export interface DataState {
  orders: Order[];
  nextOrderNumber: number;
  tables: DiningTable[];
  reservations: Reservation[];
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  inventory: InventoryItem[];
  recipes: Recipe[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  employees: Employee[];
  attendance: AttendanceRecord[];
  shifts: Shift[];
  leaveRequests: LeaveRequest[];
  payroll: PayrollRecord[];
  customers: Customer[];
  feedback: Feedback[];
  branches: Branch[];
  auditLogs: AuditLog[];
  settings: AppSettings;
}

const seedState = (): DataState => ({
  orders: ORDERS,
  nextOrderNumber: NEXT_ORDER_NUMBER,
  tables: TABLES_SEED(),
  reservations: RESERVATIONS,
  menuCategories: MENU_CATEGORIES,
  menuItems: MENU_ITEMS,
  inventory: INVENTORY,
  recipes: RECIPES,
  suppliers: SUPPLIERS,
  purchaseOrders: PURCHASE_ORDERS,
  employees: EMPLOYEES,
  attendance: ATTENDANCE,
  shifts: SHIFTS,
  leaveRequests: LEAVE_REQUESTS,
  payroll: PAYROLL,
  customers: CUSTOMERS,
  feedback: FEEDBACK,
  branches: BRANCHES,
  auditLogs: AUDIT_LOGS,
  settings: SETTINGS,
});

// tables import indirection so seed stays tree-shaken cleanly
import { TABLES } from "./seed";
const TABLES_SEED = () => TABLES;

export interface StoreActions {
  // audit helper
  log: (actor: string, action: string, module: string, detail: string, severity?: AuditLog["severity"]) => void;

  // orders
  createOrder: (input: {
    channel: Order["channel"];
    items: OrderItem[];
    tableId?: ID;
    customerId?: ID;
    customerName?: string;
    notes?: string;
    discount?: number;
  }) => Order;
  setOrderStatus: (orderId: ID, status: OrderStatus) => void;
  setOrderItemKitchenStatus: (orderId: ID, itemIndex: number, status: OrderItem["kitchenStatus"]) => void;
  payOrder: (orderId: ID, method: PaymentMethod) => void;
  cancelOrder: (orderId: ID) => void;

  // tables
  setTableStatus: (tableId: ID, status: TableStatus) => void;
  addTable: (t: Omit<DiningTable, "id">) => void;
  updateTable: (id: ID, patch: Partial<DiningTable>) => void;
  deleteTable: (id: ID) => void;

  // reservations
  addReservation: (r: Omit<Reservation, "id" | "status"> & { status?: ReservationStatus }) => void;
  updateReservation: (id: ID, patch: Partial<Reservation>) => void;
  deleteReservation: (id: ID) => void;
  seatReservation: (id: ID) => void;

  // menu
  addMenuItem: (m: Omit<MenuItem, "id">) => void;
  updateMenuItem: (id: ID, patch: Partial<MenuItem>) => void;
  deleteMenuItem: (id: ID) => void;
  addMenuCategory: (name: string) => void;
  deleteMenuCategory: (id: ID) => void;

  // inventory
  addInventoryItem: (i: Omit<InventoryItem, "id">) => void;
  updateInventoryItem: (id: ID, patch: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: ID) => void;
  adjustStock: (id: ID, delta: number, reason: string, actor?: string) => void;

  // recipes
  addRecipe: (r: Omit<Recipe, "id">) => void;
  updateRecipe: (id: ID, patch: Partial<Recipe>) => void;
  deleteRecipe: (id: ID) => void;

  // suppliers
  addSupplier: (s: Omit<Supplier, "id">) => void;
  updateSupplier: (id: ID, patch: Partial<Supplier>) => void;
  deleteSupplier: (id: ID) => void;

  // purchase orders
  addPurchaseOrder: (po: Omit<PurchaseOrder, "id" | "number" | "createdAt" | "total">) => void;
  updatePurchaseOrder: (id: ID, patch: Partial<PurchaseOrder>) => void;
  setPurchaseOrderStatus: (id: ID, status: PurchaseOrder["status"]) => void;
  deletePurchaseOrder: (id: ID) => void;

  // employees
  addEmployee: (e: Omit<Employee, "id">) => void;
  updateEmployee: (id: ID, patch: Partial<Employee>) => void;
  deleteEmployee: (id: ID) => void;

  // attendance
  punchIn: (employeeId: ID, method: AttendanceRecord["method"]) => { ok: boolean; message: string };
  punchOut: (employeeId: ID) => { ok: boolean; message: string };

  // shifts
  addShift: (s: Omit<Shift, "id">) => void;
  updateShift: (id: ID, patch: Partial<Shift>) => void;
  deleteShift: (id: ID) => void;

  // leave
  addLeaveRequest: (l: Omit<LeaveRequest, "id" | "status" | "requestedAt">) => void;
  setLeaveStatus: (id: ID, status: LeaveRequest["status"]) => void;

  // payroll
  setPayrollStatus: (id: ID, status: PayrollRecord["status"]) => void;
  processPayrollPeriod: (period: string) => void;

  // customers
  addCustomer: (c: Omit<Customer, "id" | "joinedAt" | "visits" | "totalSpent" | "loyaltyPoints" | "tier">) => void;
  updateCustomer: (id: ID, patch: Partial<Customer>) => void;
  deleteCustomer: (id: ID) => void;
  adjustLoyaltyPoints: (id: ID, delta: number, reason: string) => void;

  // feedback
  setFeedbackStatus: (id: ID, status: Feedback["status"]) => void;
  addFeedback: (f: Omit<Feedback, "id" | "date" | "status">) => void;

  // branches
  addBranch: (b: Omit<Branch, "id">) => void;
  updateBranch: (id: ID, patch: Partial<Branch>) => void;

  // settings
  updateSettings: (patch: Partial<AppSettings>) => void;

  // demo data management
  resetDemo: () => void;
  exportJson: () => string;
  importJson: (json: string) => { ok: boolean; message: string };
}

export type RestroStore = DataState & StoreActions;

const tierFor = (points: number): Customer["tier"] =>
  points >= 3000 ? "Platinum" : points >= 1200 ? "Gold" : points >= 400 ? "Silver" : "Bronze";

const computeTotals = (items: OrderItem[], discount: number, taxRate: number) => {
  const subtotal = Math.round(items.reduce((s, it) => s + it.price * it.qty, 0) * 100) / 100;
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const total = Math.round((subtotal + tax - discount) * 100) / 100;
  return { subtotal, tax, discount, total };
};

export const useRestro = create<RestroStore>()(
  persist(
    (set, get) => ({
      ...seedState(),

      log: (actor, action, module, detail, severity = "info") =>
        set((s) => ({
          auditLogs: [
            { id: uid("al"), at: nowIso(), actor, action, module, detail, severity },
            ...s.auditLogs,
          ].slice(0, 300),
        })),

      // ── Orders ──────────────────────────────────────────────────────────
      createOrder: (input) => {
        const s = get();
        const totals = computeTotals(input.items, input.discount ?? 0, s.settings.taxRate);
        const order: Order = {
          id: uid("ord"),
          number: s.nextOrderNumber,
          channel: input.channel,
          status: "new",
          tableId: input.tableId,
          customerId: input.customerId,
          customerName: input.customerName,
          items: input.items,
          notes: input.notes,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          branchId: s.settings.activeBranchId,
          ...totals,
        };
        set((st) => ({
          orders: [order, ...st.orders],
          nextOrderNumber: st.nextOrderNumber + 1,
          // occupy table if dine-in / qr with table
          tables: input.tableId
            ? st.tables.map((t) =>
                t.id === input.tableId
                  ? { ...t, status: "occupied" as const, currentOrderId: order.id, occupiedSince: t.occupiedSince ?? nowIso() }
                  : t,
              )
            : st.tables,
          // decrement menu stock
          menuItems: st.menuItems.map((m) => {
            const line = input.items.find((it) => it.menuItemId === m.id);
            if (!line || !m.trackStock) return m;
            const stock = Math.max(0, m.stock - line.qty);
            return { ...m, stock, available: stock > 0 ? m.available : false };
          }),
        }));
        get().log(
          input.channel === "qr" ? "QR Guest" : "POS",
          "ORDER_CREATED",
          "Orders",
          `Order #${order.number} created (${input.channel}) — $${order.total.toFixed(2)}`,
        );
        return order;
      },

      setOrderStatus: (orderId, status) =>
        set((s) => {
          const order = s.orders.find((o) => o.id === orderId);
          if (!order) return {};
          const orders = s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status,
                  updatedAt: nowIso(),
                  items:
                    status === "ready" || status === "served"
                      ? o.items.map((it) => ({ ...it, kitchenStatus: "done" as const }))
                      : status === "preparing"
                        ? o.items.map((it) =>
                            it.kitchenStatus === "queued" ? { ...it, kitchenStatus: "cooking" as const } : it,
                          )
                        : o.items,
                }
              : o,
          );
          return { orders };
        }),

      setOrderItemKitchenStatus: (orderId, itemIndex, status) =>
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== orderId) return o;
            const items = o.items.map((it, i) => (i === itemIndex ? { ...it, kitchenStatus: status } : it));
            const allDone = items.every((it) => it.kitchenStatus === "done");
            const anyCooking = items.some((it) => it.kitchenStatus !== "queued");
            return {
              ...o,
              items,
              updatedAt: nowIso(),
              status: allDone && (o.status === "preparing" || o.status === "new")
                ? "ready"
                : anyCooking && o.status === "new"
                  ? "preparing"
                  : o.status,
            };
          }),
        })),

      payOrder: (orderId, method) => {
        const s = get();
        const order = s.orders.find((o) => o.id === orderId);
        if (!order) return;
        set((st) => ({
          orders: st.orders.map((o) =>
            o.id === orderId
              ? { ...o, status: "paid" as const, paidAt: nowIso(), paymentMethod: method, updatedAt: nowIso() }
              : o,
          ),
          tables: order.tableId
            ? st.tables.map((t) =>
                t.id === order.tableId
                  ? { ...t, status: "dirty" as const, currentOrderId: undefined, occupiedSince: undefined, server: undefined }
                  : t,
              )
            : st.tables,
          customers: order.customerId
            ? st.customers.map((c) => {
                if (c.id !== order.customerId) return c;
                const points = c.loyaltyPoints + Math.round(order.total * st.settings.loyaltyEarnRate);
                return {
                  ...c,
                  visits: c.visits + 1,
                  totalSpent: Math.round((c.totalSpent + order.total) * 100) / 100,
                  loyaltyPoints: points,
                  tier: tierFor(points),
                  lastVisit: today(),
                };
              })
            : st.customers,
        }));
        get().log("POS", "ORDER_PAID", "Orders", `Order #${order.number} paid $${order.total.toFixed(2)} via ${method}`);
      },

      cancelOrder: (orderId) => {
        const s = get();
        const order = s.orders.find((o) => o.id === orderId);
        if (!order) return;
        set((st) => ({
          orders: st.orders.map((o) =>
            o.id === orderId ? { ...o, status: "cancelled" as const, updatedAt: nowIso() } : o,
          ),
          tables: order.tableId
            ? st.tables.map((t) =>
                t.id === order.tableId
                  ? { ...t, status: "available" as const, currentOrderId: undefined, occupiedSince: undefined }
                  : t,
              )
            : st.tables,
        }));
        get().log("POS", "ORDER_CANCELLED", "Orders", `Order #${order.number} cancelled`, "warning");
      },

      // ── Tables ──────────────────────────────────────────────────────────
      setTableStatus: (tableId, status) =>
        set((s) => ({
          tables: s.tables.map((t) =>
            t.id === tableId
              ? {
                  ...t,
                  status,
                  currentOrderId: status === "available" || status === "dirty" ? undefined : t.currentOrderId,
                  occupiedSince: status === "occupied" ? (t.occupiedSince ?? nowIso()) : undefined,
                }
              : t,
          ),
        })),
      addTable: (t) => set((s) => ({ tables: [...s.tables, { ...t, id: uid("tb") }] })),
      updateTable: (id, patch) =>
        set((s) => ({ tables: s.tables.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      deleteTable: (id) => set((s) => ({ tables: s.tables.filter((t) => t.id !== id) })),

      // ── Reservations ────────────────────────────────────────────────────
      addReservation: (r) => {
        set((s) => ({
          reservations: [{ ...r, id: uid("rsv"), status: r.status ?? "pending" }, ...s.reservations],
          tables: r.tableId
            ? s.tables.map((t) => (t.id === r.tableId && t.status === "available" ? { ...t, status: "reserved" as const } : t))
            : s.tables,
        }));
        get().log("Front Desk", "RESERVATION_CREATED", "Reservations", `Reservation for ${r.customerName} (${r.partySize}p) on ${r.date} ${r.time}`);
      },
      updateReservation: (id, patch) =>
        set((s) => ({ reservations: s.reservations.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      deleteReservation: (id) =>
        set((s) => ({ reservations: s.reservations.filter((r) => r.id !== id) })),
      seatReservation: (id) => {
        const r = get().reservations.find((x) => x.id === id);
        if (!r) return;
        set((s) => ({
          reservations: s.reservations.map((x) => (x.id === id ? { ...x, status: "seated" as const } : x)),
          tables: r.tableId
            ? s.tables.map((t) =>
                t.id === r.tableId ? { ...t, status: "occupied" as const, occupiedSince: nowIso() } : t,
              )
            : s.tables,
        }));
        get().log("Front Desk", "RESERVATION_SEATED", "Reservations", `${r.customerName} seated${r.tableId ? "" : " (walk-in table)"}`);
      },

      // ── Menu ────────────────────────────────────────────────────────────
      addMenuItem: (m) => {
        set((s) => ({ menuItems: [...s.menuItems, { ...m, id: uid("mi") }] }));
        get().log("Manager", "MENU_ITEM_ADDED", "Menu", `Added menu item "${m.name}" at $${m.price.toFixed(2)}`);
      },
      updateMenuItem: (id, patch) =>
        set((s) => ({ menuItems: s.menuItems.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      deleteMenuItem: (id) => {
        const item = get().menuItems.find((m) => m.id === id);
        set((s) => ({ menuItems: s.menuItems.filter((m) => m.id !== id) }));
        if (item) get().log("Manager", "MENU_ITEM_DELETED", "Menu", `Deleted "${item.name}"`, "warning");
      },
      addMenuCategory: (name) =>
        set((s) => ({
          menuCategories: [...s.menuCategories, { id: uid("cat"), name, sortOrder: s.menuCategories.length + 1 }],
        })),
      deleteMenuCategory: (id) =>
        set((s) => ({ menuCategories: s.menuCategories.filter((c) => c.id !== id) })),

      // ── Inventory ───────────────────────────────────────────────────────
      addInventoryItem: (i) => set((s) => ({ inventory: [...s.inventory, { ...i, id: uid("inv") }] })),
      updateInventoryItem: (id, patch) =>
        set((s) => ({ inventory: s.inventory.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),
      deleteInventoryItem: (id) =>
        set((s) => ({ inventory: s.inventory.filter((i) => i.id !== id) })),
      adjustStock: (id, delta, reason, actor = "Manager") => {
        const item = get().inventory.find((i) => i.id === id);
        if (!item) return;
        const stock = Math.max(0, Math.round((item.stock + delta) * 100) / 100);
        set((s) => ({ inventory: s.inventory.map((i) => (i.id === id ? { ...i, stock } : i)) }));
        get().log(actor, "STOCK_ADJUST", "Inventory", `${item.name}: ${item.stock} → ${stock} (${reason})`, stock < item.minStock ? "warning" : "info");
      },

      // ── Recipes ─────────────────────────────────────────────────────────
      addRecipe: (r) => set((s) => ({ recipes: [...s.recipes, { ...r, id: uid("rcp") }] })),
      updateRecipe: (id, patch) =>
        set((s) => ({ recipes: s.recipes.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      deleteRecipe: (id) => set((s) => ({ recipes: s.recipes.filter((r) => r.id !== id) })),

      // ── Suppliers ───────────────────────────────────────────────────────
      addSupplier: (sp) => set((s) => ({ suppliers: [...s.suppliers, { ...sp, id: uid("sup") }] })),
      updateSupplier: (id, patch) =>
        set((s) => ({ suppliers: s.suppliers.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteSupplier: (id) => set((s) => ({ suppliers: s.suppliers.filter((x) => x.id !== id) })),

      // ── Purchase orders ─────────────────────────────────────────────────
      addPurchaseOrder: (po) => {
        const s = get();
        const num = 1043 + s.purchaseOrders.length;
        const total = Math.round(po.lines.reduce((t, l) => t + l.qty * l.unitCost, 0) * 100) / 100;
        set((st) => ({
          purchaseOrders: [
            { ...po, id: uid("po"), number: `PO-${num}`, createdAt: nowIso(), total },
            ...st.purchaseOrders,
          ],
        }));
        get().log("Manager", "PO_CREATED", "Purchasing", `Created PO-${num} — $${total.toFixed(2)}`);
      },
      updatePurchaseOrder: (id, patch) =>
        set((s) => ({
          purchaseOrders: s.purchaseOrders.map((p) => {
            if (p.id !== id) return p;
            const merged = { ...p, ...patch };
            if (patch.lines) {
              merged.total = Math.round(patch.lines.reduce((t, l) => t + l.qty * l.unitCost, 0) * 100) / 100;
            }
            return merged;
          }),
        })),
      setPurchaseOrderStatus: (id, status) => {
        const po = get().purchaseOrders.find((p) => p.id === id);
        if (!po) return;
        set((s) => ({
          purchaseOrders: s.purchaseOrders.map((p) =>
            p.id === id ? { ...p, status, receivedAt: status === "received" ? nowIso() : p.receivedAt } : p,
          ),
          // receiving a PO restocks inventory
          inventory:
            status === "received"
              ? s.inventory.map((i) => {
                  const line = po.lines.find((l) => l.inventoryItemId === i.id);
                  return line ? { ...i, stock: Math.round((i.stock + line.qty) * 100) / 100 } : i;
                })
              : s.inventory,
        }));
        get().log("Manager", "PO_STATUS", "Purchasing", `${po.number} → ${status}`, status === "cancelled" ? "warning" : "info");
      },
      deletePurchaseOrder: (id) =>
        set((s) => ({ purchaseOrders: s.purchaseOrders.filter((p) => p.id !== id) })),

      // ── Employees ───────────────────────────────────────────────────────
      addEmployee: (e) => {
        set((s) => ({ employees: [...s.employees, { ...e, id: uid("emp") }] }));
        get().log("HR", "EMPLOYEE_ADDED", "Employees", `Added ${e.name} (${e.role})`);
      },
      updateEmployee: (id, patch) =>
        set((s) => ({ employees: s.employees.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      deleteEmployee: (id) => {
        const e = get().employees.find((x) => x.id === id);
        set((s) => ({ employees: s.employees.filter((x) => x.id !== id) }));
        if (e) get().log("HR", "EMPLOYEE_REMOVED", "Employees", `Removed ${e.name}`, "warning");
      },

      // ── Attendance ──────────────────────────────────────────────────────
      punchIn: (employeeId, method) => {
        const s = get();
        const emp = s.employees.find((e) => e.id === employeeId);
        if (!emp) return { ok: false, message: "Employee not found" };
        const existing = s.attendance.find((a) => a.employeeId === employeeId && a.date === today());
        if (existing?.clockIn && !existing.clockOut)
          return { ok: false, message: `${emp.name} is already clocked in (${existing.clockIn})` };
        if (existing?.clockOut)
          return { ok: false, message: `${emp.name} already completed today's shift` };
        const shift = s.shifts.find((sh) => sh.employeeId === employeeId && sh.date === today());
        const hm = nowHm();
        const late = shift ? hm > shift.start : false;
        const rec: AttendanceRecord = {
          id: uid("att"),
          employeeId,
          date: today(),
          clockIn: hm,
          method,
          status: late ? "late" : "present",
          branchId: s.settings.activeBranchId,
        };
        set((st) => ({ attendance: [rec, ...st.attendance] }));
        get().log(emp.name, "PUNCH_IN", "Attendance", `${emp.name} clocked in at ${hm} via ${method}${late ? " (late)" : ""}`, late ? "warning" : "info");
        return { ok: true, message: `Welcome, ${emp.name.split(" ")[0]}! Clocked in at ${hm}${late ? " — marked late" : ""}` };
      },
      punchOut: (employeeId) => {
        const s = get();
        const emp = s.employees.find((e) => e.id === employeeId);
        if (!emp) return { ok: false, message: "Employee not found" };
        const rec = s.attendance.find((a) => a.employeeId === employeeId && a.date === today() && a.clockIn && !a.clockOut);
        if (!rec) return { ok: false, message: `${emp.name} is not clocked in` };
        const hm = nowHm();
        set((st) => ({
          attendance: st.attendance.map((a) => (a.id === rec.id ? { ...a, clockOut: hm } : a)),
        }));
        get().log(emp.name, "PUNCH_OUT", "Attendance", `${emp.name} clocked out at ${hm}`);
        return { ok: true, message: `Goodbye, ${emp.name.split(" ")[0]}! Clocked out at ${hm}` };
      },

      // ── Shifts ──────────────────────────────────────────────────────────
      addShift: (sh) => set((s) => ({ shifts: [...s.shifts, { ...sh, id: uid("sh") }] })),
      updateShift: (id, patch) =>
        set((s) => ({ shifts: s.shifts.map((sh) => (sh.id === id ? { ...sh, ...patch } : sh)) })),
      deleteShift: (id) => set((s) => ({ shifts: s.shifts.filter((sh) => sh.id !== id) })),

      // ── Leave ───────────────────────────────────────────────────────────
      addLeaveRequest: (l) => {
        set((s) => ({
          leaveRequests: [{ ...l, id: uid("lv"), status: "pending" as const, requestedAt: nowIso() }, ...s.leaveRequests],
        }));
        const emp = get().employees.find((e) => e.id === l.employeeId);
        get().log(emp?.name ?? "Employee", "LEAVE_REQUESTED", "Leave", `${emp?.name ?? "Employee"} requested ${l.type} leave ${l.from} → ${l.to}`);
      },
      setLeaveStatus: (id, status) => {
        const lv = get().leaveRequests.find((l) => l.id === id);
        set((s) => ({
          leaveRequests: s.leaveRequests.map((l) => (l.id === id ? { ...l, status } : l)),
          employees:
            lv && status === "approved"
              ? s.employees.map((e) => (e.id === lv.employeeId ? { ...e, status: "on-leave" as const } : e))
              : s.employees,
        }));
        if (lv) {
          const emp = get().employees.find((e) => e.id === lv.employeeId);
          get().log("Manager", "LEAVE_" + status.toUpperCase(), "Leave", `${emp?.name ?? "Employee"}'s ${lv.type} leave ${status}`);
        }
      },

      // ── Payroll ─────────────────────────────────────────────────────────
      setPayrollStatus: (id, status) =>
        set((s) => ({ payroll: s.payroll.map((p) => (p.id === id ? { ...p, status } : p)) })),
      processPayrollPeriod: (period) => {
        set((s) => ({
          payroll: s.payroll.map((p) => (p.period === period && p.status === "draft" ? { ...p, status: "processed" as const } : p)),
        }));
        get().log("Manager", "PAYROLL_PROCESSED", "Payroll", `Processed payroll for period ${period}`);
      },

      // ── Customers ───────────────────────────────────────────────────────
      addCustomer: (c) =>
        set((s) => ({
          customers: [
            { ...c, id: uid("cus"), joinedAt: today(), visits: 0, totalSpent: 0, loyaltyPoints: 0, tier: "Bronze" as const },
            ...s.customers,
          ],
        })),
      updateCustomer: (id, patch) =>
        set((s) => ({ customers: s.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      deleteCustomer: (id) => set((s) => ({ customers: s.customers.filter((c) => c.id !== id) })),
      adjustLoyaltyPoints: (id, delta, reason) => {
        const c = get().customers.find((x) => x.id === id);
        if (!c) return;
        const points = Math.max(0, c.loyaltyPoints + delta);
        set((s) => ({
          customers: s.customers.map((x) => (x.id === id ? { ...x, loyaltyPoints: points, tier: tierFor(points) } : x)),
        }));
        get().log("Manager", "LOYALTY_ADJUST", "Loyalty", `${c.name}: ${delta > 0 ? "+" : ""}${delta} pts (${reason})`);
      },

      // ── Feedback ────────────────────────────────────────────────────────
      setFeedbackStatus: (id, status) =>
        set((s) => ({ feedback: s.feedback.map((f) => (f.id === id ? { ...f, status } : f)) })),
      addFeedback: (f) =>
        set((s) => ({
          feedback: [{ ...f, id: uid("fb"), date: today(), status: "new" as const }, ...s.feedback],
        })),

      // ── Branches ────────────────────────────────────────────────────────
      addBranch: (b) => set((s) => ({ branches: [...s.branches, { ...b, id: uid("br") }] })),
      updateBranch: (id, patch) =>
        set((s) => ({ branches: s.branches.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),

      // ── Settings ────────────────────────────────────────────────────────
      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      // ── Demo data management ────────────────────────────────────────────
      resetDemo: () => set(() => seedState(), false),
      exportJson: () => {
        const s = get();
        const data: DataState = {
          orders: s.orders,
          nextOrderNumber: s.nextOrderNumber,
          tables: s.tables,
          reservations: s.reservations,
          menuCategories: s.menuCategories,
          menuItems: s.menuItems,
          inventory: s.inventory,
          recipes: s.recipes,
          suppliers: s.suppliers,
          purchaseOrders: s.purchaseOrders,
          employees: s.employees,
          attendance: s.attendance,
          shifts: s.shifts,
          leaveRequests: s.leaveRequests,
          payroll: s.payroll,
          customers: s.customers,
          feedback: s.feedback,
          branches: s.branches,
          auditLogs: s.auditLogs,
          settings: s.settings,
        };
        return JSON.stringify({ app: "restroos-demo", version: 1, exportedAt: nowIso(), data }, null, 2);
      },
      importJson: (json) => {
        try {
          const parsed = JSON.parse(json);
          const data: Partial<DataState> = parsed?.data ?? parsed;
          if (!data || !Array.isArray(data.orders) || !Array.isArray(data.menuItems)) {
            return { ok: false, message: "File doesn't look like a RestroOS export." };
          }
          set(() => ({ ...seedState(), ...data }));
          return { ok: true, message: "Demo data imported successfully." };
        } catch {
          return { ok: false, message: "Invalid JSON file." };
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

// ── Selectors / derived helpers ────────────────────────────────────────────

export const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export const timeAgo = (isoStr: string) => {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(isoStr).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ${mins % 60}m ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export const elapsedMmSs = (isoStr: string) => {
  const secs = Math.max(0, Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000));
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export const elapsedMins = (isoStr: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(isoStr).getTime()) / 60000));
