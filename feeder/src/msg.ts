import * as crypto from 'crypto';

export interface Amount {
  denom: string;
  amount: string;
}

export interface Fee {
  gas: string;
  amount: Amount[];
}

export interface Signature {
  signature: string;
  account_number: string;
  sequence: string;
  pub_key: {
    type: string;
    value: string;
  };
}

export interface StdTx {
  fee: Fee;
  memo: string;
  msg: object[];
  signatures: Signature[];
}

export interface Coin {
  denom: string;
  amount: string;
}

export function generateStdTx(msgs: object[], fee: Fee, memo: string = ''): StdTx {
  return {
    fee,
    memo,
    msg: msgs,
    signatures: [],
  };
}

function normalizeDecimal(decimalNumber: string) {
  const num = decimalNumber.split('.');
  let result = decimalNumber;
  if (num.length === 1) {
    result += '000000000000000000';
  } else {
    // const integerPart = num[0];
    const decimalPart = num[1];

    for (let i = 18; i > decimalPart.length; i -= 1) {
      result += '0';
    }
  }
  return result;
}

export function generateVoteHash(salt: string, price: string, denom: string, voter: string) {
  const proof = salt + ':' + normalizeDecimal(price) + ':' + denom + ':' + voter;
  const hash = crypto.createHash('sha256').update(proof).digest('hex');

  return hash.slice(0, 40);
}

export function generatePrevoteMsg(hash: string, denom: string, feeder: string, validator: string) {
  return {
    type: 'oracle/MsgExchangeRatePrevote',
    value: {
      hash,
      denom,
      feeder,
      validator,
    },
  };
}

export function generateVoteMsg(
  price: string,
  salt: string,
  denom: string,
  feeder: string,
  validator: string
) {
  return {
    type: 'oracle/MsgExchangeRateVote',
    value: {
      exchange_rate: price,
      salt,
      denom,
      feeder,
      validator,
    },
  };
}
