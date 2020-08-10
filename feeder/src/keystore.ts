import * as fs from 'fs'
import * as crypto from 'crypto'
import * as CryptoJS from 'crypto-js'
import * as keyUtils from './keyUtils'

const KEY_SIZE = 256
const ITERATIONS = 100
const DEFAULT_KEY_NAME = `voter`

interface Key {
  name: string
  address: string
  ciphertext: string
}

function encrypt(plainText, pass): string {
  const salt = crypto.randomBytes(16)
  const key = crypto.pbkdf2Sync(pass, salt, ITERATIONS, KEY_SIZE / 8, 'sha1')
  const iv = crypto.randomBytes(16)

  const cipher = crypto.createCipheriv('AES-256-CBC', key, iv)
  cipher.setAutoPadding(true)
  cipher.update(plainText)
  const encryptedText = cipher.final().toString('base64')

  // salt, iv will be hex 32 in length
  // append them to the ciphertext for use  in decryption
  return salt.toString('hex') + iv.toString('hex') + encryptedText
}

function decrypt(transitmessage, pass) {
  const salt = CryptoJS.enc.Hex.parse(transitmessage.substr(0, 32))
  const iv = CryptoJS.enc.Hex.parse(transitmessage.substr(32, 32))
  const encrypted = transitmessage.substring(64)

  const key = CryptoJS.PBKDF2(pass, salt, {
    keySize: KEY_SIZE / 32,
    iterations: ITERATIONS,
  })

  return CryptoJS.AES.decrypt(encrypted, key, {
    iv,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC,
  }).toString(CryptoJS.enc.Utf8)
}

export async function importKey(path: string, password: string, mnemonic: string): Promise<void> {
  const wallet = await keyUtils.generateFromMnemonic(mnemonic)
  const keys = loadKeys(path)

  if (keys.find((key) => key.name === DEFAULT_KEY_NAME)) {
    throw new Error(`Key with that name already exists`)
  }

  const ciphertext = encrypt(JSON.stringify(wallet), password)

  keys.push({
    name: DEFAULT_KEY_NAME,
    address: wallet.terraAddress,
    ciphertext,
  })

  fs.writeFileSync(path, JSON.stringify(keys))
}

export function loadKeys(path: string): Key[] {
  try {
    return JSON.parse(fs.readFileSync(path, `utf8`) || `[]`)
  } catch (e) {
    console.error('loadKeys', e.message)
    return []
  }
}

export function getKey(path: string, password: string): keyUtils.Key {
  const keys = loadKeys(path)
  const key = keys.find((key) => key.name === DEFAULT_KEY_NAME)

  if (!key) {
    throw new Error('Cannot find key')
  }

  try {
    const plainText = decrypt(key.ciphertext, password)
    return JSON.parse(plainText)
  } catch (err) {
    throw new Error('Incorrect password')
  }
}

console.log(encrypt(JSON.stringify({ abcd: '1234' }), '12345678'))
