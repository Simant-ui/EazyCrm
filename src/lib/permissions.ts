export type Role = "ADMIN" | "SALES_MANAGER" | "SALES_EXECUTIVE";

export type ModuleName =
  | "dashboard"
  | "sales"
  | "customers"
  | "leads"
  | "commission"
  | "reports"
  | "marketing"
  | "team"
  | "settings"
  | "audit_logs";

export type PermissionAction =
  | "viewOwn"
  | "viewAll"
  | "create"
  | "edit"
  | "delete"
  | "export"
  | "manage";

export type PermissionMatrix = Record<ModuleName, Record<PermissionAction, boolean>>;

export const DEFAULT_PERMISSIONS: Record<Role, PermissionMatrix> = {
  ADMIN: {
    dashboard: { viewOwn: true, viewAll: true, create: true, edit: true, delete: true, export: true, manage: true },
    sales: { viewOwn: true, viewAll: true, create: true, edit: true, delete: true, export: true, manage: true },
    customers: { viewOwn: true, viewAll: true, create: true, edit: true, delete: true, export: true, manage: true },
    leads: { viewOwn: true, viewAll: true, create: true, edit: true, delete: true, export: true, manage: true },
    commission: { viewOwn: true, viewAll: true, create: true, edit: true, delete: true, export: true, manage: true },
    reports: { viewOwn: true, viewAll: true, create: true, edit: true, delete: true, export: true, manage: true },
    marketing: { viewOwn: true, viewAll: true, create: true, edit: true, delete: true, export: true, manage: true },
    team: { viewOwn: true, viewAll: true, create: true, edit: true, delete: true, export: true, manage: true },
    settings: { viewOwn: true, viewAll: true, create: true, edit: true, delete: true, export: true, manage: true },
    audit_logs: { viewOwn: true, viewAll: true, create: true, edit: true, delete: true, export: true, manage: true },
  },
  SALES_MANAGER: {
    dashboard: { viewOwn: true, viewAll: true, create: false, edit: false, delete: false, export: true, manage: false },
    sales: { viewOwn: true, viewAll: true, create: true, edit: true, delete: true, export: true, manage: true },
    customers: { viewOwn: true, viewAll: true, create: true, edit: true, delete: false, export: true, manage: false },
    leads: { viewOwn: true, viewAll: true, create: true, edit: true, delete: true, export: true, manage: true },
    commission: { viewOwn: true, viewAll: true, create: false, edit: true, delete: false, export: true, manage: true },
    reports: { viewOwn: true, viewAll: true, create: false, edit: false, delete: false, export: true, manage: false },
    marketing: { viewOwn: true, viewAll: true, create: true, edit: true, delete: false, export: true, manage: true },
    team: { viewOwn: true, viewAll: true, create: false, edit: false, delete: false, export: false, manage: false },
    settings: { viewOwn: false, viewAll: false, create: false, edit: false, delete: false, export: false, manage: false },
    audit_logs: { viewOwn: true, viewAll: true, create: false, edit: false, delete: false, export: false, manage: false },
  },
  SALES_EXECUTIVE: {
    dashboard: { viewOwn: true, viewAll: false, create: false, edit: false, delete: false, export: false, manage: false },
    sales: { viewOwn: true, viewAll: true, create: true, edit: true, delete: false, export: true, manage: false },
    customers: { viewOwn: true, viewAll: true, create: true, edit: true, delete: false, export: false, manage: false },
    leads: { viewOwn: true, viewAll: true, create: true, edit: true, delete: false, export: true, manage: false },
    commission: { viewOwn: true, viewAll: false, create: false, edit: false, delete: false, export: false, manage: false },
    reports: { viewOwn: true, viewAll: false, create: false, edit: false, delete: false, export: true, manage: false },
    marketing: { viewOwn: true, viewAll: false, create: false, edit: false, delete: false, export: false, manage: false },
    team: { viewOwn: true, viewAll: false, create: false, edit: false, delete: false, export: false, manage: false },
    settings: { viewOwn: false, viewAll: false, create: false, edit: false, delete: false, export: false, manage: false },
    audit_logs: { viewOwn: true, viewAll: false, create: false, edit: false, delete: false, export: false, manage: false },
  },
};

export function hasPermission(
  userRole: Role,
  userCustomPermissions: Partial<PermissionMatrix> | undefined,
  moduleName: ModuleName,
  action: PermissionAction
): boolean {
  if (userRole === "ADMIN") return true;

  if (userCustomPermissions && userCustomPermissions[moduleName] && typeof userCustomPermissions[moduleName][action] === "boolean") {
    return userCustomPermissions[moduleName][action]!;
  }

  const roleDefaults = DEFAULT_PERMISSIONS[userRole] || DEFAULT_PERMISSIONS.SALES_EXECUTIVE;
  return roleDefaults[moduleName]?.[action] ?? false;
}
