import * as crypto from 'crypto'
import * as ripemd160 from 'ripemd160'

import * as bip32 from 'bip32'
import * as bip39 from 'bip39'
import * as bech32 from 'bech32'

import * as secp256k1 from 'secp256k1'

export interface Key {
  privateKey: string
  publicKey: string
  terraAddress: string
  terraValAddress: string
}

const hdPathAtom = `m/44'/330'/0'/0/0` // key controlling ATOM allocation

function bech32ify(address, prefix) {
  const words = bech32.toWords(address)
  return bech32.encode(prefix, words)
}

async function deriveMasterKey(mnemonic): Promise<bip32.BIP32Interface> {
  // throws if mnemonic is invalid
  bip39.validateMnemonic(mnemonic)

  const seed = await bip39.mnemonicToSeed(mnemonic)
  return bip32.fromSeed(seed)
}

function deriveKeypair(
  masterKey: bip32.BIP32Interface
): {
  privateKey: Buffer
  publicKey: Buffer
} {
  const terraHD = masterKey.derivePath(hdPathAtom)
  const privateKey: Buffer | undefined = terraHD.privateKey

  if (!privateKey) {
    throw new Error('cannot derive key without private key')
  }

  const publicKey: Buffer = secp256k1.publicKeyCreate(privateKey, true)

  return {
    privateKey,
    publicKey,
  }
}

// NOTE: this only works with a compressed public key (33 bytes)
export function createTerraAddress(publicKey: Buffer): string {
  const shaHash = crypto.createHash('sha256').update(publicKey).digest()
  const ripemd160Hash = new ripemd160().update(shaHash).digest()
  return bech32ify(ripemd160Hash, `terra`)
}

export function terraAddressToValidatorAddress(terraAddress: string): string {
  const { words } = bech32.decode(terraAddress)
  return bech32.encode(`terravaloper`, words)
}

export async function generateFromMnemonic(mnemonic: string): Promise<Key> {
  const masterKey = await deriveMasterKey(mnemonic)
  const { privateKey, publicKey } = deriveKeypair(masterKey)
  const terraAddress = createTerraAddress(publicKey)

  return {
    privateKey: privateKey.toString(`hex`),
    publicKey: publicKey.toString(`hex`),
    terraAddress,
    terraValAddress: terraAddressToValidatorAddress(terraAddress),
  }
}
