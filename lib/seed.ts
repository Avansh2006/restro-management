// ─── Seed data for the RestroOS demo ─────────────────────────────────────────
// Dates are generated relative to "now" so the demo always feels live.

import type {
  AppSettings,
  AttendanceRecord,
  AuditLog,
  Branch,
  Customer,
  DiningTable,
  Employee,
  Feedback,
  InventoryItem,
  LeaveRequest,
  MenuCategory,
  MenuItem,
  Order,
  PayrollRecord,
  PurchaseOrder,
  Recipe,
  Reservation,
  Shift,
  Supplier,
} from "./types";

const now = () => new Date();
const iso = (d: Date) => d.toISOString();
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const minsAgo = (m: number) => iso(new Date(Date.now() - m * 60000));
const daysAgo = (n: number) => {
  const d = now();
  d.setDate(d.getDate() - n);
  return ymd(d);
};
const daysAhead = (n: number) => {
  const d = now();
  d.setDate(d.getDate() + n);
  return ymd(d);
};

export const BRANCHES: Branch[] = [
  {
    id: "br-1",
    name: "Downtown Branch",
    address: "412 Market Street, San Francisco, CA",
    phone: "(415) 555-0134",
    manager: "Marcus Pierce",
    status: "open",
    openingHours: "11:00 – 23:00",
  },
  {
    id: "br-2",
    name: "Harbor View",
    address: "88 Embarcadero Plaza, San Francisco, CA",
    phone: "(415) 555-0177",
    manager: "Elena Rodriguez",
    status: "open",
    openingHours: "12:00 – 22:00",
  },
  {
    id: "br-3",
    name: "Uptown Kitchen",
    address: "2201 Fillmore Street, San Francisco, CA",
    phone: "(415) 555-0198",
    manager: "David Kim",
    status: "closed",
    openingHours: "17:00 – 23:00",
  },
];

export const MENU_CATEGORIES: MenuCategory[] = [
  { id: "cat-1", name: "Appetizers", sortOrder: 1 },
  { id: "cat-2", name: "Mains", sortOrder: 2 },
  { id: "cat-3", name: "Sides", sortOrder: 3 },
  { id: "cat-4", name: "Beverages", sortOrder: 4 },
  { id: "cat-5", name: "Desserts", sortOrder: 5 },
  { id: "cat-6", name: "Specials", sortOrder: 6 },
];

export const MENU_ITEMS: MenuItem[] = [
  { id: "mi-1", name: "Signature Wagyu Burger", description: "Wagyu beef, aged cheddar, truffle aioli, brioche bun", categoryId: "cat-2", price: 24.0, station: "Grill", available: true, trackStock: true, stock: 85, popular: true, taxRate: 0.08, modifiers: ["Extra Cheese", "No Onions", "Add Bacon", "Medium Rare", "Well Done"] },
  { id: "mi-2", name: "Black Truffle Pasta", description: "Pappardelle, creamy truffle sauce, shaved black truffle", categoryId: "cat-2", price: 28.5, station: "Saute", available: true, trackStock: true, stock: 42, popular: true, taxRate: 0.08, modifiers: ["Extra Truffle", "Gluten-Free Pasta"] },
  { id: "mi-3", name: "Seared Salmon Salad", description: "Atlantic salmon, organic greens, feta, lemon-herb vinaigrette", categoryId: "cat-2", price: 21.0, station: "Cold", available: true, trackStock: true, stock: 30, taxRate: 0.08, modifiers: ["Dressing on side", "No Feta"] },
  { id: "mi-4", name: "Artisan Margherita", description: "San Marzano tomato, buffalo mozzarella, fresh basil", categoryId: "cat-2", price: 18.5, station: "Grill", available: true, trackStock: true, stock: 60, popular: true, taxRate: 0.08, modifiers: ["Extra Crispy", "Add Pepperoni"] },
  { id: "mi-5", name: "Classic Fish & Chips", description: "Beer-battered cod, thick-cut chips, tartar sauce", categoryId: "cat-2", price: 21.0, station: "Fry", available: true, trackStock: true, stock: 25, taxRate: 0.08 },
  { id: "mi-6", name: "Ribeye Steak", description: "12oz prime ribeye, peppercorn sauce, herb butter", categoryId: "cat-2", price: 42.0, station: "Grill", available: true, trackStock: true, stock: 18, taxRate: 0.08, modifiers: ["Rare", "Medium Rare", "Medium", "Well Done", "Peppercorn Sauce"] },
  { id: "mi-7", name: "Pasta Carbonara", description: "Guanciale, pecorino romano, cracked black pepper", categoryId: "cat-2", price: 22.5, station: "Saute", available: true, trackStock: true, stock: 38, taxRate: 0.08 },
  { id: "mi-8", name: "Truffle Fries", description: "Hand-cut fries, truffle oil, shaved parmesan", categoryId: "cat-3", price: 12.5, station: "Fry", available: true, trackStock: true, stock: 90, popular: true, taxRate: 0.08, modifiers: ["Extra Parmesan", "Extra Sauce"] },
  { id: "mi-9", name: "Garlic Bread", description: "Sourdough, roasted garlic butter, herbs", categoryId: "cat-3", price: 8.0, station: "Pastry", available: true, trackStock: true, stock: 45, taxRate: 0.08 },
  { id: "mi-10", name: "Garden Avocado Salad", description: "Mixed greens, avocado, toasted walnuts, lemon vinaigrette", categoryId: "cat-1", price: 16.0, station: "Cold", available: true, trackStock: true, stock: 22, popular: true, taxRate: 0.08 },
  { id: "mi-11", name: "Caesar Salad", description: "Romaine, house dressing, sourdough croutons, parmesan", categoryId: "cat-1", price: 14.0, station: "Cold", available: true, trackStock: true, stock: 35, taxRate: 0.08, modifiers: ["Add Chicken", "Add Shrimp", "Dressing on side"] },
  { id: "mi-12", name: "Summer Berry Salad", description: "Arugula, strawberries, goat cheese, balsamic glaze", categoryId: "cat-1", price: 16.5, station: "Cold", available: true, trackStock: true, stock: 12, taxRate: 0.08 },
  { id: "mi-13", name: "Crispy Calamari", description: "Lightly fried, lemon aioli, pickled chili", categoryId: "cat-1", price: 15.0, station: "Fry", available: true, trackStock: true, stock: 28, taxRate: 0.08 },
  { id: "mi-14", name: "Coke Zero", description: "Chilled, served with ice & lemon", categoryId: "cat-4", price: 4.0, station: "Bar", available: true, trackStock: true, stock: 140, taxRate: 0.1 },
  { id: "mi-15", name: "Iced Hibiscus Tea", description: "House-brewed, lightly sweetened", categoryId: "cat-4", price: 5.5, station: "Bar", available: true, trackStock: true, stock: 80, taxRate: 0.1 },
  { id: "mi-16", name: "Smoked Old Fashioned", description: "Bourbon, smoked demerara, orange bitters", categoryId: "cat-4", price: 18.0, station: "Bar", available: false, trackStock: true, stock: 0, taxRate: 0.2 },
  { id: "mi-17", name: "Fresh Orange Juice", description: "Cold-pressed daily", categoryId: "cat-4", price: 6.5, station: "Bar", available: true, trackStock: true, stock: 55, taxRate: 0.1 },
  { id: "mi-18", name: "Molten Lava Cake", description: "Valrhona chocolate, vanilla bean ice cream", categoryId: "cat-5", price: 12.0, station: "Pastry", available: true, trackStock: true, stock: 45, popular: true, taxRate: 0.08 },
  { id: "mi-19", name: "Crème Brûlée", description: "Tahitian vanilla, caramelized sugar crust", categoryId: "cat-5", price: 11.0, station: "Pastry", available: true, trackStock: true, stock: 20, taxRate: 0.08 },
  { id: "mi-20", name: "Tiramisu", description: "Espresso-soaked ladyfingers, mascarpone cream", categoryId: "cat-5", price: 11.5, station: "Pastry", available: true, trackStock: true, stock: 16, taxRate: 0.08 },
  { id: "mi-21", name: "Chef's Tasting Board", description: "Rotating selection of the kitchen's best — ask your server", categoryId: "cat-6", price: 48.0, station: "Grill", available: true, trackStock: true, stock: 8, taxRate: 0.08 },
  { id: "mi-22", name: "Lobster Linguine", description: "Half Maine lobster, cherry tomato, chili, garlic", categoryId: "cat-6", price: 39.0, station: "Saute", available: true, trackStock: true, stock: 6, taxRate: 0.08 },
];

