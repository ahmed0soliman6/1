import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getLocalTokenFromRequest } from "./localAuthRoutes";
import { verifyLocalToken } from "./localAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

/**
 * يحوّل جلسة محلية إلى كائن User متوافق مع باقي النظام
 * (نفس شكل بيانات Manus حتى تعمل كل الشاشات بدون تعديل إضافي)
 */
function localSessionToUser(sessionEmail: string, sessionName: string, sessionRole: string): User {
  const now = new Date();
  return {
    id: -1, // معرف وهمي مخصص للمستخدم المحلي فقط
    openId: `local:${sessionEmail}`,
    name: sessionName,
    email: sessionEmail,
    loginMethod: "local",
    role: sessionRole === "admin" ? "admin" : "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // 1) أولوية للجلسة المحلية إن وُجدت وصالحة
  try {
    const localToken = getLocalTokenFromRequest(opts.req);
    const localSession = verifyLocalToken(localToken);
    if (localSession) {
      user = localSessionToUser(localSession.email, localSession.name, localSession.role);
    }
  } catch (error) {
    user = null;
  }

  // 2) إذا مافيش جلسة محلية، نرجع لطريقة Manus المعتادة
  if (!user) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
