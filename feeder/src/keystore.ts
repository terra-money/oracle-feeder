import * as fs from 'fs';
import * as CryptoJS from 'crypto-js';
import * as keyUtils from './keyUtils';

const KEY_SIZE = 256;
const ITERATIONS = 100;
const DEFAULT_KEY_NAME = `voter`;

export function loadKeys(path: string) {
  try {
    return JSON.parse(fs.readFileSync(path, `utf8`) || `[]`);
  } catch (e) {
    console.error('loadKeys', e.message);
    return [];
  }
}

function decrypt(transitmessage, pass) {
  const salt = CryptoJS.enc.Hex.parse(transitmessage.substr(0, 32));
  const iv = CryptoJS.enc.Hex.parse(transitmessage.substr(32, 32));
  const encrypted = transitmessage.substring(64);

  const key = CryptoJS.PBKDF2(pass, salt, {
    keySize: KEY_SIZE / 32,
    iterations: ITERATIONS,
  });

  return CryptoJS.AES.decrypt(encrypted, key, {
    iv,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC,
  }).toString(CryptoJS.enc.Utf8);
}

export function getKey(path: string, password: string): keyUtils.Key {
  const keys = loadKeys(path);
  const key = keys.find((key) => key.name === DEFAULT_KEY_NAME);

  if (!key) {
    throw new Error('Cannot find key');
  }

  try {
    const plainText = decrypt(key.ciphertext, password);
    return JSON.parse(plainText);
  } catch (err) {
    throw new Error('Incorrect password');
  }
}

// TODO needs proof reading
function encrypt(plainText, pass) {
  const salt = CryptoJS.lib.WordArray.random(128 / 8);

  const key = CryptoJS.PBKDF2(pass, salt, {
    keySize: KEY_SIZE / 32,
    iterations: ITERATIONS,
  });

  const iv = CryptoJS.lib.WordArray.random(128 / 8);

  const encrypted = CryptoJS.AES.encrypt(plainText, key, {
    iv,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC,
  });

  // salt, iv will be hex 32 in length
  // append them to the ciphertext for use  in decryption
  return salt.toString() + iv.toString() + encrypted.toString();
}

export async function importKey(path: string, password: string, mnemonic: string) {
  const wallet = await keyUtils.generateFromMnemonic(mnemonic);
  const keys = loadKeys(path);

  if (keys.find((key) => key.name === DEFAULT_KEY_NAME)) {
    throw new Error(`Key with that name already exists`);
  }

  const ciphertext = encrypt(JSON.stringify(wallet), password);

  keys.push({
    name: DEFAULT_KEY_NAME,
    address: wallet.terraAddress,
    ciphertext,
  });

  fs.writeFileSync(path, JSON.stringify(keys));
}