export const TABLES: DiningTable[] = [
  { id: "tb-1", name: "T-01", seats: 4, zone: "Main Dining", status: "occupied", shape: "square", currentOrderId: "ord-1", server: "Elena R.", occupiedSince: minsAgo(42), branchId: "br-1" },
  { id: "tb-2", name: "T-02", seats: 2, zone: "Main Dining", status: "available", shape: "square", branchId: "br-1" },
  { id: "tb-3", name: "T-03", seats: 6, zone: "Main Dining", status: "dirty", shape: "square", branchId: "br-1" },
  { id: "tb-4", name: "T-04", seats: 4, zone: "Main Dining", status: "reserved", shape: "square", branchId: "br-1" },
  { id: "tb-5", name: "T-05", seats: 8, zone: "Main Dining", status: "available", shape: "booth", branchId: "br-1" },
  { id: "tb-6", name: "T-06", seats: 2, zone: "Main Dining", status: "occupied", shape: "square", currentOrderId: "ord-3", server: "Sarah J.", occupiedSince: minsAgo(72), branchId: "br-1" },
  { id: "tb-7", name: "T-07", seats: 4, zone: "Main Dining", status: "available", shape: "square", branchId: "br-1" },
  { id: "tb-8", name: "T-08", seats: 4, zone: "Main Dining", status: "occupied", shape: "square", currentOrderId: "ord-5", server: "Elena R.", occupiedSince: minsAgo(15), branchId: "br-1" },
  { id: "tb-9", name: "T-09", seats: 4, zone: "Main Dining", status: "reserved", shape: "square", branchId: "br-1" },
  { id: "tb-10", name: "T-10", seats: 6, zone: "Main Dining", status: "available", shape: "booth", branchId: "br-1" },
  { id: "tb-11", name: "T-11", seats: 4, zone: "Main Dining", status: "occupied", shape: "square", currentOrderId: "ord-6", server: "Liam H.", occupiedSince: minsAgo(28), branchId: "br-1" },
  { id: "tb-12", name: "T-12", seats: 6, zone: "Main Dining", status: "occupied", shape: "booth", currentOrderId: "ord-2", server: "Sarah J.", occupiedSince: minsAgo(18), branchId: "br-1" },
  { id: "tb-13", name: "P-01", seats: 12, zone: "Patio", status: "available", shape: "booth", branchId: "br-1" },
  { id: "tb-14", name: "P-02", seats: 4, zone: "Patio", status: "available", shape: "round", branchId: "br-1" },
  { id: "tb-15", name: "P-03", seats: 4, zone: "Patio", status: "occupied", shape: "round", currentOrderId: "ord-7", server: "Liam H.", occupiedSince: minsAgo(55), branchId: "br-1" },
  { id: "tb-16", name: "P-04", seats: 2, zone: "Patio", status: "available", shape: "round", branchId: "br-1" },
  { id: "tb-17", name: "Bar-1", seats: 2, zone: "Bar Area", status: "occupied", shape: "round", server: "Nina T.", occupiedSince: minsAgo(33), branchId: "br-1" },
  { id: "tb-18", name: "Bar-2", seats: 2, zone: "Bar Area", status: "available", shape: "round", branchId: "br-1" },
  { id: "tb-19", name: "Bar-3", seats: 2, zone: "Bar Area", status: "reserved", shape: "round", branchId: "br-1" },
  { id: "tb-20", name: "Bar-4", seats: 4, zone: "Bar Area", status: "dirty", shape: "round", branchId: "br-1" },
];

