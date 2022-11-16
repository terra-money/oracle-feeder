import { OracleAsset } from "oracle/rest"

export interface ModuleData {
    oracleVotePeriod: number
    oracleWhitelist: OracleAsset[]
    currentVotePeriod: number
    indexInVotePeriod: number
    nextBlockHeight: number
}