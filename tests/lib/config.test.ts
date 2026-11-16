// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { getConfig, saveConfig, isConfigured } from '../../src/lib/config';

beforeEach(() => localStorage.clear());

describe('config', () => {
  it('starts unconfigured', () => {
    expect(isConfigured()).toBe(false);
    expect(getConfig()).toEqual({ url: '', token: '' });
  });
  it('stores trimmed values', () => {
    saveConfig({ url: ' https://x/exec ', token: ' abc ' });
    expect(getConfig()).toEqual({ url: 'https://x/exec', token: 'abc' });
    expect(isConfigured()).toBe(true);
  });
});