const oi = (
  menuItemId: string,
  qty: number,
  kitchenStatus: "queued" | "cooking" | "done",
  notes?: string,
  modifiers?: string[],
) => {
  const m = MENU_ITEMS.find((x) => x.id === menuItemId)!;
  return { menuItemId, name: m.name, price: m.price, qty, kitchenStatus, notes, modifiers };
};

const orderTotals = (items: ReturnType<typeof oi>[], discount = 0) => {
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  return { subtotal, tax, discount, total: Math.round((subtotal + tax - discount) * 100) / 100 };
};

const mkOrder = (
  id: string,
  number: number,
  channel: Order["channel"],
  status: Order["status"],
  items: ReturnType<typeof oi>[],
  createdMinsAgo: number,
  extra: Partial<Order> = {},
): Order => ({
  id,
  number,
  channel,
  status,
  items,
  createdAt: minsAgo(createdMinsAgo),
  updatedAt: minsAgo(Math.max(0, createdMinsAgo - 5)),
  branchId: "br-1",
  ...orderTotals(items, extra.discount ?? 0),
  ...extra,
});

export const ORDERS: Order[] = [
  mkOrder("ord-1", 4521, "dine-in", "new", [oi("mi-1", 2, "queued", undefined, ["Medium Rare", "No Onions"]), oi("mi-8", 1, "queued", undefined, ["Extra Parmesan"]), oi("mi-14", 2, "queued")], 14, { tableId: "tb-1", notes: "Customer has a severe nut allergy. Please ensure all surfaces are clean before preparation." }),
  mkOrder("ord-2", 4522, "dine-in", "new", [oi("mi-11", 1, "queued", undefined, ["Dressing on side"]), oi("mi-15", 2, "queued")], 3, { tableId: "tb-12" }),
  mkOrder("ord-3", 4518, "dine-in", "preparing", [oi("mi-7", 1, "done"), oi("mi-6", 1, "cooking", undefined, ["Medium", "Peppercorn Sauce"]), oi("mi-17", 2, "done")], 8, { tableId: "tb-6" }),
  mkOrder("ord-4", 4523, "delivery", "new", [oi("mi-4", 1, "queued", undefined, ["Extra Crispy"]), oi("mi-9", 1, "queued")], 2, { customerName: "Uber Eats #88214" }),
  mkOrder("ord-5", 4519, "dine-in", "preparing", [oi("mi-2", 2, "cooking"), oi("mi-10", 1, "done"), oi("mi-14", 1, "queued")], 12, { tableId: "tb-8" }),
  mkOrder("ord-6", 4520, "dine-in", "preparing", [oi("mi-5", 2, "cooking"), oi("mi-8", 1, "queued")], 24, { tableId: "tb-11" }),
  mkOrder("ord-7", 4515, "takeaway", "ready", [oi("mi-3", 1, "done"), oi("mi-18", 1, "done"), oi("mi-15", 1, "done")], 32, { customerName: "Sarah Jenkins", customerId: "cus-2" }),
  mkOrder("ord-8", 4516, "qr", "ready", [oi("mi-4", 1, "done"), oi("mi-14", 2, "done")], 26, { tableId: "tb-15", customerName: "Table P-03 (QR)" }),
  mkOrder("ord-9", 4510, "dine-in", "paid", [oi("mi-1", 1, "done"), oi("mi-8", 1, "done"), oi("mi-18", 2, "done")], 95, { customerId: "cus-1", customerName: "Harold Miller", paidAt: minsAgo(40), paymentMethod: "card" }),
  mkOrder("ord-10", 4511, "takeaway", "paid", [oi("mi-2", 1, "done"), oi("mi-15", 1, "done")], 130, { customerId: "cus-3", customerName: "James Wilson", paidAt: minsAgo(88), paymentMethod: "cash" }),
  mkOrder("ord-11", 4512, "delivery", "paid", [oi("mi-6", 2, "done"), oi("mi-9", 1, "done"), oi("mi-14", 2, "done")], 160, { customerName: "DoorDash #55102", paidAt: minsAgo(120), paymentMethod: "card" }),
  mkOrder("ord-12", 4513, "dine-in", "served", [oi("mi-21", 1, "done"), oi("mi-16", 2, "done")], 48, { tableId: "tb-17", customerId: "cus-5", customerName: "Linda Gray" }),
  mkOrder("ord-13", 4509, "qr", "paid", [oi("mi-10", 1, "done"), oi("mi-17", 1, "done")], 200, { customerId: "cus-4", customerName: "Aisha Patel", paidAt: minsAgo(180), paymentMethod: "wallet" }),
];

