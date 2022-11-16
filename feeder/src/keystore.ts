import * as fs from 'fs'
import * as crypto from 'crypto'
import { Secp256k1HdWallet } from "@cosmjs/launchpad";
import { Entity, PlainEntity } from 'models';

const KEY_SIZE = 256
const ITERATIONS = 100

function encrypt(plainText, pass): string {
  const salt = crypto.randomBytes(16)
  const iv = crypto.randomBytes(16)
  const key = crypto.pbkdf2Sync(pass, salt, ITERATIONS, KEY_SIZE / 8, 'sha1')

  const cipher = crypto.createCipheriv('AES-256-CBC', key, iv)
  const encryptedText = Buffer.concat([cipher.update(plainText), cipher.final()]).toString('base64')

  // salt, iv will be hex 32 in length
  // append them to the ciphertext for use  in decryption
  return salt.toString('hex') + iv.toString('hex') + encryptedText
}

function decrypt(transitmessage, pass) {
  const salt = Buffer.from(transitmessage.substr(0, 32), 'hex')
  const iv = Buffer.from(transitmessage.substr(32, 32), 'hex')
  const key = crypto.pbkdf2Sync(pass, salt, ITERATIONS, KEY_SIZE / 8, 'sha1')

  const encryptedText = transitmessage.substring(64)
  const cipher = crypto.createDecipheriv('AES-256-CBC', key, iv)
  const decryptedText = Buffer.concat([
    cipher.update(encryptedText, 'base64'),
    cipher.final(),
  ]).toString()

  return decryptedText
}

function loadEntities(path: string): Entity[] {
  try {
    if(fs.lstatSync(path).isFile()) {
      return JSON.parse(fs.readFileSync(path, `utf8`))
    }
    return []
  } catch (e) {
    console.error('loadKeys', e.message)
    return []
  }
}

export async function save(
  filePath: string,
  name: string,
  password: string,
  mnemonic: string
): Promise<void> {
  const keys = loadEntities(filePath)

  if (keys.find((key) => key.name === name)) {
    throw new Error('Key already exists by that name')
  }

  const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, { prefix: "adr" });
  const [{ address }] = await wallet.getAccounts();


  const ciphertext = encrypt(
    JSON.stringify({
      validator: process.env.VALIDATOR,
      mnemonic,
      address,
    }),
    password
  )

  keys.push({ name, address, ciphertext })

  fs.writeFileSync(filePath, JSON.stringify(keys))
}

export function load(filePath: string, name: string, password: string): PlainEntity {
  const keys = loadEntities(filePath)
  const key = keys.find((key) => key.name === name)

  if (!key) {
    throw new Error('Cannot load key by that name')
  }

  try {
    const plainText = decrypt(key.ciphertext, password)
    return JSON.parse(plainText)
  } catch (err) {
    throw new Error('Incorrect password')
  }
}
