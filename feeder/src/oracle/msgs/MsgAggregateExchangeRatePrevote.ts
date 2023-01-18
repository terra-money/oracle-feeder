import { ValAddress, AccAddress } from '@terra-money/feather.js'
import { JSONSerializable } from '@terra-money/feather.js/dist/util/json'
import { Any } from '@terra-money/legacy.proto/google/protobuf/any'
import { MsgAggregateExchangeRatePrevote as MsgAggregateExchangeRatePrevote_pb } from '@terra-money/legacy.proto/terra/oracle/v1beta1/tx'

/**
 * Aggregate analog of MsgExchangeRatePrevote
 */
export class MsgAggregateExchangeRatePrevote extends JSONSerializable<
  MsgAggregateExchangeRatePrevote.Amino,
  MsgAggregateExchangeRatePrevote.Data,
  MsgAggregateExchangeRatePrevote.Proto
> {
  /**
   * @param hash vote hash
   * @param feeder validator's feeder account address
   * @param validator validator's operator address
   */
  constructor(public hash: string, public feeder: AccAddress, public validator: ValAddress) {
    super()
  }

  public static fromAmino(data: MsgAggregateExchangeRatePrevote.Amino): MsgAggregateExchangeRatePrevote {
    const {
      value: { hash, feeder, validator },
    } = data

    return new MsgAggregateExchangeRatePrevote(hash, feeder, validator)
  }

  public toAmino(): MsgAggregateExchangeRatePrevote.Amino {
    const { hash, feeder, validator } = this

    return {
      type: 'oracle/MsgAggregateExchangeRatePrevote',
      value: {
        hash,
        feeder,
        validator,
      },
    }
  }

  public static fromData(data: MsgAggregateExchangeRatePrevote.Data): MsgAggregateExchangeRatePrevote {
    const { hash, feeder, validator } = data

    return new MsgAggregateExchangeRatePrevote(hash, feeder, validator)
  }

  public toData(): MsgAggregateExchangeRatePrevote.Data {
    const { hash, feeder, validator } = this
    return {
      '@type': '/candle.oracle.MsgAggregateExchangeRatePrevote',
      hash,
      feeder,
      validator,
    }
  }

  public static fromProto(proto: MsgAggregateExchangeRatePrevote.Proto): MsgAggregateExchangeRatePrevote {
    return new MsgAggregateExchangeRatePrevote(proto.hash, proto.feeder, proto.validator)
  }

  public toProto(): MsgAggregateExchangeRatePrevote.Proto {
    const { hash, feeder, validator } = this
    return MsgAggregateExchangeRatePrevote_pb.fromPartial({
      hash,
      feeder,
      validator,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/candle.oracle.MsgAggregateExchangeRatePrevote',
      value: MsgAggregateExchangeRatePrevote_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgAggregateExchangeRatePrevote {
    return MsgAggregateExchangeRatePrevote.fromProto(MsgAggregateExchangeRatePrevote_pb.decode(msgAny.value))
  }
}

export namespace MsgAggregateExchangeRatePrevote {
  export interface Amino {
    type: 'oracle/MsgAggregateExchangeRatePrevote'
    value: {
      hash: string
      feeder: AccAddress
      validator: ValAddress
    }
  }

  export interface Data {
    '@type': '/candle.oracle.MsgAggregateExchangeRatePrevote'
    hash: string
    feeder: AccAddress
    validator: ValAddress
  }

  export type Proto = MsgAggregateExchangeRatePrevote_pb
}
