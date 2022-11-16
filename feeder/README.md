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

Enter a password to encrypt your key to disk: ********
Repeat the password: ********
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
      --lcd http://localhost:1317/ \
      --chain-id andromeda-oracle-1 \
      --validator adrvaloper1kxhysqmykgd46dsz8me2epsrhqcdpt9l56mhtt \
      --password "<password>"
   ```

* Env
   ```shell
   # set your env vars 
   $ npm start vote
   ```


| Argument    | Env           | Description                                      | Example                      |
| ----------- | ------------- | ------------------------------------------------ | ---------------------------- |
| `source`    | `SOURCE`      | Price server URL.                                | http://localhost:8532/latest |
| `lcd`       | `LCD_URL` | LCD server URL (can be multiple)                 | https://lcd.terra.dev        |
| `chain-id`  | `CHAIN_ID`    | Chain ID.                                        | `columbus-5`                 |
| `validator` | `VALIDATOR`   | Validator to submit prices for (can be multiple) | `terravaloper1xx...`         |
| `password`  | `PASSWORD`    | Password for mnemonic (assigned in step #2)      | `12345678`                   |
| `        `  | `MNEMONIC`    | Mnemonic to assign in step                       | `window duty close pair...`  |
| `key-path`  | `KEY_PATH`    | signing key store path (default voter.json)      | `voter.json`                 |
