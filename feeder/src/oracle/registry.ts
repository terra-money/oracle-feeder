import { GeneratedType } from "@cosmjs/proto-signing";
import { MsgAggregateExchangeRatePrevote } from "./types/oracle/tx";
import { MsgDelegateFeedConsent } from "./types/oracle/tx";
import { MsgAggregateExchangeRateVote } from "./types/oracle/tx";

const msgTypes: Array<[string, GeneratedType]>  = [
    ["/oracle.oracle.MsgAggregateExchangeRatePrevote", MsgAggregateExchangeRatePrevote],
    ["/oracle.oracle.MsgDelegateFeedConsent", MsgDelegateFeedConsent],
    ["/oracle.oracle.MsgAggregateExchangeRateVote", MsgAggregateExchangeRateVote],
];

export { msgTypes }