import * as fs from 'fs'
import * as crypto from 'crypto'
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import { MnemonicKey } from '@terra-money/terra.js'

dotenv.config()

interface Entity {
  name: string
  address: string
  ciphertext: string
}

interface PlainEntity {
  privateKey: string
}

const ivSalt = process.env.ORACLE_FEEDER_IV_SALT || 'myHashedIV'
const resizedIV = Buffer.allocUnsafe(16)
const iv = crypto.createHash('sha256').update(ivSalt).digest()

iv.copy(resizedIV)

function encrypt(plainText: string, password: string): string {
  const key = crypto.createHash('sha256').update(password).digest()
  const cipher = crypto.createCipheriv('aes256', key, resizedIV)
  const msg: string[] = []

  msg.push(cipher.update(plainText, 'binary', 'hex'))
  msg.push(cipher.final('hex'))

  return msg.join('')
}

function decrypt(encryptedText: string, password: string): string {
  const key = crypto.createHash('sha256').update(password).digest()
  const decipher = crypto.createDecipheriv('aes256', key, resizedIV)
  const msg: string[] = []

  msg.push(decipher.update(encryptedText, 'hex', 'binary'))
  msg.push(decipher.final('binary'))

  return msg.join('')
}

function loadEntities(path: string): Entity[] {
  try {
    return JSON.parse(fs.readFileSync(path, `utf8`) || `[]`)
  } catch (e) {
    console.error('loadKeys', e.message)
    return []
  }
}

export async function save(
  filePath: string,
  name: string,
  password: string,
  mnemonic: string,
  coinType: string
): Promise<void> {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '')
  }

  const keys = loadEntities(filePath)

  if (keys.find((key) => key.name === name)) {
    throw new Error('Key already exists by that name')
  }

  const mnemonicKey = new MnemonicKey({ mnemonic, coinType: Number(coinType) })

  const ciphertext = encrypt(
    JSON.stringify({
      privateKey: mnemonicKey.privateKey.toString(`hex`),
    }),
    password
  )

  keys.push({
    name,
    address: mnemonicKey.accAddress,
    ciphertext,
  })

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
