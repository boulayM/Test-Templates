import { formatZodError } from "../utils/validate.js";

function respondError(res, err) {
  const payload = formatZodError(err);
  res.status(400).json(payload);
}

export function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      respondError(res, err);
    }
  };
}

export function validateParams(schema) {
  return (req, res, next) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (err) {
      respondError(res, err);
    }
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (err) {
      respondError(res, err);
    }
  };
}