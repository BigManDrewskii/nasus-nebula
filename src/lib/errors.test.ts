import { describe, it, expect } from 'vitest';
import { UserFacingError } from './errors';

describe('UserFacingError', () => {
  it('should create an error with a message', () => {
    const error = new UserFacingError('Test error');
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('UserFacingError');
  });
});
