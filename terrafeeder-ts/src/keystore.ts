import * as CryptoJS from 'crypto-js';
import * as fs from 'fs';
import * as ledger from 'ledger-cosmos-js';
import * as wallet from './wallet';

import { signatureImport } from 'secp256k1';

const keySize = 256;
const iterations = 100;

const keyFilename = `voter.json`;
const defaultKeyName = `voter`;
const Timeout = 5;
const hdpath = [44, 118, 0, 0, 0];

import { generateWalletFromSeed } from './wallet';

/* eslint-enable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

function signByLedger(byteTx) {
    return ledger.comm_node.create_async(Timeout, true).then(function(comm) {
        let app = new ledger.App(comm);

        return app.sign(hdpath, byteTx);
    });
}

export function getAccountFromLedger() {
    return ledger.comm_node.create_async(Timeout, true).then(function(comm) {
        let app = new ledger.App(comm);

        return {
            name: defaultKeyName,
            address: wallet.createTerraAddress(app.publicKey(hdpath)),
            wallet: ``,
        };
    });
}

export async function signTx(voter, ledgerMode, tx, baseRequest) {
    if (ledgerMode) {
        const signMessage = wallet.createSignMessage(tx, baseRequest);
        const signatureByteArray = await signByLedger(signMessage);
        const signatureBuffer = signatureImport(signatureByteArray);

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

export function loadKeys() {
    try {
        return JSON.parse(fs.readFileSync(keyFilename, `utf8`) || `[]`);
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

export function getKey(password) {
    const keys = loadKeys();
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

function setKey(wallet, password) {
    const keys = [];
    if (keys.find(key => key.name === defaultKeyName)) throw new Error(`Key with that name already exists`);

    const ciphertext = encrypt(JSON.stringify(wallet), password);

    keys.push({
        name: defaultKeyName,
        address: wallet.terraAddress,
        wallet: ciphertext,
    });

    fs.writeFileSync(keyFilename, JSON.stringify(keys));
}

export async function importKey(password, seed) {
    const wallet = await generateWalletFromSeed(seed);
    setKey(wallet, password);
}
