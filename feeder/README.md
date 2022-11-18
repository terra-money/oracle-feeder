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
npm start add-key

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
      --lcd-url https://lcd-1.terra.dev \
      --lcd-url https://lcd-2.terra.dev \
      --chain-id andromeda-oralce-1 \
      --validators terravaloper1xx \
      --validators terravaloper1yy \
      --password "<password>"
   ```

* Env
   ```shell
   # set your env vars 
   $ npm start vote
   ```


| Argument              | Env                | Description                                      | Example                      |
| --------------------- | ------------------ | ------------------------------------------------ | ---------------------------- |
| `password`            | `PASSWORD`         | Password for mnemonic (assigned in step #2)      | `12345678`                   |
| `data-source-url`     | `DATA_SOURCE_URL`  | Price server URL.                                | http://localhost:8532/latest |
| `lcd-url`             | `LCD_ADDRESS`      | LCD server URL (can be multiple)                 | https://lcd.terra.dev        |
| `chain-id`            | `CHAIN_ID`         | Chain ID.                                        | `andromeda-oralce-1`         |
| `validators`          | `VALIDATOR`        | Validator to submit prices for (can be multiple) | `terravaloper1xx...`         |
| `key-path`            | `KEY_PATH`         | signing key store path (default voter.json)      | `voter.json`                 |
