import * as secp256k1 from 'secp256k1'
import * as ledger from 'ledger-cosmos-js'
import {
  Wallet,
  createTerraAddress,
  terraAddressToValidatorAddress,
  createSignMessage,
  createSignature,
} from './wallet'
import { StdTx, BaseRequest, Signature } from './msg'

const LONG_TIMEOUT = 45000
const HD_PATH = [44, 330, 0, 0, 0]

let ledgerNode

export function closeLedger(): void {
  ledgerNode && ledgerNode.close_async()
}

function getLedgerNode() {
  if (ledgerNode) {
    return ledgerNode
  }

  ledgerNode = ledger.comm_node.create_async(LONG_TIMEOUT, false)
  return ledgerNode
}

export function getLedgerApp() {
  return new ledger.App(getLedgerNode())
}

export async function getWalletFromLedger(ledger): Promise<Wallet> {
  const pubKey = await ledger.publicKey(HD_PATH)

  if (pubKey.return_code !== 36864) {
    throw new Error('cannot get pubkey from ledger')
  }

  const address = createTerraAddress(new Buffer(pubKey.compressed_pk))

  return {
    publicKey: pubKey.compressed_pk,
    terraAddress: address,
    terraValAddress: terraAddressToValidatorAddress(address),
  }
}

export async function sign(
  ledger,
  wallet: Wallet,
  tx: StdTx,
  baseRequest: BaseRequest
): Promise<Signature> {
  const pubKeyBuffer = Buffer.from(wallet.publicKey, `hex`)
  const signMessage = createSignMessage(tx, baseRequest)
  const signatureByteArray = await ledger.sign(HD_PATH, signMessage)

  if (signatureByteArray.return_code !== 36864) {
    throw new Error(`ledger sign failed: ${signatureByteArray.error_message}`)
  }

  const signature = signatureByteArray[`signature`]
  const signatureBuffer = Buffer.from(secp256k1.signatureImport(signature))

  return createSignature(
    signatureBuffer,
    baseRequest.sequence,
    baseRequest.account_number,
    pubKeyBuffer
  )
}
