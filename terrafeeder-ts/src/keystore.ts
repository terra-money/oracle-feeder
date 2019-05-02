import * as CryptoJS from 'crypto-js';
import * as fs from 'fs';
import * as ledger from 'ledger-cosmos-js';
import * as wallet from './wallet';

import { signatureImport } from 'secp256k1';

const keySize = 256;
const iterations = 100;

const defaultKeyName = `voter`;
const LongTimeout = 45000;
const hdpath = [44, 118, 0, 0, 0];

import { generateWalletFromSeed } from './wallet';

/* eslint-enable @typescript-eslint/camelcase */

/* eslint-disable @typescript-eslint/explicit-function-return-type */

export async function getLedgerNode() {
    return await ledger.comm_node.create_async(LongTimeout, false);
}

export async function getLedgerApp(ledgerNode) {
    return new ledger.App(ledgerNode);
}

async function signByLedger(ledger, byteTx) {
    return await ledger.sign(hdpath, byteTx);
}

export async function getAccountFromLedger(ledger) {
    const pubKey = await ledger.publicKey(hdpath);

    if (pubKey.return_code != 36864) {
        console.error(`getting account failed`);
        return null;
    }

    return {
        name: defaultKeyName,
        publicKey: pubKey.compressed_pk,
        terraAddress: wallet.createTerraAddress(new Buffer(pubKey.compressed_pk)),
        wallet: ``,
    };
}

export async function signTx(ledger, voter, ledgerMode, tx, baseRequest) {
    if (ledgerMode) {
        const signMessage = wallet.createSignMessage(tx, baseRequest);
        const signatureByteArray = await signByLedger(ledger, signMessage);

        if (signatureByteArray.return_code != 36864) {
            console.error(`Signing error : ${signatureByteArray.error_message}`);
        }

        const signature = signatureByteArray[`signature`];
        const signatureBuffer = signatureImport(signature);

        return wallet.createSignature(
            signatureBuffer,
            baseRequest.sequence,
            baseRequest.account_number,
            voter.publicKey,
        );
    } else {
        // get private key to sign
        return wallet.sign(tx, voter, baseRequest);
    }
}

export function loadKeys(keystore) {
    try {
        return JSON.parse(fs.readFileSync(keystore, `utf8`) || `[]`);
    } catch (UnhandledPromiseRejectionWarning) {
        return [];
    }
}

function decrypt(transitmessage, pass) {
    const salt = CryptoJS.enc.Hex.parse(transitmessage.substr(0, 32));
    const iv = CryptoJS.enc.Hex.parse(transitmessage.substr(32, 32));
    const encrypted = transitmessage.substring(64);

    const key = CryptoJS.PBKDF2(pass, salt, {
        keySize: keySize / 32,
        iterations: iterations,
    });

    return CryptoJS.AES.decrypt(encrypted, key, {
        iv: iv,
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC,
    }).toString(CryptoJS.enc.Utf8);
}

export function getKey(keystore, password) {
    const keys = loadKeys(keystore);
    const key = keys.find(key => key.name === defaultKeyName);
    try {
        const decrypted = decrypt(key.wallet, password);
        return JSON.parse(decrypted);
    } catch (err) {
        throw new Error(`Incorrect password`);
    }
}

// TODO needs proof reading
function encrypt(msg, pass) {
    const salt = CryptoJS.lib.WordArray.random(128 / 8);

    const key = CryptoJS.PBKDF2(pass, salt, {
        keySize: keySize / 32,
        iterations: iterations,
    });

    const iv = CryptoJS.lib.WordArray.random(128 / 8);

    const encrypted = CryptoJS.AES.encrypt(msg, key, {
        iv: iv,
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC,
    });

    // salt, iv will be hex 32 in length
    // append them to the ciphertext for use  in decryption
    return salt.toString() + iv.toString() + encrypted.toString();
}

function setKey(keystore, wallet, password) {
    const keys = [];
    if (keys.find(key => key.name === defaultKeyName)) throw new Error(`Key with that name already exists`);

    const ciphertext = encrypt(JSON.stringify(wallet), password);

    keys.push({
        name: defaultKeyName,
        address: wallet.terraAddress,
        wallet: ciphertext,
    });

    fs.writeFileSync(keystore, JSON.stringify(keys));
}

export async function importKey(keystore, password, seed) {
    const wallet = await generateWalletFromSeed(seed);
    setKey(keystore, wallet, password);
}
