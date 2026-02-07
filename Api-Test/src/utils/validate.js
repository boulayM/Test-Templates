export function formatZodError(err) {
  const issues = err && err.issues && Array.isArray(err.issues) ? err.issues : [];
  const details = issues.map((i) => ({
    path: Array.isArray(i.path) ? i.path.join(".") : "",
    message: i.message
  }));
  return {
    code: "BAD_REQUEST",
    message: details.length ? details[0].message : "Invalid request",
    details
  };
}

export function parseBody(schema, req, res) {
  try {
    return schema.parse(req.body);
  } catch (err) {
    const payload = formatZodError(err);
    res.status(400).json(payload);
    return null;
  }
}

export function parseQuery(schema, req, res) {
  try {
    return schema.parse(req.query);
  } catch (err) {
    const payload = formatZodError(err);
    res.status(400).json(payload);
    return null;
  }
}
