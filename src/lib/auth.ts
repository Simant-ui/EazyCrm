import { SignJWT, jwtVerify } from "jose";
import { Role, PermissionMatrix, hasPermission, ModuleName, PermissionAction } from "./permissions";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "eazybox-secret-key-2026-super-secure");

export interface UserSession {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: Role;
  department: string;
  status?: string;
  avatarUrl?: string;
  permissions?: Partial<PermissionMatrix> | string[];
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

export const DEFAULT_DEMO_USER: UserSession = {
  id: "user_admin_01",
  name: "Admin User",
  email: process.env.ADMIN_USERNAME || "admin@eazybox.com",
  mobile: "9800000001",
  role: "ADMIN",
  department: "Executive Management",
  status: "ACTIVE",
  avatarUrl: "",
};

export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const token = cookieStore.get("eazybox_session")?.value;
    if (token) {
      const verified = await verifySessionToken(token);
      if (verified) {
        // Real-time lookup to verify active status & latest DB permissions
        try {
          const { getUsers } = await import("./db");
          const users = await getUsers();
          const freshUser = users.find(
            (u: any) => String(u._id) === String(verified.id) || u.email.toLowerCase() === verified.email.toLowerCase()
          );
          if (freshUser) {
            return {
              id: String(freshUser._id),
              name: freshUser.name,
              email: freshUser.email,
              mobile: freshUser.mobile,
              role: freshUser.role as Role,
              department: freshUser.department || "Sales",
              status: freshUser.status || "ACTIVE",
              avatarUrl: freshUser.avatarUrl,
              permissions: freshUser.permissions,
            };
          }
        } catch (e) {
          // If DB fetch temporary fails, use verified token payload
        }
        return verified;
      }
    }
  } catch (e) {
    // SSR / Edge safe
  }
  return null; // Return null if unauthenticated (no demo fallback for new devices)
}

export async function requirePermission(
  moduleName: ModuleName | string,
  action: PermissionAction | string = "view"
): Promise<{ user: UserSession; allowed: boolean }> {
  const user = await getCurrentUser();
  if (!user || user.status === "INACTIVE") {
    return { user: (user || DEFAULT_DEMO_USER) as UserSession, allowed: false };
  }
  const allowed = hasPermission(user, moduleName, action);
  return { user, allowed };
}