export const RESERVATIONS: Reservation[] = [
  { id: "rsv-1", customerName: "Sarah Connor", phone: "(415) 555-2001", partySize: 4, tableId: "tb-4", date: daysAgo(0), time: "18:30", status: "confirmed", branchId: "br-1" },
  { id: "rsv-2", customerName: "James Wilson", phone: "(415) 555-2002", partySize: 2, tableId: "tb-19", date: daysAgo(0), time: "19:00", status: "confirmed", branchId: "br-1" },
  { id: "rsv-3", customerName: "Michael Scott", phone: "(415) 555-2003", partySize: 12, tableId: "tb-13", date: daysAgo(0), time: "19:15", status: "pending", notes: "Birthday party — needs cake plates", branchId: "br-1" },
  { id: "rsv-4", customerName: "Linda Gray", phone: "(415) 555-2004", partySize: 6, tableId: "tb-9", date: daysAgo(0), time: "20:00", status: "confirmed", branchId: "br-1" },
  { id: "rsv-5", customerName: "Harold Miller", phone: "(415) 555-2005", partySize: 4, date: daysAhead(1), time: "19:00", status: "pending", notes: "Window seat preferred", branchId: "br-1" },
  { id: "rsv-6", customerName: "Aisha Patel", phone: "(415) 555-2006", partySize: 2, date: daysAhead(1), time: "20:30", status: "confirmed", branchId: "br-1" },
  { id: "rsv-7", customerName: "Robert Chen", phone: "(415) 555-2007", partySize: 8, date: daysAhead(2), time: "18:00", status: "pending", notes: "Corporate dinner", branchId: "br-1" },
  { id: "rsv-8", customerName: "Emma Lawson", phone: "(415) 555-2008", partySize: 3, date: daysAgo(1), time: "19:30", status: "completed", branchId: "br-1" },
  { id: "rsv-9", customerName: "Tom Hardy", phone: "(415) 555-2009", partySize: 2, date: daysAgo(1), time: "20:00", status: "no-show", branchId: "br-1" },
];

export const INVENTORY: InventoryItem[] = [
  { id: "inv-1", name: "Cherry Tomatoes", category: "Produce", unit: "kg", stock: 4, minStock: 10, costPerUnit: 6.5, supplierId: "sup-1", branchId: "br-1" },
  { id: "inv-2", name: "Avocado", category: "Produce", unit: "pcs", stock: 2, minStock: 24, costPerUnit: 1.8, supplierId: "sup-1", branchId: "br-1" },
  { id: "inv-3", name: "Organic Mixed Greens", category: "Produce", unit: "kg", stock: 8, minStock: 6, costPerUnit: 9.0, supplierId: "sup-1", branchId: "br-1" },
  { id: "inv-4", name: "Wagyu Beef Patties", category: "Meat", unit: "pcs", stock: 96, minStock: 40, costPerUnit: 8.5, supplierId: "sup-2", branchId: "br-1" },
  { id: "inv-5", name: "Ribeye Steak 12oz", category: "Meat", unit: "pcs", stock: 22, minStock: 15, costPerUnit: 18.0, supplierId: "sup-2", branchId: "br-1" },
  { id: "inv-6", name: "Guanciale", category: "Meat", unit: "kg", stock: 3, minStock: 2, costPerUnit: 24.0, supplierId: "sup-2", branchId: "br-1" },
  { id: "inv-7", name: "Atlantic Salmon Fillet", category: "Seafood", unit: "kg", stock: 6, minStock: 8, costPerUnit: 28.0, supplierId: "sup-3", branchId: "br-1" },
  { id: "inv-8", name: "Maine Lobster", category: "Seafood", unit: "pcs", stock: 7, minStock: 6, costPerUnit: 32.0, supplierId: "sup-3", branchId: "br-1" },
  { id: "inv-9", name: "Cod Fillet", category: "Seafood", unit: "kg", stock: 11, minStock: 8, costPerUnit: 19.0, supplierId: "sup-3", branchId: "br-1" },
  { id: "inv-10", name: "Buffalo Mozzarella", category: "Dairy", unit: "kg", stock: 9, minStock: 5, costPerUnit: 14.5, supplierId: "sup-4", branchId: "br-1" },
  { id: "inv-11", name: "Aged Cheddar", category: "Dairy", unit: "kg", stock: 5, minStock: 4, costPerUnit: 12.0, supplierId: "sup-4", branchId: "br-1" },
  { id: "inv-12", name: "Heavy Cream", category: "Dairy", unit: "L", stock: 14, minStock: 10, costPerUnit: 4.2, supplierId: "sup-4", branchId: "br-1" },
  { id: "inv-13", name: "Pecorino Romano", category: "Dairy", unit: "kg", stock: 2, minStock: 3, costPerUnit: 22.0, supplierId: "sup-4", branchId: "br-1" },
  { id: "inv-14", name: "Pappardelle Pasta", category: "Dry Goods", unit: "kg", stock: 25, minStock: 12, costPerUnit: 5.5, supplierId: "sup-5", branchId: "br-1" },
  { id: "inv-15", name: "00 Pizza Flour", category: "Dry Goods", unit: "kg", stock: 40, minStock: 20, costPerUnit: 2.2, supplierId: "sup-5", branchId: "br-1" },
  { id: "inv-16", name: "Black Truffle Paste", category: "Dry Goods", unit: "g", stock: 400, minStock: 500, costPerUnit: 0.45, supplierId: "sup-5", branchId: "br-1" },
  { id: "inv-17", name: "Valrhona Chocolate 70%", category: "Dry Goods", unit: "kg", stock: 6, minStock: 4, costPerUnit: 26.0, supplierId: "sup-5", branchId: "br-1" },
  { id: "inv-18", name: "Coke Zero Cans", category: "Beverage", unit: "pcs", stock: 180, minStock: 96, costPerUnit: 0.9, supplierId: "sup-6", branchId: "br-1" },
  { id: "inv-19", name: "Hibiscus Tea Loose Leaf", category: "Beverage", unit: "kg", stock: 3, minStock: 2, costPerUnit: 18.0, supplierId: "sup-6", branchId: "br-1" },
  { id: "inv-20", name: "Bourbon Whiskey", category: "Beverage", unit: "pcs", stock: 0, minStock: 6, costPerUnit: 34.0, supplierId: "sup-6", branchId: "br-1" },
  { id: "inv-21", name: "Fresh Oranges", category: "Produce", unit: "kg", stock: 15, minStock: 10, costPerUnit: 3.4, supplierId: "sup-1", branchId: "br-1" },
  { id: "inv-22", name: "Russet Potatoes", category: "Produce", unit: "kg", stock: 55, minStock: 30, costPerUnit: 1.6, supplierId: "sup-1", branchId: "br-1" },
];

