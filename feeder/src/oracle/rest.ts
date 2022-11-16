/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface OracleAggregateExchangeRatePrevote {
  hash?: string;
  voter?: string;

  /** @format uint64 */
  submit_block?: string;
}

/**
* MsgAggregateExchangeRateVote - struct for voting on
the exchange rates of Usd denominated in various assets.
*/
export interface OracleAggregateExchangeRateVote {
  exchange_rate_tuples?: OracleExchangeRateTuple[];
  voter?: string;
}

export interface OracleAsset {
  name?: string;
  denom?: string;
  amount?: string;
}

export interface OracleExchangeRateTuple {
  denom?: string;
  exchange_rate?: string;
}

/**
 * MsgAggregateExchangeRatePrevoteResponse defines the Msg/AggregateExchangeRatePrevote response type.
 */
export type OracleMsgAggregateExchangeRatePrevoteResponse = object;

/**
 * MsgAggregateExchangeRateVoteResponse defines the Msg/AggregateExchangeRateVote response type.
 */
export type OracleMsgAggregateExchangeRateVoteResponse = object;

/**
 * MsgDelegateFeedConsentResponse defines the Msg/DelegateFeedConsent response type.
 */
export type OracleMsgDelegateFeedConsentResponse = object;

/**
 * Params defines the parameters for the oracle module.
 */
export interface OracleParams {
  /** @format uint64 */
  vote_period?: string;
  vote_threshold?: string;
  reward_band?: string;

  /** @format uint64 */
  reward_distribution_window?: string;
  whitelist?: OracleAsset[];
  slash_fraction?: string;

  /** @format uint64 */
  slash_window?: string;
  min_valid_per_window?: string;
}

/**
* QueryActivesResponse is response type for the
Query/Actives RPC method.
*/
export interface OracleQueryActivesResponse {
  /** actives defines a list of the denomination which oracle prices aggreed upon. */
  actives?: string[];
}

/**
* QueryAggregatePrevoteResponse is response type for the
Query/AggregatePrevote RPC method.
*/
export interface OracleQueryAggregatePrevoteResponse {
  /** aggregate_prevote defines oracle aggregate prevote submitted by a validator in the current vote period */
  aggregate_prevote?: OracleAggregateExchangeRatePrevote;
}

/**
* QueryAggregatePrevotesResponse is response type for the
Query/AggregatePrevotes RPC method.
*/
export interface OracleQueryAggregatePrevotesResponse {
  /** aggregate_prevotes defines all oracle aggregate prevotes submitted in the current vote period */
  aggregate_prevotes?: OracleAggregateExchangeRatePrevote[];
}

/**
* QueryAggregateVoteResponse is response type for the
Query/AggregateVote RPC method.
*/
export interface OracleQueryAggregateVoteResponse {
  /**
   * aggregate_vote defines oracle aggregate vote submitted by a validator in the current vote period
   * MsgAggregateExchangeRateVote - struct for voting on
   * the exchange rates of Usd denominated in various assets.
   */
  aggregate_vote?: OracleAggregateExchangeRateVote;
}

/**
* QueryAggregateVotesResponse is response type for the
Query/AggregateVotes RPC method.
*/
export interface OracleQueryAggregateVotesResponse {
  /** aggregate_votes defines all oracle aggregate votes submitted in the current vote period */
  aggregate_votes?: OracleAggregateExchangeRateVote[];
}

/**
* QueryAssetResponse is response type for the
Query/Asset RPC method.
*/
export interface OracleQueryAssetResponse {
  /** asset from the denom */
  asset?: OracleAsset;
}

/**
* QueryAssetsResponse is response type for the
Query/Assets RPC method.
*/
export interface OracleQueryAssetsResponse {
  /** assetslist from the asset of all whitelisted denoms */
  assets?: OracleAsset[];
}

/**
* QueryExchangeRateResponse is response type for the
Query/ExchangeRate RPC method.
*/
export interface OracleQueryExchangeRateResponse {
  /** exchange_rate defines the exchange rate of Luna denominated in various Terra */
  exchange_rate?: string;
}

