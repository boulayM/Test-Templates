export interface FormAlertState {
  title: string;
  message: string;
  items: string[];
}

export interface MappedBackendError {
  fieldErrors: Record<string, string>;
  alert: FormAlertState;
}

function normalizePath(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) {
    const joined = raw
      .map((part) => (typeof part === 'string' || typeof part === 'number' ? String(part) : ''))
      .filter(Boolean)
      .join('.');
    return joined;
  }
  return '';
}

function normalizeMessage(raw: unknown, fallback: string): string {
  return typeof raw === 'string' && raw.trim().length > 0 ? raw : fallback;
}

export function mapBackendError(err: unknown, fallbackMessage: string): MappedBackendError {
  const fieldErrors: Record<string, string> = {};
  const items: string[] = [];

  if (!err || typeof err !== 'object') {
    return {
      fieldErrors,
      alert: { title: 'Validation error', message: fallbackMessage, items },
    };
  }

  const obj = err as {
    status?: number;
    error?: {
      message?: string;
      details?: unknown;
      errors?: Array<{ path?: unknown; message?: unknown; msg?: unknown }>;
    };
    message?: string;
  };

  const details = obj.error?.details;
  const detailsList = Array.isArray(details) ? details : [];
  const errorsList = Array.isArray(obj.error?.errors) ? obj.error.errors : [];
  const combined = [...detailsList, ...errorsList];

  for (const entry of combined) {
    if (!entry || typeof entry !== 'object') continue;
    const row = entry as { path?: unknown; message?: unknown; msg?: unknown };
    const path = normalizePath(row.path);
    const msg = normalizeMessage(row.message ?? row.msg, fallbackMessage);
    if (path) {
      fieldErrors[path] = msg;
    }
    if (!items.includes(msg)) {
      items.push(msg);
    }
  }

  let message = fallbackMessage;
  if (typeof obj.error?.message === 'string' && obj.error.message.trim()) {
    message = obj.error.message;
  } else if (typeof obj.message === 'string' && obj.message.trim()) {
    message = obj.message;
  }

  if (items.length === 0 && typeof details === 'string' && details.trim()) {
    items.push(details);
  }
  if (items.length === 0 && message !== fallbackMessage) {
    items.push(message);
  }

  return {
    fieldErrors,
    alert: {
      title: 'Validation error',
      message,
      items,
    },
  };
}

