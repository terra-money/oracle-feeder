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

```
npm start vote -- \
   --source http://localhost:8532/latest \
   --lcd https://lcd.terra.dev \
   --chain-id columbus-4 \
   --denoms sdr,krw,usd,mnt,eur,cny,jpy,gbp,inr,cad,chf,hkd,aud,sgd \
   --validator terravaloper1xx \
   --validator terravaloper1yy \
   --gas-prices 169.77ukrw \
   --password "<password>"
```

| Argument    | Description                                      | Example                      |
| -           | -                                                | -                            |
| `source`    | Price server URL.                                | http://localhost:8532/latest |
| `lcd`       | LCD server URL.                                  | https://lcd.terra.dev        |
| `chain-id`  | Chain ID.                                        | `columbus-4`                 |
| `denoms`    | Denoms to vote for (comma-separated).            | `sdr,krw,usd,mnt,eur,cny,jpy,gbp,inr,cad,chf,hkd,aud,sgd,thb` |
| `validator` | Validator to submit prices for (can be multiple) | `terravaloper1xx...`         |
| `password`  | Password for mnemonic (assigned in step #2)      |                              |
| `gas-prices`| Gas Price (default 169.77ukrw, use 178.05ukrw for tequila-0004) |                |