export const SUPPLIERS: Supplier[] = [
  { id: "sup-1", name: "GreenLeaf Farms", contact: "Maria Santos", phone: "(415) 555-3001", email: "orders@greenleaffarms.com", categories: ["Produce"], rating: 5, active: true },
  { id: "sup-2", name: "Premium Meats Co.", contact: "Jack Thornton", phone: "(415) 555-3002", email: "sales@premiummeats.com", categories: ["Meat"], rating: 4, active: true },
  { id: "sup-3", name: "Pacific Catch Seafood", contact: "Kenji Nakamura", phone: "(415) 555-3003", email: "orders@pacificcatch.com", categories: ["Seafood"], rating: 5, active: true },
  { id: "sup-4", name: "Bella Latteria", contact: "Giulia Bianchi", phone: "(415) 555-3004", email: "hello@bellalatteria.com", categories: ["Dairy"], rating: 4, active: true },
  { id: "sup-5", name: "Golden Gate Provisions", contact: "Sam Okafor", phone: "(415) 555-3005", email: "supply@ggprovisions.com", categories: ["Dry Goods"], rating: 4, active: true },
  { id: "sup-6", name: "BayArea Beverage Dist.", contact: "Rita Gomez", phone: "(415) 555-3006", email: "orders@babev.com", categories: ["Beverage"], rating: 3, active: true },
];

export const PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: "po-1", number: "PO-1042", supplierId: "sup-1", status: "sent",
    lines: [
      { inventoryItemId: "inv-2", name: "Avocado", qty: 48, unitCost: 1.8 },
      { inventoryItemId: "inv-1", name: "Cherry Tomatoes", qty: 20, unitCost: 6.5 },
    ],
    createdAt: minsAgo(300), expectedAt: daysAhead(1), total: 216.4, branchId: "br-1",
  },
  {
    id: "po-2", number: "PO-1041", supplierId: "sup-6", status: "confirmed",
    lines: [
      { inventoryItemId: "inv-20", name: "Bourbon Whiskey", qty: 12, unitCost: 34.0 },
      { inventoryItemId: "inv-18", name: "Coke Zero Cans", qty: 96, unitCost: 0.9 },
    ],
    createdAt: minsAgo(1500), expectedAt: daysAhead(2), total: 494.4, branchId: "br-1",
  },
  {
    id: "po-3", number: "PO-1040", supplierId: "sup-3", status: "received",
    lines: [
      { inventoryItemId: "inv-7", name: "Atlantic Salmon Fillet", qty: 10, unitCost: 28.0 },
      { inventoryItemId: "inv-9", name: "Cod Fillet", qty: 12, unitCost: 19.0 },
    ],
    createdAt: minsAgo(4400), expectedAt: daysAgo(1), receivedAt: minsAgo(2900), total: 508.0, branchId: "br-1",
  },
  {
    id: "po-4", number: "PO-1039", supplierId: "sup-2", status: "draft",
    lines: [
      { inventoryItemId: "inv-4", name: "Wagyu Beef Patties", qty: 60, unitCost: 8.5 },
    ],
    createdAt: minsAgo(120), total: 510.0, branchId: "br-1",
  },
];

export const RECIPES: Recipe[] = [
  {
    id: "rcp-1", menuItemId: "mi-1", name: "Signature Wagyu Burger", yieldQty: 1, prepMinutes: 14,
    instructions: ["Season patty and grill 3–4 min per side to order", "Toast brioche bun with butter", "Layer truffle aioli, lettuce, patty, aged cheddar", "Rest 1 minute, plate with pickle spear"],
    ingredients: [
      { inventoryItemId: "inv-4", qty: 1 },
      { inventoryItemId: "inv-11", qty: 0.04 },
    ],
  },
  {
    id: "rcp-2", menuItemId: "mi-2", name: "Black Truffle Pasta", yieldQty: 1, prepMinutes: 16,
    instructions: ["Cook pappardelle al dente", "Reduce cream with truffle paste", "Toss pasta, finish with pecorino", "Shave fresh truffle to plate"],
    ingredients: [
      { inventoryItemId: "inv-14", qty: 0.12 },
      { inventoryItemId: "inv-12", qty: 0.15 },
      { inventoryItemId: "inv-16", qty: 15 },
      { inventoryItemId: "inv-13", qty: 0.03 },
    ],
  },
  {
    id: "rcp-3", menuItemId: "mi-4", name: "Artisan Margherita", yieldQty: 1, prepMinutes: 12,
    instructions: ["Stretch 260g dough ball", "Sauce with San Marzano base", "Top with torn mozzarella", "Bake 90 seconds at 850°F, finish with basil"],
    ingredients: [
      { inventoryItemId: "inv-15", qty: 0.26 },
      { inventoryItemId: "inv-10", qty: 0.12 },
      { inventoryItemId: "inv-1", qty: 0.08 },
    ],
  },
  {
    id: "rcp-4", menuItemId: "mi-3", name: "Seared Salmon Salad", yieldQty: 1, prepMinutes: 10,
    instructions: ["Sear salmon skin-side down 4 min", "Dress greens with lemon-herb vinaigrette", "Plate salmon over greens, crumble feta"],
    ingredients: [
      { inventoryItemId: "inv-7", qty: 0.18 },
      { inventoryItemId: "inv-3", qty: 0.1 },
      { inventoryItemId: "inv-1", qty: 0.06 },
    ],
  },
  {
    id: "rcp-5", menuItemId: "mi-8", name: "Truffle Fries", yieldQty: 1, prepMinutes: 8,
    instructions: ["Double-fry hand-cut potatoes", "Toss with truffle oil and salt", "Finish with shaved parmesan"],
    ingredients: [
      { inventoryItemId: "inv-22", qty: 0.3 },
      { inventoryItemId: "inv-16", qty: 4 },
    ],
  },
  {
    id: "rcp-6", menuItemId: "mi-18", name: "Molten Lava Cake", yieldQty: 6, prepMinutes: 35,
    instructions: ["Melt chocolate and butter over bain-marie", "Fold into whipped eggs and sugar", "Bake ramekins 12 min at 425°F", "Serve immediately with ice cream"],
    ingredients: [
      { inventoryItemId: "inv-17", qty: 0.4 },
      { inventoryItemId: "inv-12", qty: 0.2 },
    ],
  },
];

