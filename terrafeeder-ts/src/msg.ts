import * as sha256 from 'crypto-js/sha256';

export default class MsgBuilder {
  static normalizeDecimal(decimalNumber: string) {
    const num = decimalNumber.split('.');
    let result = decimalNumber;
    if (num.length === 1) {
      result += '000000000000000000';
    } else {
      const integerPart = num[0];
      const decimalPart = num[1];

      for (let i = 18; i > decimalPart.length; i -= 1) {
        result += '0';
      }
    }
    return result;
  }

  static voteHash(salt: string, price: string, denom: string, voter: string) {
    const proof = salt + ':' + this.normalizeDecimal(price) + ':' + denom + ':' + voter;
    const hash = sha256(proof).toString();

    return hash.slice(0, 40);
  }

  static buildStdTx(msgs: object[], fee: object, memo: string) {
    return {
      type: 'auth/StdTx',
      value: {
        fee,
        memo,
        msg: msgs,
        signatures: null
      }
    };
  }

  static buildPrevoteMsg(hash: string, denom: string, feeder: string, validator: string) {
    return {
      type: 'oracle/MsgPricePrevote',
      value: {
        hash,
        denom,
        feeder,
        validator
      }
    };
  }

  static buildVoteMsg(price: string, salt: string, denom: string, feeder: string, validator: string) {
    return {
      type: 'oracle/MsgPriceVote',
      value: {
        price,
        salt,
        denom,
        feeder,
        validator
      }
    };
  }
}
