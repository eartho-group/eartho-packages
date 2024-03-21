/**
 * @jest-environment node
 */
import { EarthoOne } from '../src/EarthoOne';
import { expect } from '@jest/globals';

describe('In a Node SSR environment', () => {
  it('can be constructed', () => {
    expect(
      () => new EarthoOne({ clientId: 'foo', domain: 'bar' })
    ).not.toThrow();
  });

  it('can check authenticated state', async () => {
    const client = new EarthoOne({ clientId: 'foo', domain: 'bar' });
    expect(await client.isAuthenticated()).toBeFalsy();
    expect(await client.getUser()).toBeUndefined();
  });
});
