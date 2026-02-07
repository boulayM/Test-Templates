// src/utils/cookieOptions.js

const isProd = process.env.NODE_ENV === "production";
const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

// NOTE: sameSite = "none" en prod car front et back sont sur des domaines differents.
// Si front/back partagent le meme domaine, preferer "lax" ou "strict".
const baseCookieOptions = {
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/",
  ...(cookieDomain ? { domain: cookieDomain } : {})
};

export const accessCookieOptions = {
  ...baseCookieOptions,
  httpOnly: true,
  maxAge: 15 * 60 * 1000
};

export const refreshCookieOptions = {
  ...baseCookieOptions,
  httpOnly: true,
  maxAge: 7 * 24 * 60 * 60 * 1000
};

export const csrfCookieOptions = {
  ...baseCookieOptions,
  httpOnly: false,
  maxAge: 15 * 60 * 1000
};

export const accessCookieClearOptions = {
  ...baseCookieOptions,
  httpOnly: true
};

export const refreshCookieClearOptions = {
  ...baseCookieOptions,
  httpOnly: true
};

export const csrfCookieClearOptions = {
  ...baseCookieOptions,
  httpOnly: false
};
