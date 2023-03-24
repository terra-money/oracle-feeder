import * as fs from 'fs'
import * as crypto from 'crypto'
import { MnemonicKey } from '@terra-money/feather.js'

const KEY_SIZE = 256
const ITERATIONS = 100

interface Entity {
  name: string
  address: string
  ciphertext: string
}

interface PlainEntity {
  privateKey: string
  address: string
  valAddress: string
}
interface KeyArgs {
  keyName: string
  coinType: string
  keyPath: string
  prefix: string
}

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
  const decryptedText = Buffer.concat([cipher.update(encryptedText, 'base64'), cipher.final()]).toString()

  return decryptedText
}

function loadEntities(path: string): Entity[] {
  if (fs.existsSync(path)) return JSON.parse(fs.readFileSync(path, `utf8`))
  else return []
}

export async function save(args: KeyArgs, password: string, mnemonic: string): Promise<void> {
  const keys = loadEntities(args.keyPath)
  if (keys.find((key) => key.name === args.keyName)) {
    throw new Error(`Key already exists with name "${args.keyName}"`)
  }

  const mnemonicKey = new MnemonicKey({ mnemonic, coinType: Number(args.coinType) })
  const entry: PlainEntity = {
    privateKey: mnemonicKey.privateKey.toString(`hex`),
    address: mnemonicKey.accAddress(args.prefix),
    valAddress: mnemonicKey.valAddress(args.prefix),
  }
  const ciphertext = encrypt(JSON.stringify(entry), password)

  keys.push({
    name: args.keyName,
    address: mnemonicKey.accAddress(args.prefix),
    ciphertext,
  })

  fs.writeFileSync(args.keyPath, JSON.stringify(keys))
}

export function load(args: any): PlainEntity {
  const keys = loadEntities(args.keyPath)
  const key = keys.find((key) => key.name === args.keyName)

  console.log(key, keys)
  if (!key) {
    throw new Error('Cannot load key by that name')
  }

  try {
    const plainText = decrypt(key.ciphertext, args.password)
    return JSON.parse(plainText)
  } catch (err) {
    throw new Error('Incorrect password')
  }
}
