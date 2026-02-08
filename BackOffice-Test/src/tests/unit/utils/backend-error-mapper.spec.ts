import { mapBackendError } from '../../../app/shared/utils/backend-error-mapper';

describe('mapBackendError', () => {
  it('maps simple backend message', () => {
    const err = { error: { message: 'Invalid payload' } };
    const mapped = mapBackendError(err, 'Fallback');
    expect(mapped.alert.message).toBe('Invalid payload');
  });

  it('maps zod details with field path', () => {
    const err = {
      error: {
        message: 'Validation failed',
        details: [{ path: ['email'], message: 'Invalid email' }]
      }
    };
    const mapped = mapBackendError(err, 'Fallback');
    expect(mapped.fieldErrors['email']).toBe('Invalid email');
    expect(mapped.alert.items).toContain('Invalid email');
  });

  it('maps regex issue to password policy message', () => {
    const err = {
      error: {
        details: [{ path: ['password'], code: 'invalid_string', validation: 'regex' }]
      }
    };
    const mapped = mapBackendError(err, 'Fallback');
    expect(mapped.fieldErrors['password']).toContain('Password must contain');
  });

  it('maps conflict to email conflict message', () => {
    const err = { status: 409, error: { code: 'CONFLICT' } };
    const mapped = mapBackendError(err, 'Fallback');
    expect(mapped.alert.message).toContain('already used');
  });
});
