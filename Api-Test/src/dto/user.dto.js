export function toUserCreate(data) {
  return {
    firstName: String(data.firstName || "").trim(),
    lastName: String(data.lastName || "").trim(),
    email: String(data.email || "")
      .trim()
      .toLowerCase(),
    password: data.password,
    role: data.role || "USER",
    emailVerified: data.emailVerified
  };
}

export function toUserUpdate(data) {
  const out = {};
  if (data.firstName !== undefined) out.firstName = String(data.firstName).trim();
  if (data.lastName !== undefined) out.lastName = String(data.lastName).trim();
  if (data.email !== undefined) out.email = String(data.email).trim().toLowerCase();
  if (data.password !== undefined) out.password = data.password;
  if (data.role !== undefined) out.role = data.role;
  if (data.emailVerified !== undefined) out.emailVerified = data.emailVerified;
  return out;
}