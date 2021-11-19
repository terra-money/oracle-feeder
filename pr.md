
On discussing what's a good task to pick, Jared has pointed out to me that the default version of the oracle is an underserved to look. He directed my attention to https://terra.stake.id/#/


- do the validators choose which prices to whitelist or is it also a parameter of the chain? [ Default: [ukrt, uusd, usdr] ](https://docs.terra.money/Reference/Terra-core/Module-specifications/spec-oracle.html#whitelist)

- if it changes, is there a way to get $R$ from the chain in the real time during the voting period?[ 7% is the default ](https://docs.terra.money/Reference/Terra-core/Module-specifications/spec-oracle.html#rewardband)


# What i can contribute 

- Specify a main and a backup(s) LCDs. When the main fails, switch to backup as usual, BUT either keep checking to see if main came back online every X minutes or constantly trying main and only using backup when main is not replying (the latter being more resilient, as it is true real time failover). [here](https://github.com/rtviii/oracle-feeder/blob/baef2a4a02f57a2ffeaa207932b2e03d7fb0fb25/feeder/src/vote.ts#L327-329) and [here](https://github.com/rtviii/oracle-feeder/blob/baef2a4a02f57a2ffeaa207932b2e03d7fb0fb25/feeder/src/vote.ts#L340-L351)

- Could implement more crypto providers. In fact most of the existing ones seem to only differ due to a given exchange's websocket's data shape. Could also try to reformat the WSQuoter class such that only that part is exposed for an even easier plug and play for future quoters, although maybe there are plenty many already. Haven't found volume-correction for exchanges(an their feeds), easy to bring in too. Just a few examples:

    - OKEX        lists  LUNA     /USDT     : https: //www.okex.com/docs-v5/en/#market-maker-program
    - BYBIt       lists  LUNA     /USDT     : https:                                                  //bybit-exchange.github.io/docs/inverse/#t-introduction
    - Gemini      lists  LUNA     /USD      : https:                                                  //docs.gemini.com/rest-api/
    - Gateio lists  LUNA against both /USDT and /USD: https: //www.gate.io/en/developers
    - Bitfinex    lists LUNA /USDT and /USD      : https: //docs.bitfinex.com 

- Would be happy to type-comment and annotate code as i go, look into telemetry on the feeder side

- A neat developer usability thing would be to type Price pairs in terms of [ type literals ](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html) as opposed to strings. For example
```typescript
// +/../Whitelist.d.ts
type Luna                                 = "LUNA"
type WhitelistedSymbols                   = "HEY" | "GM" | "MOON"
type ValidTradingPairs                    = `${LUNA}/${WhitelistedSymbols}`

// .../src/vote.ts
var valid_trading_pair:ValidTradingPairs = "LUNA/HEY"    // OK
var new_trading_pair:ValidTradingPairs   = "LUNA/OTHER"  //Type '"LUNA/OTHER"' is not assignable to type '"LUNA/HEY" | "LUNA/GM" | "LUNA/MOON"'.ts(2322). Easy to follow up the definition, anywhere in the codebase, less string parsing = less erorrs.
```






# Feeder

https://docs.terra.money/Reference/Terra-core/Module-specifications/spec-oracle.html#voting-procedure

...Leads to thinking that possible causes of vote misses might lie in **(i)** not having fulfilled all denomination votes... -- *have to check what those are*(WhiteList?) -- and could write a util for tracking and reporting that. Or, **(ii)** failing to land in the reward band. 


------

A VotePeriod during which either of the following events occur is considered a "miss":

1. **The validator fails to submits a vote for Luna exchange rate against each and every denomination specified inWhitelist.**

2. **The validator fails to vote within the reward band around the weighted median for one or more denominations.**

During every [ SlashWindow ](https://docs.terra.money/Reference/Terra-core/Module-specifications/spec-oracle.html#slashwindow), participating validators must maintain a valid vote rate of at least [MinValidPerWindow ( Default: 5%) ](https://docs.terra.money/Reference/Terra-core/Module-specifications/spec-oracle.html#minvalidperwindow), lest they get their stake slashed (currently set to [ 0.01% ](https://docs.terra.money/Reference/Terra-core/Module-specifications/spec-oracle.html#slashfraction)).
The slashed validator is automatically temporarily "jailed" by the protocol (to protect the funds of delegators), and the operator is expected to fix the discrepancy promptly to resume validator participation.


### Reward Band

(I think it's a good note to add to the docs for those just starting up)

Let $M$ be the weighted median, be the standard deviation of the votes in the ballot, and be the RewardBand parameter. The band around the median is set to be  $\epsilon = max(\sigma, R/2)$. All valid (i.e. bonded and non-jailed) validators that submitted an exchange rate vote in the interval $[M-\epsilon,M+\epsilon]$ should be included in the set of winners, weighted by their relative vote power.


------



# Some feedback from "the community" about missed votes/precommits


| Operation Name | Using default oracle code |Price providers situation |LCD Running on the same machine as oracle| Additional Comments|
|:---:           |:---:                      |:---:                             |:---:| --:|
|DSRV           Labs    | No            |       N            /A |N/A||
|Tavis          Digital | Yes           |       Two           free/One paid provider | Not until recently| 200+ missed oracle votes mostly happened before the columbus-5 launch (end-Sept. '21), when we did not have a dedicated Oracle server|
|Everstake              | Yes           |       non          -default sources |Yes|
|Staky                  | Yes           |       Default      , curency layer | Yes ||
|Stakesystems  .io      | yes| currencylayer          |deployment consists of sentries, validators and LCD node + loadbalancer|
|stakewith     .us      | yes          |default|No           |
|chainofsecrets||       | recently              changed       hardware, validator chews lots of RAM due to WASM|
|chainlayer             | yes          |        currencylayer| own rpc, loadbalancer, yes | quote switching to columbus-5 |
|ezstaking     ||       | taken                 out           of the validator pool -- lack of funds|
|SolidStake             | yes          |        additional    trusted source|monitoring, "reliable hardware" |
|Syncnode               | yes          ||       running       on bare metal, lots of resources|
|FreshLuna              | yes          |        one           of the paid sources||
|..|..|..|..|..|





In [ feeder/src/vote.ts ](feeder/src/vote.ts#L153). This somewhat seems like a way to silently fail and is not reported. Is this abstinence?
