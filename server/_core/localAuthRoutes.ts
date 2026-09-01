/**
 * مسارات المصادقة المحلية (Express Routes)
 * تعمل بجانب Manus OAuth الحالي دون التعارض معه.
 * عند وجود جلسة محلية صالحة، تُستخدم قبل Manus.
 */

import type { Express, Request, Response } from "express";
import { loginLocalWithSession, verifyLocalToken, logoutLocal } from "./localAuth";

const LOCAL_COOKIE_NAME = "local_auth_token";

/** يقرأ الكوكيز يدويًا بدون الحاجة لمكتبة cookie-parser */
function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie;
  if (!header) return {};
  return header.split(";").reduce((acc: Record<string, string>, part) => {
    const [key, ...rest] = part.trim().split("=");
    if (key) acc[key] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
}

export function getLocalTokenFromRequest(req: Request): string | null {
  const cookies = parseCookies(req);
  if (cookies[LOCAL_COOKIE_NAME]) return cookies[LOCAL_COOKIE_NAME];
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export function registerLocalAuthRoutes(app: Express) {
  // تسجيل الدخول
  app.post("/api/local-auth/login", (req: Request, res: Response) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "البريد وكلمة السر مطلوبان" });
    }

    const session = loginLocalWithSession(String(email), String(password));
    if (!session) {
      return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
    }

    res.cookie(LOCAL_COOKIE_NAME, session.token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 ساعة
    });

    res.json({
      ok: true,
      user: { email: session.email, name: session.name, role: session.role },
    });
  });

  // تسجيل الخروج
  app.post("/api/local-auth/logout", (req: Request, res: Response) => {
    const token = getLocalTokenFromRequest(req);
    if (token) logoutLocal(token);
    res.clearCookie(LOCAL_COOKIE_NAME);
    res.json({ ok: true });
  });

  // التحقق من الجلسة الحالية
  app.get("/api/local-auth/me", (req: Request, res: Response) => {
    const token = getLocalTokenFromRequest(req);
    const session = verifyLocalToken(token);
    if (!session) {
      return res.status(401).json({ error: "لا توجد جلسة نشطة" });
    }
    res.json({
      email: session.email,
      name: session.name,
      role: session.role,
    });
  });
}