export const EMPLOYEES: Employee[] = [
  { id: "emp-1", code: "EMP-001", name: "Alex Sterling", role: "Owner", email: "alex@restroos.demo", phone: "(415) 555-4001", hourlyRate: 0, hiredAt: "2019-03-01", status: "active", rating: 5, pin: "1111", avatarColor: "#4f46e5", branchId: "br-1" },
  { id: "emp-2", code: "EMP-042", name: "Marco Rossi", role: "Head Chef", email: "marco@restroos.demo", phone: "(415) 555-4002", hourlyRate: 38, hiredAt: "2020-06-15", status: "active", rating: 4, pin: "2222", avatarColor: "#a44100", branchId: "br-1" },
  { id: "emp-3", code: "EMP-089", name: "Sarah Jenkins", role: "Senior Waiter", email: "sarahj@restroos.demo", phone: "(415) 555-4003", hourlyRate: 22, hiredAt: "2021-02-10", status: "active", rating: 5, pin: "3333", avatarColor: "#505f76", branchId: "br-1" },
  { id: "emp-4", code: "EMP-101", name: "Marcus Pierce", role: "Manager", email: "marcus@restroos.demo", phone: "(415) 555-4004", hourlyRate: 32, hiredAt: "2020-11-20", status: "active", rating: 4, pin: "4444", avatarColor: "#0f766e", branchId: "br-1" },
  { id: "emp-5", code: "EMP-112", name: "Elena Rodriguez", role: "Server", email: "elena@restroos.demo", phone: "(415) 555-4005", hourlyRate: 20, hiredAt: "2022-04-04", status: "active", rating: 4, pin: "5555", avatarColor: "#be185d", branchId: "br-1" },
  { id: "emp-6", code: "EMP-118", name: "Liam Harper", role: "Server", email: "liam@restroos.demo", phone: "(415) 555-4006", hourlyRate: 19, hiredAt: "2023-01-09", status: "active", rating: 3, pin: "6666", avatarColor: "#0369a1", branchId: "br-1" },
  { id: "emp-7", code: "EMP-124", name: "Nina Tran", role: "Bartender", email: "nina@restroos.demo", phone: "(415) 555-4007", hourlyRate: 24, hiredAt: "2021-08-23", status: "active", rating: 5, pin: "7777", avatarColor: "#7c3aed", branchId: "br-1" },
  { id: "emp-8", code: "EMP-130", name: "David Kim", role: "Sous Chef", email: "davidk@restroos.demo", phone: "(415) 555-4008", hourlyRate: 28, hiredAt: "2021-05-17", status: "active", rating: 4, pin: "8888", avatarColor: "#b45309", branchId: "br-1" },
  { id: "emp-9", code: "EMP-135", name: "Sofia Martinez", role: "Barista", email: "sofia@restroos.demo", phone: "(415) 555-4009", hourlyRate: 18, hiredAt: "2023-06-12", status: "active", rating: 4, pin: "9999", avatarColor: "#0e7490", branchId: "br-1" },
  { id: "emp-10", code: "EMP-141", name: "John Davis", role: "Line Cook", email: "johnd@restroos.demo", phone: "(415) 555-4010", hourlyRate: 21, hiredAt: "2022-09-30", status: "active", rating: 3, pin: "1234", avatarColor: "#4338ca", branchId: "br-1" },
  { id: "emp-11", code: "EMP-146", name: "Grace Osei", role: "Host", email: "grace@restroos.demo", phone: "(415) 555-4011", hourlyRate: 17, hiredAt: "2023-11-02", status: "active", rating: 5, pin: "2468", avatarColor: "#15803d", branchId: "br-1" },
  { id: "emp-12", code: "EMP-150", name: "Pavel Novak", role: "Cleaner", email: "pavel@restroos.demo", phone: "(415) 555-4012", hourlyRate: 16, hiredAt: "2024-01-15", status: "on-leave", rating: 4, pin: "1357", avatarColor: "#525252", branchId: "br-1" },
];

const attendanceForDay = (dayOffset: number): AttendanceRecord[] => {
  const date = daysAgo(dayOffset);
  const roster: Array<[string, string, string | undefined, AttendanceRecord["status"], AttendanceRecord["method"]]> = [
    ["emp-2", "08:55", dayOffset === 0 ? undefined : "17:10", "present", "face"],
    ["emp-3", "10:02", dayOffset === 0 ? undefined : "18:35", "present", "kiosk"],
    ["emp-4", "08:45", dayOffset === 0 ? undefined : "17:45", "present", "face"],
    ["emp-5", "10:15", dayOffset === 0 ? undefined : "18:20", dayOffset % 3 === 0 ? "late" : "present", "kiosk"],
    ["emp-6", "10:00", dayOffset === 0 ? undefined : "18:05", "present", "mobile"],
    ["emp-7", "15:00", dayOffset === 0 ? undefined : "23:10", "present", "kiosk"],
    ["emp-8", "09:00", dayOffset === 0 ? undefined : "17:30", "present", "face"],
    ["emp-9", dayOffset % 4 === 1 ? "09:20" : "09:05", dayOffset === 0 ? undefined : "16:00", dayOffset % 4 === 1 ? "late" : "present", "kiosk"],
    ["emp-10", "09:30", dayOffset === 0 ? undefined : "17:00", "present", "kiosk"],
    ["emp-11", "10:30", dayOffset === 0 ? undefined : "19:00", "present", "mobile"],
  ];
  return roster.map(([employeeId, clockIn, clockOut, status, method], i) => ({
    id: `att-${dayOffset}-${i}`,
    employeeId,
    date,
    clockIn,
    clockOut,
    method,
    status,
    branchId: "br-1",
  }));
};

