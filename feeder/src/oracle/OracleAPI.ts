import { ValAddress, Denom, Coin, Coins, AccAddress, Dec, LCDClient } from '@terra-money/feather.js'
import { BaseAPI } from '@terra-money/feather.js/dist/client/lcd/api/BaseAPI'
import { APIParams, APIRequester } from '@terra-money/feather.js/dist/client/lcd/APIRequester'
import { AggregateExchangeRatePrevote } from './AggregateExchangeRatePrevote'
import { AggregateExchangeRateVote } from './AggregateExchangeRateVote'

export interface OracleWhitelist {
  name: string
  denom: string
  amount: Dec
}

export namespace OracleWhitelist {
  export interface Data {
    name: string
    denom: string
    amount: string
  }
}

export interface OracleParams {
  /** Number of blocks that define the period over which new votes must be submitted for the oracle data. */
  vote_period: number

  /** Ratio of voting power that must be reached for a denomination to be considered "active." */
  vote_threshold: Dec

  /** The ratio of the band around the weighted median of the voted exchange rates whose voters are eligible for rewards. Votes that reported exchange rates that lie beyond this band are considered misses. */
  reward_band: Dec

  /** Number of blocks that define the period over which oracle rewards from non-missed Oracle votes accrue. They are disbursed at the end of these periods. */
  reward_distribution_window: number

  /** List of active denominations that must be voted on. */
  whitelist: OracleWhitelist[]

  /** Percentage of stake slashed once per slash window. */
  slash_fraction: Dec

  /** Number of blocks that define the period over which slashing penalties for missing votes are incurred. */
  slash_window: number

  /** Minimum percentage of valid (non-miss) exchange rate votes per slash window. */
  min_valid_per_window: Dec
}

export namespace OracleParams {
  export interface Data {
    vote_period: string
    vote_threshold: string
    reward_band: string
    reward_distribution_window: string
    whitelist: OracleWhitelist.Data[]
    slash_fraction: string
    slash_window: string
    min_valid_per_window: string
  }
}

export interface OracleWhitelist {
  name: string
  denom: string
  amount: Dec
}

export namespace OracleWhitelist {
  export interface Data {
    name: string
    denom: string
    amount: string
  }
}

export class OracleAPI extends BaseAPI {
  c: APIRequester
  constructor(public lcd: LCDClient, chainId: string) {
    super(lcd.apiRequesters, lcd.config)
    this.c = this.getReqFromChainID(chainId)
  }

  /**
   * Gets the Oracle module's currently registered exchange rates for all available denominations.
   */
  public async exchangeRates(params: APIParams = {}): Promise<Coins> {
    return this.c
      .get<{ exchange_rates: Coins.Data }>(`/terra/oracle/denoms/exchange_rates`, params)
      .then((d) => Coins.fromData(d.exchange_rates))
  }

  /**
   * Gets the Oracle module's currently registered exchange rate for the specific denomination.
   * @param denom denomination of one of the available assets
   */
  public async exchangeRate(denom: Denom, params: APIParams = {}): Promise<Coin | undefined> {
    return this.c.get<{ exchange_rate: string }>(`/terra/oracle/denoms/${denom}/exchange_rate`, params).then((d) =>
      Coin.fromData({
        denom,
        amount: d.exchange_rate,
      })
    )
  }

  /**
   * Gets the current list of active denominations.
   */
  public async activeDenoms(params: APIParams = {}): Promise<Denom[]> {
    return this.c.get<{ actives: Denom[] }>(`/terra/oracle/denoms/actives`, params).then((d) => d.actives)
  }

  /**
   * Gets the registered feeder address associated with the validator. The feeder address is the
   * Terra account that is permitted to sign Oracle vote messages in the validator's name.
   * @param validator validator's operator address
   */
  public async feederAddress(validator: ValAddress, params: APIParams = {}): Promise<AccAddress> {
    return this.c
      .get<{ feeder_addr: AccAddress }>(`/terra/oracle/validators/${validator}/feeder`, params)
      .then((d) => d.feeder_addr)
  }

  /**
   * Gets the number of missed oracle votes for the validator over the current slash window.
   * @param validator validator's operator address
   */
  public async misses(validator: ValAddress, params: APIParams = {}): Promise<number> {
    return this.c
      .get<{ miss_counter: string }>(`/terra/oracle/validators/${validator}/miss`, params)
      .then((d) => Number.parseInt(d.miss_counter))
  }

  /**
   * Gets the validator's current submitted aggregate prevote
   * @param validator validator's operator address
   */
  public async aggregatePrevote(validator: ValAddress, params: APIParams = {}): Promise<AggregateExchangeRatePrevote> {
    return this.c
      .get<{ aggregate_prevote: AggregateExchangeRatePrevote.Data }>(
        `/terra/oracle/validators/${validator}/aggregate_prevote`,
        params
      )
      .then((d) => AggregateExchangeRatePrevote.fromData(d.aggregate_prevote))
  }

  /**
   * Gets the validator's current submitted aggregate vote
   * @param validator validator's operator address
   */
  public async aggregateVote(validator: ValAddress, params: APIParams = {}): Promise<AggregateExchangeRateVote> {
    return this.c
      .get<{ aggregate_vote: AggregateExchangeRateVote.Data }>(
        `/terra/oracle/validators/${validator}/aggregate_vote`,
        params
      )
      .then((d) => AggregateExchangeRateVote.fromData(d.aggregate_vote))
  }

  /**
   * Gets the current Oracle module's parameters.
   */
  public async parameters(params: APIParams = {}): Promise<OracleParams> {
    return this.c.get<{ params: OracleParams.Data }>(`/terra/oracle/params`, params).then(({ params: d }) => ({
      vote_period: Number.parseInt(d.vote_period),
      vote_threshold: new Dec(d.vote_threshold),
      reward_band: new Dec(d.reward_band),
      reward_distribution_window: Number.parseInt(d.reward_distribution_window),
      whitelist: d.whitelist.map((x) => ({
        name: x.name,
        denom: x.denom,
        amount: new Dec(x.amount),
      })),
      slash_fraction: new Dec(d.slash_fraction),
      slash_window: Number.parseInt(d.slash_window),
      min_valid_per_window: new Dec(d.min_valid_per_window),
    }))
  }
}
