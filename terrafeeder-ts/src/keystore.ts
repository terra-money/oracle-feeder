import * as fs from 'fs';
import * as CryptoJS from 'crypto-js';
import * as keyUtils from './keyUtils';

const KEY_SIZE = 256;
const ITERATIONS = 100;
const DEFAULT_KEY_NAME = `voter`;

export function loadKeys(keystore) {
  try {
    return JSON.parse(fs.readFileSync(keystore, `utf8`) || `[]`);
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
    iterations: ITERATIONS
  });

  return CryptoJS.AES.decrypt(encrypted, key, {
    iv,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC
  }).toString(CryptoJS.enc.Utf8);
}

export function getKey(keystore, password) {
  const keys = loadKeys(keystore);
  const key = keys.find(key => key.name === DEFAULT_KEY_NAME);

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
    iterations: ITERATIONS
  });

  const iv = CryptoJS.lib.WordArray.random(128 / 8);

  const encrypted = CryptoJS.AES.encrypt(plainText, key, {
    iv,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC
  });

  // salt, iv will be hex 32 in length
  // append them to the ciphertext for use  in decryption
  return salt.toString() + iv.toString() + encrypted.toString();
}

export async function importKey(keystore, password, seed) {
  const wallet = await keyUtils.generateFromMnemonic(seed);
  const keys = [];

  if (keys.find(key => key.name === DEFAULT_KEY_NAME)) {
    throw new Error(`Key with that name already exists`);
  }

  const ciphertext = encrypt(JSON.stringify(wallet), password);

  keys.push({
    name: DEFAULT_KEY_NAME,
    address: wallet.terraAddress,
    ciphertext
  });

  fs.writeFileSync(keystore, JSON.stringify(keys));
}