export const ATTENDANCE: AttendanceRecord[] = [0, 1, 2, 3, 4, 5, 6].flatMap(attendanceForDay);

const shiftsForDay = (dayOffset: number): Shift[] => {
  const date = dayOffset < 0 ? daysAhead(-dayOffset) : daysAgo(dayOffset);
  const status: Shift["status"] = dayOffset > 0 ? "completed" : dayOffset === 0 ? "in-progress" : "scheduled";
  const plan: Array<[string, string, string, string]> = [
    ["emp-2", "09:00", "17:00", "Kitchen Lead"],
    ["emp-8", "09:00", "17:30", "Kitchen"],
    ["emp-10", "09:30", "17:00", "Kitchen"],
    ["emp-3", "10:00", "18:30", "Floor"],
    ["emp-5", "10:00", "18:30", "Floor"],
    ["emp-6", "10:00", "18:00", "Floor"],
    ["emp-7", "15:00", "23:00", "Bar"],
    ["emp-9", "09:00", "16:00", "Cafe"],
    ["emp-11", "10:30", "19:00", "Front Desk"],
    ["emp-4", "08:45", "17:45", "Management"],
  ];
  return plan.map(([employeeId, start, end, role], i) => ({
    id: `sh-${dayOffset}-${i}`,
    employeeId,
    date,
    start,
    end,
    role,
    status,
    branchId: "br-1",
  }));
};

export const SHIFTS: Shift[] = [2, 1, 0, -1, -2].flatMap(shiftsForDay);

export const LEAVE_REQUESTS: LeaveRequest[] = [
  { id: "lv-1", employeeId: "emp-10", type: "vacation", from: daysAhead(15), to: daysAhead(19), reason: "Family trip to Oregon", status: "pending", requestedAt: minsAgo(180) },
  { id: "lv-2", employeeId: "emp-12", type: "sick", from: daysAgo(2), to: daysAhead(3), reason: "Recovering from surgery", status: "approved", requestedAt: minsAgo(4600) },
  { id: "lv-3", employeeId: "emp-6", type: "personal", from: daysAhead(7), to: daysAhead(7), reason: "DMV appointment", status: "pending", requestedAt: minsAgo(720) },
  { id: "lv-4", employeeId: "emp-9", type: "vacation", from: daysAgo(10), to: daysAgo(8), reason: "Concert weekend", status: "rejected", requestedAt: minsAgo(20000) },
  { id: "lv-5", employeeId: "emp-3", type: "personal", from: daysAhead(4), to: daysAhead(4), reason: "School event for kids", status: "approved", requestedAt: minsAgo(2900) },
];

