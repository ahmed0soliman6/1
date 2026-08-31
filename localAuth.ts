/**
 * نظام المصادقة المحلي - بدون Firebase
 * يخزن بيانات المستخدمين محليًا في الذاكرة أو localStorage
 * آمن للاستخدام في المرحلة الأولى من التطوير
 */

import crypto from "crypto";

export interface LocalUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: "admin" | "user" | "doctor";
  createdAt: number;
  lastSignedIn: number;
}

export interface LocalAuthSession {
  userId: string;
  email: string;
  name: string;
  role: string;
  token: string;
  expiresAt: number;
}

// مستخدمون مرحليون (بدل قاعدة البيانات)
const DEFAULT_USERS: LocalUser[] = [
  {
    id: "admin-001",
    email: "admin",
    passwordHash: hashPassword("123456"),
    name: "مدير النظام",
    role: "admin",
    createdAt: Date.now(),
    lastSignedIn: Date.now(),
  },
];

// متغير لتخزين المستخدمين في الذاكرة
let users: LocalUser[] = [...DEFAULT_USERS];

/**
 * دالة hash بسيطة لكلمات السر (آمنة نسبياً للاختبار)
 * في الإنتاج استخدم bcrypt أو argon2
 */
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * تسجيل دخول المستخدم
 */
export function loginLocal(email: string, password: string): LocalAuthSession | null {
  const user = users.find((u) => u.email === email);

  if (!user || user.passwordHash !== hashPassword(password)) {
    return null;
  }

  // تحديث آخر دخول
  user.lastSignedIn = Date.now();

  // إنشاء token بسيط
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 ساعة

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    token,
    expiresAt,
  };
}

/**
 * إنشاء مستخدم جديد
 */
export function createLocalUser(
  email: string,
  password: string,
  name: string,
  role: "admin" | "user" | "doctor" = "user"
): LocalUser | null {
  // التحقق من عدم وجود المستخدم مسبقاً
  if (users.some((u) => u.email === email)) {
    return null;
  }

  const newUser: LocalUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email,
    passwordHash: hashPassword(password),
    name,
    role,
    createdAt: Date.now(),
    lastSignedIn: Date.now(),
  };

  users.push(newUser);
  return newUser;
}

/**
 * تغيير كلمة السر
 */
export function changeLocalPassword(email: string, oldPassword: string, newPassword: string): boolean {
  const user = users.find((u) => u.email === email);

  if (!user || user.passwordHash !== hashPassword(oldPassword)) {
    return false;
  }

  user.passwordHash = hashPassword(newPassword);
  return true;
}

/**
 * حذف مستخدم
 */
export function deleteLocalUser(email: string): boolean {
  const index = users.findIndex((u) => u.email === email);

  if (index === -1) {
    return false;
  }

  users.splice(index, 1);
  return true;
}

/**
 * الحصول على المستخدمين (للإدارة فقط)
 */
export function getAllLocalUsers(): Omit<LocalUser, "passwordHash">[] {
  return users.map(({ passwordHash, ...user }) => user);
}

/**
 * إعادة تعيين قائمة المستخدمين إلى الافتراضية
 */
export function resetToDefaultUsers(): void {
  users = [...DEFAULT_USERS];
}
