const captchaEnabled =
  String(process.env.REGISTRATION_CAPTCHA_REQUIRED || "").toLowerCase() === "true";

export const verifyCaptcha = async (req, res, next) => {
  if (!captchaEnabled) {
    return next();
  }

  const token = req.body?.captchaToken;
  if (!token) {
    return res.status(400).json({ message: "Captcha token missing" });
  }

  const secret = process.env.CAPTCHA_SECRET;
  if (!secret) {
    return res.status(500).json({ message: "Captcha not configured" });
  }

  const provider = (process.env.CAPTCHA_PROVIDER || "hcaptcha").toLowerCase();
  const url =
    provider === "recaptcha"
      ? "https://www.google.com/recaptcha/api/siteverify"
      : "https://hcaptcha.com/siteverify";

  try {
    const body = new URLSearchParams();
    body.append("secret", secret);
    body.append("response", token);
    body.append("remoteip", req.ip || "");

    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body
    });

    const data = await response.json();
    if (!data.success) {
      return res.status(400).json({ message: "Captcha failed" });
    }

    return next();
  } catch (err) {
    return next(err);
  }
};
