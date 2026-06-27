import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'test-encryption-key-for-unit-tests';

const { encrypt, decrypt } = await import('./encrypt.js');

test('decrypt(encrypt(x)) returns the original plaintext', () => {
  const secret = 'aicoo_sk_live_example_key_value';
  const ciphertext = encrypt(secret);
  assert.equal(decrypt(ciphertext), secret);
});

test('encrypting the same plaintext twice produces different ciphertext', () => {
  const secret = 'same-secret';
  const a = encrypt(secret);
  const b = encrypt(secret);
  assert.notEqual(a, b);
});

test('tampered ciphertext fails to decrypt', () => {
  const ciphertext = encrypt('some-secret');
  const [iv, authTag, data] = ciphertext.split(':');
  const tampered = [iv, authTag, data.slice(0, -2) + '00'].join(':');
  assert.throws(() => decrypt(tampered));
});
