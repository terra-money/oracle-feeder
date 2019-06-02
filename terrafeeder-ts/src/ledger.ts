import * as ledger from 'ledger-cosmos-js';
import * as keyUtils from './keyUtils';

const LONG_TIMEOUT = 45000;
const HD_PATH = [44, 118, 0, 0, 0];

function getLedgerNode() {
  return ledger.comm_node.create_async(LONG_TIMEOUT, false);
}

function getLedgerApp(ledgerNode) {
  return new ledger.App(ledgerNode);
}

async function getAccountFromLedger(ledger) {
  const pubKey = await ledger.publicKey(HD_PATH);

  if (pubKey.return_code !== 36864) {
    throw new Error('cannot get pubkey from ledger');
  }

  return {
    name: '',
    publicKey: pubKey.compressed_pk,
    terraAddress: keyUtils.createTerraAddress(new Buffer(pubKey.compressed_pk)),
    wallet: ''
  };
}

module.exports = {
  getLedgerNode,
  getLedgerApp,
  getAccountFromLedger
};
