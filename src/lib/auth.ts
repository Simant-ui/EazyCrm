import { SignJWT, jwtVerify } from "jose";
import { getUsers } from "./db";
import { Role, PermissionMatrix, hasPermission, ModuleName, PermissionAction } from "./permissions";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "eazybox-secret-key-2026-super-secure");

export interface UserSession {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: Role;
  department: string;
  avatarUrl?: string;
  permissions?: Partial<PermissionMatrix>;
}

export async function createSessionToken(user: UserSession): Promise<string> {
  return await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<UserSession | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as unknown as UserSession;
  } catch (error) {
    return null;
  }
}

// Default session fallback if not logged in (starts with Admin for smooth demo experience)
export const DEFAULT_DEMO_USER: UserSession = {
  id: "user_admin_01",
  name: "Admin User",
  email: "admin@eazybox.com",
  mobile: "9800000001",
  role: "ADMIN",
  department: "Executive Management",
  avatarUrl: "",
};

export async function getCurrentUser(): Promise<UserSession> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const token = cookieStore.get("eazybox_session")?.value;
    if (token) {
      const verified = await verifySessionToken(token);
      if (verified) return verified;
    }
  } catch (e) {
    // SSR / Edge safe
  }
  return DEFAULT_DEMO_USER;
}

export async function requirePermission(
  moduleName: ModuleName,
  action: PermissionAction
): Promise<{ user: UserSession; allowed: boolean }> {
  const user = await getCurrentUser();
  const allowed = hasPermission(user.role, user.permissions, moduleName, action);
  return { user, allowed };
}
