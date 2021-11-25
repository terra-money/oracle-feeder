
On discussing what's a good task to pick, Jared has pointed out to me that the default version of the oracle is an underserved place to look into. He directed my attention to https://terra.stake.id/#/. A few high level suggestions are down at the bottom in "What i can contribute section".



## I found these few bits of information in the docs (what are the "miss" conditions, how is reward band calculated) to be driving the discovery process:

#### Feeder

https://docs.terra.money/Reference/Terra-core/Module-specifications/spec-oracle.html#voting-procedure

...Leads to thinking that possible causes of vote misses might lie in **(i)** not having fulfilled all denomination votes... -- *have to check what those are*(WhiteList?) -- and could write a util for tracking and reporting that. Or, **(ii)** failing to land in the reward band. 

------

A VotePeriod during which either of the following events occur is considered a "miss":

1. **The validator fails to submits a vote for Luna exchange rate against each and every denomination specified inWhitelist.**

2. **The validator fails to vote within the reward band around the weighted median for one or more denominations.**

During every [ SlashWindow ](https://docs.terra.money/Reference/Terra-core/Module-specifications/spec-oracle.html#slashwindow), participating validators must maintain a valid vote rate of at least [MinValidPerWindow ( Default: 5%) ](https://docs.terra.money/Reference/Terra-core/Module-specifications/spec-oracle.html#minvalidperwindow), lest they get their stake slashed (currently set to [ 0.01% ](https://docs.terra.money/Reference/Terra-core/Module-specifications/spec-oracle.html#slashfraction)).
The slashed validator is automatically temporarily "jailed" by the protocol (to protect the funds of delegators), and the operator is expected to fix the discrepancy promptly to resume validator participation.


#### Reward Band

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

- A useful time series data is logging posterior reward band deviation as the precommits are revealed, basically to see how far off the median yours land. 

# Some questions that popped up along the way

- do the validators choose which prices to whitelist or is it also a parameter of the chain? [ Default: [ukrt, uusd, usdr] ](https://docs.terra.money/Reference/Terra-core/Module-specifications/spec-oracle.html#whitelist)

- if it changes, is there a way to get $R$ from the chain in the real time during the voting period?[ 7% is the default ](https://docs.terra.money/Reference/Terra-core/Module-specifications/spec-oracle.html#rewardband)

- In [ feeder/src/vote.ts ](feeder/src/vote.ts#L153). This somewhat seems like a way to silently fail and is not reported. Is this abstinence?

3ddf51347ba7c2bc4a8e1e26ee9d1cbf81034516@162.55.244.250:27656					
5618b310cfac1271a34f5c38576a5dceb1a641e6@162.55.132.48:15606					
58c9a742184ff7d0bdd65315cf6ea8fab462d66f@162.55.131.238:15606					
7cd549f6dab19000c260336c1a34479f8ff42964@54.154.91.139:26656					
6ddd22cca53d2f0d03043614fc9f76acc72def8c@seed.terra-mainnet.everstake.one:26656					
8026dbfb33bf83a2b8989c96c82c983070d26e40@35.86.26.38:26656					
e5daf41330c94ea81e80a3c52e52baa1b6d14fe1@terra-mainnet.0base.vc:26656					
12e5d8f3602f63644cf548ffc83d886b5715a29f@kenaz.coinbevy.com:26656					
c94edbb749dccc61558049c8050cdac95c894cc9@35.227.90.116:26656					
1600175a7a05f67ee0231cd94d24e7d1eb52ba53@terra-seed-mainnet.blockngine.io:26676					
65d86ab6024153286b823a3950e9055478effb04@terra.inotel.ro:26656					
42928a07c8fe3313cfbfba78f296bf713e12a0a1@seed-columbus.terra.01node.com:26656					
2b5ecb577e0fec2f15bc6c855dfe158f072a32a8@mnet-seed.terra.nitawa.systems:26656					
73ff2b4253a8cc44d7527364ccfa220a60091298@3.237.91.53:26656					
66aa2bac58b137e17865035567fc85f06953d4af@terra-seed01.stakers.finance:26656					
2934a56f925fe7e7dcbe8ad0de10ae23791cf9b3@65.108.72.121:26656					
235b5e97d7932e72fc846adcc712cd71e2a1b1be@seed.terra.lunarnode.org:26656					
21eb4b16acaacea0c09a68faf73e618c6318aa26@seed01.autismcapital.xyz:26656					
11aa3f340ff138d39a27c223f9ac0987bb605c5c@3.34.160.113:26656					
7575f4fdf92c4b63b2bf3e57ea0bced03b004792@3.35.101.38:26656					
48fca58b12438e618a596e9aab634b4ef46ea67b@34.218.166.180:26656					
80d1436ad592423a534a9223baf04ce12a616a76@columbus-seed.onestar.ee:26656					
1757b212d15840d9a8781bb4a8c201a9dd70d0fa@seed-mainnet.moonshot.army:26656					
5e7cdd3f0684dbab8d7fa5d18de3e9194859be03@seed.terra.btcsecure.io:26656					
091bc80f53802020b7573487eda01083c942a2cf@terra2.aurastake.com:26656					
69955cf4521f10cccf20c7bbec38ed5c4cb47145@seed.terradactyl.io:26656					
641645367d4546a6d12d01fbf75cb40117e1a19b@63.35.218.188:26656					
4caf3c19f1a1d1436c6f7837aabd50ca5bfad027@seed.leviathan.monster:26656					
73c0ec0bf48b32e0670e4d805ac383b592db9a22@20.79.223.3:26656					
902108566ccbd8e48ce77923a8fb060a6866e7c2@20.79.222.189:26656					
058831b15272669d2de342862fc2667d5ef8be1d@seed.terra.stakewith.us:48856					
b1bdf6249fb58b4c8284aff8a9c5b2804d822261@seed.terra.synergynodes.com:26656					
4f40e721ef9d43e540ab853e4d178ee4814712ea@35.228.229.136:26656					
69691fcb39455940693133dfaac3e4e337c1f7ef@35.189.155.44:26656					
9849507ea2a33960678c517d2d774f802a4b2d65@138.91.27.245:26656					
af55a55a67ca0c000a7f768559ff38883d17f694@seed.terra.staker.space:26656					
be6cfededb21063e5c37e4046f0cefcc4a9840da@seed.terra.setten.io:26656					
b363afa79d81bbc9d3b63657088a484398790ced@91.193.116.34:26656					
d58cd901c30441df6d32323ca0935c1d6ef801d9@95.217.226.95:26099					
92bcd725fb130530263704a4716da9c942becfa7@seed.mcontrol.ml:26656					
7080247c1c78f86c6df77f3e714fb4983ac3c94f@seed.terra-mainnet.sabai.finance:26656					
fd777409b042fe41691011eb6ecdeaad5317f8e9@35.240.133.1:26656					
88d4b1517ccf60be0a7a41793948ab7af3750315@terra-mainnet-seed-1.stakin-nodes.com:26656e86d50d69f9219839f9cd85d3329f186ec741478@terrabackup.stakely.io:26656					
eb67380db62292506d41f28b1b77785a62a0f298@seed.terra.kkvalidator.com:26656					
0915d3431ff7af14a6749afc12e6ba45c1b737da@34.152.3.90:26656					
4f2d05162119a665b267599d3c86a936d65a9af0@seed.terra.rockx.com:26656					
406bcf90a7b29df6ae475a1f94abe04ebde805af@mainnet.seed.terraindia.info:26656					
1690a0c809314f2ff7f8e3ac559d5f30e7ba047b@65.108.9.149:26656					
2c1b557739450f946ba38aebe113cad69c23cf98@20.199.97.106:26656					
b976e8d1f94f4e2d554be4ca590929fa5ce320c0@188.166.95.126:26656					
9825d4993fe6e948f6c800f9a4bbdb89ad120e76@34.79.212.227:26656					
85963d3827ceab08be38285fbe354b90a2e45fef@seed-mainnet.terra.lunastations.online:36656				4df743bfcf507e603411c712d8a9b3adb5e44498@seed.terra.genesislab.net:26656					
b65bc05a140f2d292055d2afbb00997023aed5ed@52.196.61.226:26656					
bd8504b7c84472e1b15589c2adbb2c62ecd36e02@terra-mainnet-seed.orbitalcommandvalidator.com:26302
fb75d47bdcfe1924bb67d05b78d02ebf68ddc971@ec2-54-183-112-31.us-west-1.compute.amazonaws.com
26656b96b058af0637613c47f0fc7affc07446ebac343@terra-mainnet-seed.blockstake.xyz:26656				b977f4a6fe45b2621c2e009cdedc1d57c7f977ff@65.0.190.90:26656					
ad2c60e2d9b5566385a192fac79ed540955266a4@194.163.167.27:26656					
a4950a460b60de640432701d0c5b964ba680254f@162.55.244.169:26656					
0e2ddf13890eaaceb7f177432f6c3f764af16782@95.168.167.83:26656					
877c6b9f8fae610a4e886604399b33c0c7a985e2@terra.mainnet.seed.forbole.com:10056					
9d08e286bd1fd1bb29c52ee8bb199b62a8ac564c@85.118.207.63:26656					


 DE, Germany
 DE, Germany
 DE, Germany
 IE, Ireland
 DE, Germany
 US, United States
 US, United States
 US, United States
 US, United States
 DE, Germany
 RO, Romania
 GB, United Kingdom
 US, United States
 US, United States
 CH, Switzerland
 US, United States
 DE, Germany
 DE, Germany
 US, United States
 US, United States
 US, United States
 DE, Germany
 US, United States
 DE, Germany
 SG, Singapore
 US, United States
 IE, Ireland
 US, United States
 US, United States
 US, United States
 US, United States
 US, United States
 EU, Europe
 SG, Singapore
 JP, Japan
 FR, France
 DE, Germany
 GB, United Kingdom
 FI, Finland
 FR, France
 DE, Germany
 AS, American Samoa
 US, United States
 CA, Canada
 US, United States
 SG, Singapore
 US, United States
 US, United States
 US, United States
 NL, Netherlands
 US, United States
 IE, Ireland
 FI, Finland
 JP, Japan
 US, United States
 US, United States
 SG, Singapore
 US, United States
 DE, Germany
 DE, Germany
 NL, Netherlands
 US, United States
 SE, Sweden
 SG, Singapore
 US, United States
 US, United States
 US, United States
 NL, Netherlands
 US, United States
 IE, Ireland
 FI, Finland
 JP, Japan
 US, United States
 US, United States
 SG, Singapore
 US, United States
 DE, Germany
 DE, Germany
 NL, Netherlands
 US, United States
 SE, Sweden
 SG, Singapore
 US, United States
 US, United States
 US, United States
 NL, Netherlands
 US, United States
 IE, Ireland
 FI, Finland
 JP, Japan
 US, United States
 US, United States
 SG, Singapore
 US, United States
 DE, Germany
 DE, Germany
 NL, Netherlands
 US, United States
 SE, Sweden
 SG, Singapore
 US, United States
 US, United States
 US, United States
 NL, Netherlands
 US, United States
 IE, Ireland
 FI, Finland
 JP, Japan
 US, United States
 US, United States
 SG, Singapore
 US, United States
 DE, Germany
 DE, Germany
 NL, Netherlands
 US, United States
 SE, Sweden
 SG, Singapore
 US, United States
 US, United States
 US, United States
 NL, Netherlands
 US, United States
 IE, Ireland
 FI, Finland
 JP, Japan
 US, United States
 US, United States
 SG, Singapore
 US, United States
 DE, Germany
 DE, Germany
 NL, Netherlands
 US, United States
 SE, Sweden
 SG, Singapore
 US, United States
 US, United States
 US, United States
 NL, Netherlands
 US, United States
 IE, Ireland
 FI, Finland
 JP, Japan
 US, United States
 US, United States
 SG, Singapore
 US, United States
 DE, Germany
 DE, Germany
 NL, Netherlands
 US, United States
 SE, Sweden
 SG, Singapore
 US, United States
 US, United States
 US, United States
 NL, Netherlands
 US, United States
 IE, Ireland
 FI, Finland
 JP, Japan
 US, United States
 US, United States
 SG, Singapore
 US, United States
 DE, Germany
 DE, Germany
 NL, Netherlands
 US, United States
 SE, Sweden




```bash
awk -F ":" '{print $1}' lcds | awk -F "@" '{print $2}'  | xargs -I % geoiplookup %
```

- a little confused wrt the blockheight/voteperiod calculation. didn't bother searching docs, but a link in the coode comments would be nice

- not sure if every lcd is supposed to have its own chain id. the LCDConfig seems to imply so.