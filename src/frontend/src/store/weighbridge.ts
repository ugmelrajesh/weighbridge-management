// Local state management for weighbridge data using localStorage

export type VehicleType = "truck" | "tanker" | "trailer" | "other";
export type MaterialUnit = "kg" | "ton" | "liter";
export type TransactionStatus =
  | "pending"
  | "first_weighed"
  | "completed"
  | "voided";

export interface Vehicle {
  id: string;
  plateNumber: string;
  grossWeight: number;
  vehicleType: VehicleType;
  isActive: boolean;
  createdAt: number;
}

export interface Material {
  id: string;
  name: string;
  category: string;
  unit: MaterialUnit;
  isActive: boolean;
  createdAt: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  isActive: boolean;
  createdAt: number;
}

export interface Buyer {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  isActive: boolean;
  createdAt: number;
}

export interface Transaction {
  id: string;
  vehicleId: string;
  materialId: string;
  supplierId?: string;
  buyerId?: string;
  operatorId: string;
  status: TransactionStatus;
  firstWeight?: number;
  secondWeight?: number;
  netWeight?: number;
  firstWeighTime?: number;
  secondWeighTime?: number;
  remarks: string;
  createdAt: number;
  completedAt?: number;
}

export interface DashboardStats {
  totalTransactionsToday: number;
  totalNetWeightToday: number;
  totalTransactionsThisWeek: number;
  totalNetWeightThisWeek: number;
  totalTransactionsThisMonth: number;
  totalNetWeightThisMonth: number;
  totalTransactionsAllTime: number;
}

