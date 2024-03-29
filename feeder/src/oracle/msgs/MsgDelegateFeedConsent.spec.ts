import { MsgDelegateFeedConsent } from './MsgDelegateFeedConsent'
import * as MsgDelegateFeedConsentAmino from './MsgDelegateFeedConsent.data.json'

describe('MsgDelegateFeedConsent', () => {
  it('deserializes', () => {
    MsgDelegateFeedConsentAmino.txs.forEach((txinfo: any) => {
      txinfo.tx.value.msg.forEach((msg: any) => {
        if (msg.type == 'oracle/MsgDelegateFeedConsent') {
          const e = MsgDelegateFeedConsent.fromAmino(msg)
          expect(e.toAmino()).toEqual(msg)
        }
      })
    })
  })
})
