# Terra Oracle Feeder

This contains the Oracle feeder software that is used internally by Terraform Labs' validator nodes for periodically submitting oracle votes for the exchange rate of LUNA. This implementation can be used as-is, but also can serve as a reference for creating your own custom oracle feeder. For more information regarding the oracle process, please refer to the [oracle module specs](https://docs.terra.money/dev/spec-oracle).

## Overview

This solution has 2 components:

1. [`price-server`](price-server/)

   - Obtain information from various data sources (exchanges, forex data, etc)
   - Use data to compute the exchange rates of LUNA for a given set of fiat denominations
   - Most recent LUNA exchange rates are available through HTTP endpoint

2. [`feeder`](feeder/)

   - Reads LUNA exchange rates from a data source (`price-server`)
   - Periodically submits vote and prevote messages following the oracle voting procedure

You can easily modify the logic for how LUNA exchange rates are computed by either directly modifying `price-server` or replacing the input stream for `feeder`.

## Prerequisites

- Install [Node.js version 12 or greater](https://nodejs.org/)

## Instructions

1. Clone this repository

```sh
git clone https://github.com/terra-money/oracle-feeder
cd oracle-feeder
```

2. Configure and launch `price-server`, following instructions [here](price-server/).

```sh
cd price-server
npm install

# Copy sample config file
cp ./config/default-sample.js ./config/default.js
# make edits
vim ./config/default.js

# price is available at `http://127.0.0.1:8532/latest`
npm run start
```

3. Configure and launch `feeder`, following instructions [here](feeder/).

```sh
cd feeder
npm install

# configure to use feeder account
npm start update-key

# start voting
npm start vote -- \
   --source   http://localhost:8532/latest \
   --lcd      https://blockdaemon-terra-lcd.api.bdnodes.net:1317 \
   --lcd      162.55.244.250:27656 \
   --lcd      162.55.132.48:15606 \
   --lcd      162.55.131.238:15606 \
   --lcd      54.154.91.139:26656 \
   --lcd      seed.terra-mainnet.everstake.one:26656 \
   --lcd      35.86.26.38:26656 \
   --lcd      162.55.244.250:27656 \
   --lcd      terra-mainnet.0base.vc:26656 \
   --lcd      kenaz.coinbevy.com:26656 \
   --lcd      35.227.90.116:26656 \
   --lcd      terra-seed-mainnet.blockngine.io:26676 \
   --lcd      terra.inotel.ro:26656 \
   --chain-id columbus-5 \
   --password "552881498"
   # --validator terravaloper1xx \
   # --validator terravaloper1yy \
```



#  Columbus-5					

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
   88d4b1517ccf60be0a7a41793948ab7af3750315@terra-mainnet-seed-1.stakin-nodes.com:26656					
   e86d50d69f9219839f9cd85d3329f186ec741478@terrabackup.stakely.io:26656					
   eb67380db62292506d41f28b1b77785a62a0f298@seed.terra.kkvalidator.com:26656					
   0915d3431ff7af14a6749afc12e6ba45c1b737da@34.152.3.90:26656					
   4f2d05162119a665b267599d3c86a936d65a9af0@seed.terra.rockx.com:26656					
   406bcf90a7b29df6ae475a1f94abe04ebde805af@mainnet.seed.terraindia.info:26656					
   1690a0c809314f2ff7f8e3ac559d5f30e7ba047b@65.108.9.149:26656					
   2c1b557739450f946ba38aebe113cad69c23cf98@20.199.97.106:26656					
   b976e8d1f94f4e2d554be4ca590929fa5ce320c0@188.166.95.126:26656					
   9825d4993fe6e948f6c800f9a4bbdb89ad120e76@34.79.212.227:26656					