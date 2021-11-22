# `feeder`

This program will submit exchange rate prevotes and votes, implementing the [voting procedure](https://docs.terra.money/dev/spec-oracle.html#voting-procedure). 

## Requirements

Oracle Feeder requires the following:

- Set up a running [`price-server`](../price-server/)
- An account which has feeder rights for a validator (instructions [here](https://docs.terra.money/validator/setup.html#delegate-feeder-consent))

## Instructions

1. Install dependencies

```sh
npm install
```

2. Create a key from your mnemonic

You need the mnemonic phrase for the **feeder account** for your validator.

```sh
npm start update-key

Enter a passphrase to encrypt your key to disk: ********
Repeat the passphrase: ********
Enter your bip39 mnemonic : <some nice mnemonic>
saved!
✨  Done in 9.19s.
```

3. Vote

Make sure the Price Server is running.

You can start feeder with arguments or env.

* Arguments
   ``` shell
   $ npm start vote -- \
      --source http://localhost:8532/latest \
      --lcd https://lcd-1.terra.dev \
      --lcd https://lcd-2.terra.dev \
      --chain-id columbus-5 \
      --validator terravaloper1xx \
      --validator terravaloper1yy \
      --password "<password>"
   ```

* Env
   ```shell
   # set your env vars 
   $ npm start vote
   ```


| Argument    | Env           | Description                                      | Example                      |
| ----------- | ------------- | ------------------------------------------------ | ---------------------------- |
| `-s/--source`    | `SOURCE`      | Price server URL.                                | http://localhost:8532/latest |
| `-l/--lcd`       | `LCD_ADDRESS` | LCD server URL (can be multiple, comma-separated)                 | https://lcd.terra.dev        |
| `-L/--lcdL`       | `LCD_ADDRESS_LEADER` | LCD server to prioritize return to.  (can be multiple, comma-separated)                 | https://lcd.terra.dev        |
| `-c/--chain-id`  | `CHAIN_ID`    | Chain ID.                                        | `columbus-5`                 |
| `--validator` | `VALIDATOR`   | Validator to submit prices for (can be multiple) | `terravaloper1xx...`         |
| `-p/--password`  | `PASSPHRASE`  | Password for mnemonic (assigned in step #2)      | `12345678`                   |
| `-k/--key-path/--keystore`  | `KEY_PATH`    | signing key store path (default voter.json)      | `voter.json`                 |




# Miss Conditions

A VotePeriod during which either of the following events occur is considered a "miss":

1. **The validator fails to submits a vote for Luna exchange rate against each and every denomination specified inWhitelist.**

2. **The validator fails to vote within the reward band around the weighted median for one or more denominations.**

During every [ SlashWindow ](https://docs.terra.money/Reference/Terra-core/Module-specifications/spec-oracle.html#slashwindow), participating validators must maintain a valid vote rate of at least [MinValidPerWindow ( Default: 5%) ](https://docs.terra.money/Reference/Terra-core/Module-specifications/spec-oracle.html#minvalidperwindow), lest they get their stake slashed (currently set to [ 0.01% ](https://docs.terra.money/Reference/Terra-core/Module-specifications/spec-oracle.html#slashfraction)).
The slashed validator is automatically temporarily "jailed" by the protocol (to protect the funds of delegators), and the operator is expected to fix the discrepancy promptly to resume validator participation.


### Reward Band


Let $M$ be the weighted median, be the standard deviation of the votes in the ballot, and be the RewardBand parameter. The band around the median is set to be  $\epsilon = max(\sigma, R/2)$. All valid (i.e. bonded and non-jailed) validators that submitted an exchange rate vote in the interval $[M-\epsilon,M+\epsilon]$ should be included in the set of winners, weighted by their relative vote power.