function generateId(): string {
  return `WB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

const SEED_VEHICLES: Vehicle[] = [
  {
    id: "v1",
    plateNumber: "ABC-1234",
    grossWeight: 20000,
    vehicleType: "truck",
    isActive: true,
    createdAt: Date.now() - 86400000 * 10,
  },
  {
    id: "v2",
    plateNumber: "XYZ-5678",
    grossWeight: 35000,
    vehicleType: "tanker",
    isActive: true,
    createdAt: Date.now() - 86400000 * 8,
  },
  {
    id: "v3",
    plateNumber: "DEF-9012",
    grossWeight: 28000,
    vehicleType: "trailer",
    isActive: true,
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: "v4",
    plateNumber: "GHI-3456",
    grossWeight: 22000,
    vehicleType: "truck",
    isActive: true,
    createdAt: Date.now() - 86400000 * 3,
  },
];

const SEED_MATERIALS: Material[] = [
  {
    id: "m1",
    name: "M SAND",
    category: "Construction",
    unit: "ton",
    isActive: true,
    createdAt: Date.now() - 86400000 * 10,
  },
  {
    id: "m2",
    name: "P SAND",
    category: "Construction",
    unit: "ton",
    isActive: true,
    createdAt: Date.now() - 86400000 * 9,
  },
  {
    id: "m3",
    name: "DUST",
    category: "Construction",
    unit: "ton",
    isActive: true,
    createdAt: Date.now() - 86400000 * 8,
  },
  {
    id: "m4",
    name: "20 MM",
    category: "Construction",
    unit: "ton",
    isActive: true,
    createdAt: Date.now() - 86400000 * 7,
  },
  {
    id: "m5",
    name: "16 MM",
    category: "Construction",
    unit: "ton",
    isActive: true,
    createdAt: Date.now() - 86400000 * 6,
  },
  {
    id: "m6",
    name: "12 MM",
    category: "Construction",
    unit: "ton",
    isActive: true,
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: "m7",
    name: "6 MM",
    category: "Construction",
    unit: "ton",
    isActive: true,
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: "m8",
    name: "WMM",
    category: "Construction",
    unit: "ton",
    isActive: true,
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: "m9",
    name: "CLAY",
    category: "Construction",
    unit: "ton",
    isActive: true,
    createdAt: Date.now() - 86400000 * 2,
  },
];

const SEED_SUPPLIERS: Supplier[] = [
  {
    id: "s1",
    name: "PT. Tambang Nusantara",
    contactPerson: "Budi Santoso",
    phone: "+62-21-555-0101",
    address: "Jakarta Selatan",
    isActive: true,
    createdAt: Date.now() - 86400000 * 10,
  },
  {
    id: "s2",
    name: "CV. Agro Makmur",
    contactPerson: "Siti Rahayu",
    phone: "+62-31-555-0202",
    address: "Surabaya",
    isActive: true,
    createdAt: Date.now() - 86400000 * 7,
  },
  {
    id: "s3",
    name: "PT. Bumi Resources",
    contactPerson: "Ahmad Fauzi",
    phone: "+62-22-555-0303",
    address: "Bandung",
    isActive: true,
    createdAt: Date.now() - 86400000 * 4,
  },
];

const SEED_BUYERS: Buyer[] = [
  {
    id: "b1",
    name: "PT. Sumber Energi",
    contactPerson: "Dewi Lestari",
    phone: "+62-21-555-1001",
    address: "Jakarta Barat",
    isActive: true,
    createdAt: Date.now() - 86400000 * 10,
  },
  {
    id: "b2",
    name: "PT. Konstruksi Maju",
    contactPerson: "Rudi Hartono",
    phone: "+62-24-555-1002",
    address: "Semarang",
    isActive: true,
    createdAt: Date.now() - 86400000 * 6,
  },
  {
    id: "b3",
    name: "CV. Industri Pangan",
    contactPerson: "Nina Kusuma",
    phone: "+62-61-555-1003",
    address: "Medan",
    isActive: true,
    createdAt: Date.now() - 86400000 * 3,
  },
];

const _now = Date.now();
const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: "WB-T001",
    vehicleId: "v1",
    materialId: "m1",
    supplierId: "s1",
    buyerId: "b1",
    operatorId: "operator",
    status: "completed",
    firstWeight: 35200,
    secondWeight: 12800,
    netWeight: 22400,
    firstWeighTime: _now - 86400000 * 2,
    secondWeighTime: _now - 86400000 * 2 + 3600000,
    remarks: "Normal delivery",
    createdAt: _now - 86400000 * 2,
    completedAt: _now - 86400000 * 2 + 3600000,
  },
  {
    id: "WB-T002",
    vehicleId: "v2",
    materialId: "m2",
    supplierId: "s2",
    buyerId: "b1",
    operatorId: "operator",
    status: "completed",
    firstWeight: 28500,
    secondWeight: 9500,
    netWeight: 19000,
    firstWeighTime: _now - 86400000,
    secondWeighTime: _now - 86400000 + 2400000,
    remarks: "",
    createdAt: _now - 86400000,
    completedAt: _now - 86400000 + 2400000,
  },
  {
    id: "WB-T003",
    vehicleId: "v3",
    materialId: "m3",
    supplierId: "s3",
    buyerId: "b2",
    operatorId: "operator",
    status: "first_weighed",
    firstWeight: 42000,
    firstWeighTime: _now - 7200000,
    remarks: "Awaiting second weigh",
    createdAt: _now - 7200000,
  },
  {
    id: "WB-T004",
    vehicleId: "v4",
    materialId: "m4",
    supplierId: "s1",
    buyerId: "b2",
    operatorId: "operator",
    status: "pending",
    remarks: "",
    createdAt: _now - 3600000,
  },
  {
    id: "WB-T005",
    vehicleId: "v1",
    materialId: "m5",
    supplierId: "s2",
    buyerId: "b3",
    operatorId: "operator",
    status: "completed",
    firstWeight: 31800,
    secondWeight: 10200,
    netWeight: 21600,
    firstWeighTime: _now - 86400000 * 3,
    secondWeighTime: _now - 86400000 * 3 + 1800000,
    remarks: "Urgent shipment",
    createdAt: _now - 86400000 * 3,
    completedAt: _now - 86400000 * 3 + 1800000,
  },
  {
    id: "WB-T006",
    vehicleId: "v2",
    materialId: "m6",
    supplierId: "s1",
    buyerId: "b1",
    operatorId: "operator",
    status: "voided",
    firstWeight: 29000,
    firstWeighTime: _now - 86400000 * 4,
    remarks: "Vehicle issue - voided",
    createdAt: _now - 86400000 * 4,
  },
];

function initializeData(): void {
  if (!localStorage.getItem("wb_initialized")) {
    save("wb_vehicles", SEED_VEHICLES);
    save("wb_materials", SEED_MATERIALS);
    save("wb_suppliers", SEED_SUPPLIERS);
    save("wb_buyers", SEED_BUYERS);
    save("wb_transactions", SEED_TRANSACTIONS);
    localStorage.setItem("wb_initialized", "1");
  }
}

export const store = {
  init: initializeData,

  getVehicles: (): Vehicle[] => load("wb_vehicles", []),
  createVehicle: (
    data: Omit<Vehicle, "id" | "createdAt" | "isActive">,
  ): Vehicle => {
    const vehicles = load<Vehicle[]>("wb_vehicles", []);
    const v: Vehicle = {
      ...data,
      id: generateId(),
      isActive: true,
      createdAt: Date.now(),
    };
    save("wb_vehicles", [...vehicles, v]);
    return v;
  },
  updateVehicle: (id: string, data: Partial<Vehicle>): void => {
    const vehicles = load<Vehicle[]>("wb_vehicles", []);
    save(
      "wb_vehicles",
      vehicles.map((v) => (v.id === id ? { ...v, ...data } : v)),
    );
  },
  toggleVehicleStatus: (id: string): void => {
    const vehicles = load<Vehicle[]>("wb_vehicles", []);
    save(
      "wb_vehicles",
      vehicles.map((v) => (v.id === id ? { ...v, isActive: !v.isActive } : v)),
    );
  },
  deactivateVehicle: (id: string): void => {
    const vehicles = load<Vehicle[]>("wb_vehicles", []);
    save(
      "wb_vehicles",
      vehicles.map((v) => (v.id === id ? { ...v, isActive: false } : v)),
    );
  },
  deleteVehicle: (id: string): void => {
    const vehicles = load<Vehicle[]>("wb_vehicles", []);
    save(
      "wb_vehicles",
      vehicles.filter((v) => v.id !== id),
    );
  },

  getMaterials: (): Material[] => load("wb_materials", []),
  createMaterial: (
    data: Omit<Material, "id" | "createdAt" | "isActive">,
  ): Material => {
    const materials = load<Material[]>("wb_materials", []);
    const m: Material = {
      ...data,
      id: generateId(),
      isActive: true,
      createdAt: Date.now(),
    };
    save("wb_materials", [...materials, m]);
    return m;
  },
  updateMaterial: (id: string, data: Partial<Material>): void => {
    const materials = load<Material[]>("wb_materials", []);
    save(
      "wb_materials",
      materials.map((m) => (m.id === id ? { ...m, ...data } : m)),
    );
  },
  toggleMaterialStatus: (id: string): void => {
    const materials = load<Material[]>("wb_materials", []);
    save(
      "wb_materials",
      materials.map((m) => (m.id === id ? { ...m, isActive: !m.isActive } : m)),
    );
  },
  deactivateMaterial: (id: string): void => {
    const materials = load<Material[]>("wb_materials", []);
    save(
      "wb_materials",
      materials.map((m) => (m.id === id ? { ...m, isActive: false } : m)),
    );
  },
  deleteMaterial: (id: string): void => {
    const materials = load<Material[]>("wb_materials", []);
    save(
      "wb_materials",
      materials.filter((m) => m.id !== id),
    );
  },

  getSuppliers: (): Supplier[] => load("wb_suppliers", []),
  createSupplier: (
    data: Omit<Supplier, "id" | "createdAt" | "isActive">,
  ): Supplier => {
    const suppliers = load<Supplier[]>("wb_suppliers", []);
    const s: Supplier = {
      ...data,
      id: generateId(),
      isActive: true,
      createdAt: Date.now(),
    };
    save("wb_suppliers", [...suppliers, s]);
    return s;
  },
  updateSupplier: (id: string, data: Partial<Supplier>): void => {
    const suppliers = load<Supplier[]>("wb_suppliers", []);
    save(
      "wb_suppliers",
      suppliers.map((s) => (s.id === id ? { ...s, ...data } : s)),
    );
  },
  deactivateSupplier: (id: string): void => {
    const suppliers = load<Supplier[]>("wb_suppliers", []);
    save(
      "wb_suppliers",
      suppliers.map((s) => (s.id === id ? { ...s, isActive: false } : s)),
    );
  },

  getBuyers: (): Buyer[] => load("wb_buyers", []),
  createBuyer: (data: Omit<Buyer, "id" | "createdAt" | "isActive">): Buyer => {
    const buyers = load<Buyer[]>("wb_buyers", []);
    const b: Buyer = {
      ...data,
      id: generateId(),
      isActive: true,
      createdAt: Date.now(),
    };
    save("wb_buyers", [...buyers, b]);
    return b;
  },
  updateBuyer: (id: string, data: Partial<Buyer>): void => {
    const buyers = load<Buyer[]>("wb_buyers", []);
    save(
      "wb_buyers",
      buyers.map((b) => (b.id === id ? { ...b, ...data } : b)),
    );
  },
  deactivateBuyer: (id: string): void => {
    const buyers = load<Buyer[]>("wb_buyers", []);
    save(
      "wb_buyers",
      buyers.map((b) => (b.id === id ? { ...b, isActive: false } : b)),
    );
  },

  getTransactions: (): Transaction[] => load("wb_transactions", []),
  getRecentTransactions: (): Transaction[] => {
    const txs = load<Transaction[]>("wb_transactions", []);
    return [...txs].sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);
  },
  createTransaction: (
    data: Omit<Transaction, "id" | "createdAt"> & {
      status?: TransactionStatus;
    },
  ): Transaction => {
    const transactions = load<Transaction[]>("wb_transactions", []);
    const t: Transaction = {
      ...data,
      id: `WB-${Date.now().toString(36).toUpperCase()}`,
      status: data.status ?? "pending",
      createdAt: Date.now(),
    };
    save("wb_transactions", [...transactions, t]);
    return t;
  },
  recordFirstWeight: (id: string, weight: number): Transaction | null => {
    const transactions = load<Transaction[]>("wb_transactions", []);
    let found: Transaction | null = null;
    const updated = transactions.map((t) => {
      if (t.id === id) {
        found = {
          ...t,
          firstWeight: weight,
          firstWeighTime: Date.now(),
          status: "first_weighed",
        };
        return found;
      }
      return t;
    });
    save("wb_transactions", updated);
    return found;
  },
  recordSecondWeight: (id: string, weight: number): Transaction | null => {
    const transactions = load<Transaction[]>("wb_transactions", []);
    let found: Transaction | null = null;
    const updated = transactions.map((t) => {
      if (t.id === id && t.firstWeight !== undefined) {
        const netWeight = Math.abs(t.firstWeight - weight);
        found = {
          ...t,
          secondWeight: weight,
          secondWeighTime: Date.now(),
          netWeight,
          status: "completed",
          completedAt: Date.now(),
        };
        return found;
      }
      return t;
    });
    save("wb_transactions", updated);
    return found;
  },
  voidTransaction: (id: string): void => {
    const transactions = load<Transaction[]>("wb_transactions", []);
    save(
      "wb_transactions",
      transactions.map((t) => (t.id === id ? { ...t, status: "voided" } : t)),
    );
  },
  getTransaction: (id: string): Transaction | null => {
    const transactions = load<Transaction[]>("wb_transactions", []);
    return transactions.find((t) => t.id === id) || null;
  },
  getDashboardStats: (): DashboardStats => {
    const transactions = load<Transaction[]>("wb_transactions", []);
    const now = Date.now();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const completed = transactions.filter((t) => t.status === "completed");
    const toDay = completed.filter((t) => t.createdAt >= startOfDay.getTime());
    const thisWeek = completed.filter(
      (t) => t.createdAt >= startOfWeek.getTime(),
    );
    const thisMonth = completed.filter(
      (t) => t.createdAt >= startOfMonth.getTime(),
    );
    return {
      totalTransactionsToday: toDay.length,
      totalNetWeightToday: toDay.reduce(
        (acc, t) => acc + (t.netWeight || 0),
        0,
      ),
      totalTransactionsThisWeek: thisWeek.length,
      totalNetWeightThisWeek: thisWeek.reduce(
        (acc, t) => acc + (t.netWeight || 0),
        0,
      ),
      totalTransactionsThisMonth: thisMonth.length,
      totalNetWeightThisMonth: thisMonth.reduce(
        (acc, t) => acc + (t.netWeight || 0),
        0,
      ),
      totalTransactionsAllTime: completed.length,
    };
  },
  updateTransaction: (id: string, updates: Partial<Transaction>): void => {
    const transactions = load<Transaction[]>("wb_transactions", []);
    save(
      "wb_transactions",
      transactions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
  },
  deleteTransaction: (id: string): void => {
    const transactions = load<Transaction[]>("wb_transactions", []);
    save(
      "wb_transactions",
      transactions.filter((t) => t.id !== id),
    );
  },
  clearAllTransactions: (): void => {
    save("wb_transactions", []);
  },
};

export type PrintPaperSize = "A4" | "A5" | "thermal80";

export type EstimateOrientation = "portrait" | "landscape";

export interface PrintSettings {
  gatePass: PrintPaperSize;
  finalWeigh: PrintPaperSize;
  estimateOrientation: EstimateOrientation;
}

const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  gatePass: "A5",
  finalWeigh: "A5",
  estimateOrientation: "portrait" as EstimateOrientation,
};

export const printSettingsStore = {
  get: (): PrintSettings =>
    load<PrintSettings>("wb_print_settings", DEFAULT_PRINT_SETTINGS),
  save: (settings: PrintSettings): void => save("wb_print_settings", settings),
};

// ---- PIN Store ----
const PIN_KEY = "wb_pin";
const DEFAULT_PIN = "1234";

// Ensure default PIN exists on first run
if (!localStorage.getItem(PIN_KEY)) {
  localStorage.setItem(PIN_KEY, DEFAULT_PIN);
}

export const pinStore = {
  getPin: (): string => localStorage.getItem(PIN_KEY) ?? DEFAULT_PIN,
  setPin: (pin: string): void => localStorage.setItem(PIN_KEY, pin),
  verifyPin: (input: string): boolean =>
    input === (localStorage.getItem(PIN_KEY) ?? DEFAULT_PIN),
};