/**
* QueryExchangeRatesResponse is response type for the
Query/ExchangeRates RPC method.
*/
export interface OracleQueryExchangeRatesResponse {
  /** exchange_rates defines a list of the exchange rate for all whitelisted denoms. */
  exchange_rates?: V1Beta1DecCoin[];
}

/**
* QueryFeederDelegationResponse is response type for the
Query/FeederDelegation RPC method.
*/
export interface OracleQueryFeederDelegationResponse {
  /** feeder_addr defines the feeder delegation of a validator */
  feeder_addr?: string;
}

/**
* QueryMissCounterResponse is response type for the
Query/MissCounter RPC method.
*/
export interface OracleQueryMissCounterResponse {
  /**
   * miss_counter defines the oracle miss counter of a validator
   * @format uint64
   */
  miss_counter?: string;
}

/**
 * QueryParamsResponse is the response type for the Query/Params RPC method.
 */
export interface OracleQueryParamsResponse {
  /** params defines the parameters of the module. */
  params?: OracleParams;
}

/**
* QueryVoteTargetsResponse is response type for the
Query/VoteTargets RPC method.
*/
export interface OracleQueryVoteTargetsResponse {
  /**
   * vote_targets defines a list of the denomination in which everyone
   * should vote in the current vote period.
   */
  vote_targets?: string[];
}

export interface ProtobufAny {
  "@type"?: string;
}

export interface RpcStatus {
  /** @format int32 */
  code?: number;
  message?: string;
  details?: ProtobufAny[];
}

/**
* DecCoin defines a token with a denomination and a decimal amount.

NOTE: The amount field is an Dec which implements the custom method
signatures required by gogoproto.
*/
export interface V1Beta1DecCoin {
  denom?: string;
  amount?: string;
}

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, ResponseType } from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;

