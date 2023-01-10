import * as fs from 'fs'
import * as crypto from 'crypto'
import { MnemonicKey } from '@terra-money/station.js'

const KEY_SIZE = 256
const ITERATIONS = 100

interface Entity {
  name: string
  address: string
  ciphertext: string
}

interface PlainEntity {
  privateKey: string
  publicKey: string
  terraAddress: string
  terraValAddress: string
}

const resizedIV = Buffer.allocUnsafe(16);
const iv = crypto.createHash('sha256').update('myHashedIV').digest();

iv.copy(resizedIV);

function encrypt(plainText, pass): string {  
  const key = crypto.createHash('sha256').update(pass).digest();
  const cipher = crypto.createCipheriv('aes256', key, resizedIV);
  const msg: string[] = [];

  msg.push(cipher.update(plainText, 'binary', 'hex'));
  msg.push(cipher.final('hex'));

  return msg.join('');
}

function decrypt(transitmessage, pass) {
  const key = crypto.createHash('sha256').update(pass).digest();
  const decipher = crypto.createDecipheriv('aes256', key, resizedIV);
  const msg: string[] = [];

  msg.push(decipher.update(transitmessage, 'hex', 'binary'));
  msg.push(decipher.final('binary'));

  return msg.join('');
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
  if(!fs.existsSync(filePath))
  {
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
      terraAddress: mnemonicKey.accAddress,
      terraValAddress: mnemonicKey.valAddress,
    }),
    password
  )

  keys.push({
    name,
    address: mnemonicKey.accAddress('adr'),
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
