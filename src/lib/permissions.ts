export type Role = "ADMIN" | "MEMBER" | "SALES_MANAGER" | "SALES_EXECUTIVE";

export type ModuleName =
  | "dashboard"
  | "sales"
  | "customers"
  | "leads"
  | "products"
  | "ncm"
  | "commission"
  | "marketing"
  | "reports"
  | "team"
  | "audit_logs"
  | "settings";

export type PermissionAction =
  | "view"
  | "viewOwn"
  | "viewAll"
  | "create"
  | "edit"
  | "delete"
  | "export"
  | "manage";

export type PermissionMatrix = Record<ModuleName, Record<PermissionAction, boolean>>;

export interface ModuleDefinition {
  id: ModuleName;
  label: string;
  category: string;
  actions: PermissionAction[];
}

export const ALL_MODULE_DEFINITIONS: ModuleDefinition[] = [
  { id: "dashboard", label: "Dashboard Analytics", category: "Core Modules", actions: ["view", "export"] },
  { id: "sales", label: "Sales & Orders", category: "Core Modules", actions: ["view", "create", "edit", "delete", "export"] },
  { id: "leads", label: "Leads CRM", category: "Core Modules", actions: ["view", "create", "edit", "delete", "export"] },
  { id: "customers", label: "Customers CRM", category: "Core Modules", actions: ["view", "create", "edit", "delete", "export"] },
  { id: "products", label: "Products Catalog", category: "Catalog & Stock", actions: ["view", "create", "edit", "delete", "export"] },
  { id: "ncm", label: "Courier Hub (NCM)", category: "Logistics", actions: ["view", "create", "edit", "delete", "manage"] },
  { id: "commission", label: "Commission & Payments", category: "Finance", actions: ["view", "create", "export"] },
  { id: "marketing", label: "Marketing Attribution", category: "Growth", actions: ["view", "create", "edit"] },
  { id: "reports", label: "Reports & Analytics", category: "Analytics", actions: ["view", "export"] },
  { id: "team", label: "Team & Role Management", category: "Administration", actions: ["view", "create", "edit", "delete"] },
  { id: "audit_logs", label: "Audit Logs", category: "Administration", actions: ["view", "export"] },
  { id: "settings", label: "System Settings", category: "Administration", actions: ["view", "edit"] },
];

export const DEFAULT_MEMBER_PERMISSIONS: Partial<PermissionMatrix> = {
  dashboard: { view: true, viewOwn: true, viewAll: false, create: false, edit: false, delete: false, export: false, manage: false },
  sales: { view: true, viewOwn: true, viewAll: true, create: true, edit: true, delete: false, export: true, manage: false },
  customers: { view: true, viewOwn: true, viewAll: true, create: true, edit: true, delete: false, export: false, manage: false },
  leads: { view: true, viewOwn: true, viewAll: true, create: true, edit: true, delete: false, export: true, manage: false },
  products: { view: true, viewOwn: true, viewAll: true, create: false, edit: false, delete: false, export: false, manage: false },
  commission: { view: true, viewOwn: true, viewAll: false, create: false, edit: false, delete: false, export: false, manage: false },
  ncm: { view: true, viewOwn: true, viewAll: false, create: true, edit: true, delete: false, export: false, manage: false },
  marketing: { view: true, viewOwn: true, viewAll: false, create: false, edit: false, delete: false, export: false, manage: false },
  reports: { view: true, viewOwn: true, viewAll: false, create: false, edit: false, delete: false, export: true, manage: false },
  team: { view: false, viewOwn: false, viewAll: false, create: false, edit: false, delete: false, export: false, manage: false },
  settings: { view: false, viewOwn: false, viewAll: false, create: false, edit: false, delete: false, export: false, manage: false },
  audit_logs: { view: true, viewOwn: true, viewAll: false, create: false, edit: false, delete: false, export: false, manage: false },
};

export function hasPermission(
  user: { role?: string; permissions?: any; status?: string } | null | undefined,
  moduleName: ModuleName | string,
  action: PermissionAction | string = "view"
): boolean {
  if (!user) return false;
  if (user.status === "INACTIVE") return false;

  // Admin always has full unrestricted access
  if (user.role === "ADMIN") return true;

  const permKey = `${moduleName}.${action}`;
  const perms = user.permissions;

  // 1. Check array format e.g. ["sales.view", "sales.create"]
  if (Array.isArray(perms)) {
    if (perms.includes(permKey) || perms.includes(`${moduleName}.*`) || perms.includes("*")) {
      return true;
    }
  }

  // 2. Check matrix object format e.g. { sales: { create: true, view: true } }
  if (perms && typeof perms === "object" && !Array.isArray(perms)) {
    const modObj = perms[moduleName];
    if (modObj) {
      if (typeof modObj === "boolean") return modObj;
      if (typeof modObj[action] === "boolean") return modObj[action];
      if (action === "view" && typeof modObj["viewOwn"] === "boolean") return modObj["viewOwn"] || modObj["viewAll"];
      if (action === "viewOwn" && typeof modObj["view"] === "boolean") return modObj["view"];
    }
  }

  // 3. Fallback to default member permissions
  const def = DEFAULT_MEMBER_PERMISSIONS[moduleName as ModuleName];
  if (def) {
    if (action === "view" || action === "viewOwn") {
      return def.view || def.viewOwn || false;
    }
    return def[action as PermissionAction] ?? false;
  }

  return false;
}
