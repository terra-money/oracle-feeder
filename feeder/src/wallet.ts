import * as crypto from 'crypto'
import * as ripemd160 from 'ripemd160'
import * as bip32 from 'bip32'
import * as bip39 from 'bip39'
import * as bech32 from 'bech32'
import * as secp256k1 from 'secp256k1'
import { StdTx, Signature, BaseRequest } from './msg'

const HD_PATH = `m/44'/330'/0'/0/0` // key controlling ATOM allocation

export interface Wallet {
  privateKey?: string
  publicKey: string
  terraAddress: string
  terraValAddress: string
}

function bech32ify(address: Buffer, prefix: string): string {
  const words = bech32.toWords(address)
  return bech32.encode(prefix, words)
}

async function deriveMasterKey(mnemonic: string): Promise<bip32.BIP32Interface> {
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
  const terraHD = masterKey.derivePath(HD_PATH)
  const privateKey: Buffer | undefined = terraHD.privateKey

  if (!privateKey) {
    throw new Error('cannot derive key without private key')
  }

  const publicKey: Buffer = Buffer.from(secp256k1.publicKeyCreate(privateKey, true))

  return {
    privateKey,
    publicKey,
  }
}

// NOTE: this only works with a compressed public key (33 bytes)
export function createTerraAddress(publicKey: Buffer): string {
  const shaHash: Buffer = crypto.createHash('sha256').update(publicKey).digest()
  const ripemd160Hash: Buffer = new ripemd160().update(shaHash).digest()
  return bech32ify(ripemd160Hash, `terra`)
}

export function terraAddressToValidatorAddress(terraAddress: string): string {
  const { words } = bech32.decode(terraAddress)
  return bech32.encode(`terravaloper`, words)
}

export async function generateFromMnemonic(mnemonic: string): Promise<Wallet> {
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

// Transactions often have amino decoded objects in them {type, value}.
// We need to strip this clutter as we need to sign only the values.
function prepareSignBytes(jsonTx) {
  if (Array.isArray(jsonTx)) {
    return jsonTx.map(prepareSignBytes)
  }

  // string or number
  if (typeof jsonTx !== `object`) {
    return jsonTx
  }

  const sorted = {}
  Object.keys(jsonTx)
    .sort()
    .forEach((key) => {
      if (jsonTx[key] === undefined || jsonTx[key] === null) return

      sorted[key] = prepareSignBytes(jsonTx[key])
    })
  return sorted
}

/*
The SDK expects a certain message format to serialize and then sign.

type StdSignMsg struct {
  ChainID       string      `json:"chain_id"`
  AccountNumber uint64      `json:"account_number"`
  Sequence      uint64      `json:"sequence"`
  Fee           auth.StdFee `json:"fee"`
  Msgs          []sdk.Msg   `json:"msgs"`
  Memo          string      `json:"memo"`
}
*/
export function createSignMessage(
  jsonTx: StdTx,
  {
    sequence,
    account_number,
    chain_id,
  }: {
    sequence: string
    account_number: string
    chain_id: string
  }
): string {
  // sign bytes need amount to be an array
  const fee = {
    amount: jsonTx.fee.amount || [],
    gas: jsonTx.fee.gas,
  }

  return JSON.stringify(
    prepareSignBytes({
      fee,
      memo: jsonTx.memo,
      msgs: jsonTx.msg, // weird msg vs. msgs
      sequence,
      account_number,
      chain_id,
    })
  )
}

// produces the signature for a message (returns Buffer)
function signWithPrivateKey(signMessage, privateKey): Uint8Array {
  const signHash = crypto.createHash('sha256').update(signMessage).digest()
  const { signature } = secp256k1.ecdsaSign(signHash, Buffer.from(privateKey, `hex`))
  return signature
}

export function createSignature(
  signature: Buffer,
  sequence: string,
  accountNumber: string,
  publicKey: Buffer
): Signature {
  return {
    signature: signature.toString(`base64`),
    account_number: accountNumber,
    sequence,
    pub_key: {
      type: `tendermint/PubKeySecp256k1`, // TODO: allow other keytypes
      value: publicKey.toString(`base64`),
    },
  }
}

// main function to get a signature from ledger or local keystore
export async function sign(voter: Wallet, tx: StdTx, baseRequest: BaseRequest): Promise<Signature> {
  const pubKeyBuffer = Buffer.from(voter.publicKey, `hex`)
  const { sequence, account_number } = baseRequest
  const signMessage = createSignMessage(tx, baseRequest)
  const signatureBuffer = Buffer.from(signWithPrivateKey(signMessage, voter.privateKey))
  return createSignature(signatureBuffer, sequence, account_number, pubKeyBuffer)
}
