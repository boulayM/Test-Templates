import { ValidationMessages } from '../messages/validation-messages';

export interface FormAlertState {
  title: string;
  message: string;
  items: string[];
}

export interface MappedBackendError {
  fieldErrors: Record<string, string>;
  alert: FormAlertState;
}

interface IssueShape {
  path?: unknown;
  code?: unknown;
  message?: unknown;
  msg?: unknown;
  validation?: unknown;
  minimum?: unknown;
  maximum?: unknown;
}

function normalizePath(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) {
    return raw
      .map((part) =>
        typeof part === 'string' || typeof part === 'number' ? String(part) : '',
      )
      .filter(Boolean)
      .join('.');
  }
  return '';
}

function toMessage(issue: IssueShape, fallback: string): string {
  if (typeof issue.message === 'string' && issue.message.trim()) return issue.message;
  if (typeof issue.msg === 'string' && issue.msg.trim()) return issue.msg;

  if (issue.code === 'invalid_type') return ValidationMessages.required;
  if (issue.code === 'too_small' && typeof issue.minimum === 'number') {
    return ValidationMessages.minLength(issue.minimum);
  }
  if (issue.code === 'too_big' && typeof issue.maximum === 'number') {
    return ValidationMessages.maxLength(issue.maximum);
  }
  if (issue.code === 'invalid_string' && issue.validation === 'email') {
    return ValidationMessages.email;
  }
  if (issue.code === 'invalid_string' && issue.validation === 'regex') {
    return ValidationMessages.passwordPolicy;
  }
  return fallback;
}

export function mapBackendError(err: unknown, fallbackMessage: string): MappedBackendError {
  const fieldErrors: Record<string, string> = {};
  const items: string[] = [];

  if (!err || typeof err !== 'object') {
    return {
      fieldErrors,
      alert: {
        title: 'Erreur de validation',
        message: fallbackMessage,
        items,
      },
    };
  }

  const e = err as {
    status?: number;
    message?: string;
    error?: {
      message?: string;
      code?: string;
      details?: unknown;
      errors?: unknown;
    };
  };

  const detailsList = Array.isArray(e.error?.details) ? e.error.details : [];
  const errorsList = Array.isArray(e.error?.errors) ? e.error.errors : [];
  const combined = [...detailsList, ...errorsList];

  for (const rawIssue of combined) {
    if (!rawIssue || typeof rawIssue !== 'object') continue;
    const issue = rawIssue as IssueShape;
    const path = normalizePath(issue.path);
    const message = toMessage(issue, fallbackMessage);
    if (path) {
      fieldErrors[path] = message;
    }
    if (!items.includes(message)) {
      items.push(message);
    }
  }

  let message = fallbackMessage;
  if (e.status === 409 || e.error?.code === 'CONFLICT') {
    message = ValidationMessages.conflictEmail;
  } else if (typeof e.error?.message === 'string' && e.error.message.trim()) {
    message = e.error.message;
  } else if (typeof e.message === 'string' && e.message.trim()) {
    message = e.message;
  }

  if (items.length === 0 && typeof e.error?.details === 'string' && e.error.details.trim()) {
    items.push(e.error.details);
  }

  if (items.length === 0 && message !== fallbackMessage) {
    items.push(message);
  }

  return {
    fieldErrors,
    alert: {
      title: 'Erreur de validation',
      message,
      items,
    },
  };
}
