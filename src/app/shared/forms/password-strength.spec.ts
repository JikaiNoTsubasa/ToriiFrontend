import { passwordStrength } from './password-strength';

describe('passwordStrength', () => {
  it('rates empty and short passwords as too weak', () => {
    expect(passwordStrength('').score).toBe(0);
    expect(passwordStrength('abc').score).toBe(0);
  });

  it('rewards length and character variety', () => {
    expect(passwordStrength('password').score).toBe(1);
    expect(passwordStrength('Password1').score).toBe(2);
    expect(passwordStrength('Password12345').score).toBe(3);
    expect(passwordStrength('Correct-Horse-9').score).toBe(4);
  });

  it('gives hints until the password is strong', () => {
    expect(passwordStrength('password').hints).toContain('Add a number.');
    expect(passwordStrength('Correct-Horse-9').hints).toEqual([]);
  });
});