const currentPeriod = () => {
  const d = now();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const lastPeriod = () => {
  const d = now();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const payrollFor = (period: string, status: PayrollRecord["status"], suffix: string): PayrollRecord[] =>
  EMPLOYEES.filter((e) => e.role !== "Owner").map((e, i) => {
    const baseHours = 152 + (i % 4) * 8;
    const overtimeHours = i % 3 === 0 ? 6 : 0;
    const gross = Math.round((baseHours * e.hourlyRate + overtimeHours * e.hourlyRate * 1.5) * 100) / 100;
    const deductions = Math.round(gross * 0.14 * 100) / 100;
    const bonus = i % 5 === 0 ? 150 : 0;
    return {
      id: `pay-${suffix}-${e.id}`,
      employeeId: e.id,
      period,
      baseHours,
      overtimeHours,
      hourlyRate: e.hourlyRate,
      bonus,
      deductions,
      gross: gross + bonus,
      net: Math.round((gross + bonus - deductions) * 100) / 100,
      status,
    };
  });

export const PAYROLL: PayrollRecord[] = [
  ...payrollFor(lastPeriod(), "paid", "prev"),
  ...payrollFor(currentPeriod(), "draft", "cur"),
];

export const CUSTOMERS: Customer[] = [
  { id: "cus-1", name: "Harold Miller", phone: "(415) 555-5001", email: "harold.m@example.com", joinedAt: "2023-04-12", visits: 34, totalSpent: 2180.4, loyaltyPoints: 2180, tier: "Gold", tags: ["regular", "wine-lover"], lastVisit: daysAgo(0) },
  { id: "cus-2", name: "Sarah Jenkins", phone: "(415) 555-5002", email: "sarahj@example.com", joinedAt: "2024-01-20", visits: 12, totalSpent: 640.0, loyaltyPoints: 640, tier: "Silver", tags: ["takeaway"], lastVisit: daysAgo(0) },
  { id: "cus-3", name: "James Wilson", phone: "(415) 555-5003", email: "jwilson@example.com", joinedAt: "2022-09-05", visits: 58, totalSpent: 4820.75, loyaltyPoints: 4821, tier: "Platinum", tags: ["vip", "regular"], lastVisit: daysAgo(0) },
  { id: "cus-4", name: "Aisha Patel", phone: "(415) 555-5004", email: "aisha.p@example.com", joinedAt: "2024-06-30", visits: 8, totalSpent: 312.2, loyaltyPoints: 312, tier: "Bronze", tags: ["qr-orders"], lastVisit: daysAgo(0) },
  { id: "cus-5", name: "Linda Gray", phone: "(415) 555-5005", email: "lgray@example.com", joinedAt: "2023-11-11", visits: 21, totalSpent: 1495.6, loyaltyPoints: 1496, tier: "Gold", tags: ["birthday-oct"], lastVisit: daysAgo(0) },
  { id: "cus-6", name: "Robert Chen", phone: "(415) 555-5006", email: "rchen@example.com", joinedAt: "2023-02-14", visits: 27, totalSpent: 1890.0, loyaltyPoints: 1890, tier: "Gold", tags: ["corporate"], lastVisit: daysAgo(3) },
  { id: "cus-7", name: "Emma Lawson", phone: "(415) 555-5007", email: "emma.l@example.com", joinedAt: "2024-03-08", visits: 15, totalSpent: 720.9, loyaltyPoints: 721, tier: "Silver", tags: ["vegetarian"], lastVisit: daysAgo(1) },
  { id: "cus-8", name: "Michael Scott", phone: "(415) 555-5008", email: "mscott@example.com", joinedAt: "2022-05-19", visits: 41, totalSpent: 3105.3, loyaltyPoints: 3105, tier: "Platinum", tags: ["vip", "large-parties"], lastVisit: daysAgo(5) },
  { id: "cus-9", name: "Sofia Reyes", phone: "(415) 555-5009", email: "sreyes@example.com", joinedAt: "2025-01-22", visits: 4, totalSpent: 156.8, loyaltyPoints: 157, tier: "Bronze", tags: [], lastVisit: daysAgo(9) },
  { id: "cus-10", name: "Tom Hardy", phone: "(415) 555-5010", email: "thardy@example.com", joinedAt: "2024-08-14", visits: 6, totalSpent: 289.5, loyaltyPoints: 290, tier: "Bronze", tags: ["no-show-risk"], lastVisit: daysAgo(14) },
];

export const FEEDBACK: Feedback[] = [
  { id: "fb-1", customerId: "cus-3", customerName: "James Wilson", rating: 5, comment: "The Wagyu burger is consistently the best in the city. Service from Sarah was impeccable as always.", category: "food", date: daysAgo(0), status: "new", orderId: "ord-10" },
  { id: "fb-2", customerId: "cus-4", customerName: "Aisha Patel", rating: 4, comment: "QR ordering was super smooth. Food arrived quickly. Would love more vegetarian options.", category: "service", date: daysAgo(0), status: "new", orderId: "ord-13" },
  { id: "fb-3", customerId: "cus-1", customerName: "Harold Miller", rating: 3, comment: "Lava cake took almost 25 minutes tonight. Usually much faster.", category: "service", date: daysAgo(1), status: "responded" },
  { id: "fb-4", customerName: "Walk-in Guest", rating: 5, comment: "Beautiful patio atmosphere at sunset. The Old Fashioned was theatrical and delicious.", category: "ambience", date: daysAgo(2), status: "responded" },
  { id: "fb-5", customerId: "cus-7", customerName: "Emma Lawson", rating: 4, comment: "Great value on the lunch set. The berry salad was fresh and generous.", category: "value", date: daysAgo(2), status: "archived" },
  { id: "fb-6", customerName: "Walk-in Guest", rating: 2, comment: "Waited 15 minutes to be seated even with half the tables empty. Staff seemed overwhelmed.", category: "service", date: daysAgo(3), status: "new" },
  { id: "fb-7", customerId: "cus-8", customerName: "Michael Scott", rating: 5, comment: "Hosted our quarterly dinner here — the private booth setup was perfect for 12 people.", category: "ambience", date: daysAgo(5), status: "responded" },
];

export const AUDIT_LOGS: AuditLog[] = [
  { id: "al-1", at: minsAgo(8), actor: "Marcus Pierce", action: "REFUND_OVERRIDE", module: "POS", detail: "Manager override refund of $85.00 on order #4488", severity: "critical" },
  { id: "al-2", at: minsAgo(25), actor: "Marco Rossi", action: "STOCK_ADJUST", module: "Inventory", detail: "Adjusted Avocado stock from 6 to 2 (spoilage)", severity: "warning" },
  { id: "al-3", at: minsAgo(42), actor: "Alex Sterling", action: "MENU_PRICE_CHANGE", module: "Menu", detail: "Ribeye Steak price changed $39.00 → $42.00", severity: "info" },
  { id: "al-4", at: minsAgo(65), actor: "Sarah Jenkins", action: "ORDER_DISCOUNT", module: "POS", detail: "Applied 10% loyalty discount to order #4515", severity: "info" },
  { id: "al-5", at: minsAgo(90), actor: "System", action: "LOW_STOCK_ALERT", module: "Inventory", detail: "Avocado dropped below minimum stock (2 < 24)", severity: "warning" },
  { id: "al-6", at: minsAgo(130), actor: "Marcus Pierce", action: "SHIFT_EDIT", module: "Shifts", detail: "Extended Nina Tran's shift to 23:00", severity: "info" },
  { id: "al-7", at: minsAgo(200), actor: "Alex Sterling", action: "EMPLOYEE_RATE_CHANGE", module: "Payroll", detail: "Updated David Kim hourly rate $26 → $28", severity: "warning" },
  { id: "al-8", at: minsAgo(280), actor: "System", action: "PO_AUTO_DRAFT", module: "Purchasing", detail: "Auto-drafted PO-1039 for Wagyu Beef Patties (below min stock)", severity: "info" },
  { id: "al-9", at: minsAgo(350), actor: "Grace Osei", action: "RESERVATION_CANCEL", module: "Reservations", detail: "Cancelled reservation for Tom Hardy (no-show pattern)", severity: "info" },
  { id: "al-10", at: minsAgo(400), actor: "Marcus Pierce", action: "VOID_ITEM", module: "POS", detail: "Voided 1x Smoked Old Fashioned from order #4502 (out of stock)", severity: "warning" },
];

export const SETTINGS: AppSettings = {
  restaurantName: "RestroOS Demo Kitchen",
  currency: "USD",
  taxRate: 0.08,
  serviceCharge: 0,
  activeBranchId: "br-1",
  kdsWarnMinutes: 10,
  kdsCriticalMinutes: 20,
  loyaltyEarnRate: 1,
  loyaltyRedeemValue: 0.01,
  notifications: {
    lowStock: true,
    newOrders: true,
    reservations: true,
  },
};

export const NEXT_ORDER_NUMBER = 4524;