export interface ApiConfig<SecurityDataType = unknown> extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({ securityWorker, secure, format, ...axiosConfig }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({ ...axiosConfig, baseURL: axiosConfig.baseURL || "" });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  private mergeRequestParams(params1: AxiosRequestConfig, params2?: AxiosRequestConfig): AxiosRequestConfig {
    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.instance.defaults.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = (format && this.format) || void 0;

    if (type === ContentType.FormData && body && body !== null && typeof body === "object") {
      requestParams.headers.common = { Accept: "*/*" };
      requestParams.headers.post = {};
      requestParams.headers.put = {};
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(type && type !== ContentType.FormData ? { "Content-Type": type } : {}),
        ...(requestParams.headers || {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title oracle/genesis.proto
 * @version version not set
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Query
   * @name QueryAssets
   * @summary Assets returns all assets
   * @request GET:/terra/oracle/assets
   */
  queryAssets = (params: RequestParams = {}) =>
    this.request<OracleQueryAssetsResponse, RpcStatus>({
      path: `/terra/oracle/assets`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * No description
   *
   * @tags Query
   * @name QueryExchangeRates
   * @summary ExchangeRates returns exchange rates of all assets
   * @request GET:/terra/oracle/assets/exchange_rates
   */
  queryExchangeRates = (params: RequestParams = {}) =>
    this.request<OracleQueryExchangeRatesResponse, RpcStatus>({
      path: `/terra/oracle/assets/exchange_rates`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * No description
   *
   * @tags Query
   * @name QueryAsset
   * @summary Asset returns asset by denom
   * @request GET:/terra/oracle/assets/{denom}
   */
  queryAsset = (denom: string, params: RequestParams = {}) =>
    this.request<OracleQueryAssetResponse, RpcStatus>({
      path: `/terra/oracle/assets/${denom}`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * No description
   *
   * @tags Query
   * @name QueryExchangeRate
   * @summary ExchangeRate returns exchange rate of a denom
   * @request GET:/terra/oracle/assets/{denom}/exchange_rate
   */
  queryExchangeRate = (denom: string, params: RequestParams = {}) =>
    this.request<OracleQueryExchangeRateResponse, RpcStatus>({
      path: `/terra/oracle/assets/${denom}/exchange_rate`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * No description
   *
   * @tags Query
   * @name QueryActives
   * @summary Actives returns all active denoms
   * @request GET:/terra/oracle/denoms/actives
   */
  queryActives = (params: RequestParams = {}) =>
    this.request<OracleQueryActivesResponse, RpcStatus>({
      path: `/terra/oracle/denoms/actives`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * No description
   *
   * @tags Query
   * @name QueryVoteTargets
   * @summary VoteTargets returns all vote target denoms
   * @request GET:/terra/oracle/denoms/vote_targets
   */
  queryVoteTargets = (params: RequestParams = {}) =>
    this.request<OracleQueryVoteTargetsResponse, RpcStatus>({
      path: `/terra/oracle/denoms/vote_targets`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * No description
   *
   * @tags Query
   * @name QueryParams
   * @summary Params queries all parameters.
   * @request GET:/terra/oracle/params
   */
  queryParams = (params: RequestParams = {}) =>
    this.request<OracleQueryParamsResponse, RpcStatus>({
      path: `/terra/oracle/params`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * No description
   *
   * @tags Query
   * @name QueryAggregateVote
   * @summary AggregateVote returns an aggregate vote of a validator
   * @request GET:/terra/oracle/valdiators/{validator_addr}/aggregate_vote
   */
  queryAggregateVote = (validatorAddr: string, params: RequestParams = {}) =>
    this.request<OracleQueryAggregateVoteResponse, RpcStatus>({
      path: `/terra/oracle/valdiators/${validatorAddr}/aggregate_vote`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * No description
   *
   * @tags Query
   * @name QueryAggregatePrevotes
   * @summary AggregatePrevotes returns aggregate prevotes of all validators
   * @request GET:/terra/oracle/validators/aggregate_prevotes
   */
  queryAggregatePrevotes = (params: RequestParams = {}) =>
    this.request<OracleQueryAggregatePrevotesResponse, RpcStatus>({
      path: `/terra/oracle/validators/aggregate_prevotes`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * No description
   *
   * @tags Query
   * @name QueryAggregateVotes
   * @summary AggregateVotes returns aggregate votes of all validators
   * @request GET:/terra/oracle/validators/aggregate_votes
   */
  queryAggregateVotes = (params: RequestParams = {}) =>
    this.request<OracleQueryAggregateVotesResponse, RpcStatus>({
      path: `/terra/oracle/validators/aggregate_votes`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * No description
   *
   * @tags Query
   * @name QueryAggregatePrevote
   * @summary AggregatePrevote returns an aggregate prevote of a validator
   * @request GET:/terra/oracle/validators/{validator_addr}/aggregate_prevote
   */
  queryAggregatePrevote = (validatorAddr: string, params: RequestParams = {}) =>
    this.request<OracleQueryAggregatePrevoteResponse, RpcStatus>({
      path: `/terra/oracle/validators/${validatorAddr}/aggregate_prevote`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * No description
   *
   * @tags Query
   * @name QueryFeederDelegation
   * @summary FeederDelegation returns feeder delegation of a validator
   * @request GET:/terra/oracle/validators/{validator_addr}/feeder
   */
  queryFeederDelegation = (validatorAddr: string, params: RequestParams = {}) =>
    this.request<OracleQueryFeederDelegationResponse, RpcStatus>({
      path: `/terra/oracle/validators/${validatorAddr}/feeder`,
      method: "GET",
      format: "json",
      ...params,
    });

  /**
   * No description
   *
   * @tags Query
   * @name QueryMissCounter
   * @summary MissCounter returns oracle miss counter of a validator
   * @request GET:/terra/oracle/validators/{validator_addr}/miss
   */
  queryMissCounter = (validatorAddr: string, params: RequestParams = {}) =>
    this.request<OracleQueryMissCounterResponse, RpcStatus>({
      path: `/terra/oracle/validators/${validatorAddr}/miss`,
      method: "GET",
      format: "json",
      ...params,
    });
}
