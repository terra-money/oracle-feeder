# `feeder`

Submit exchange rate prevotes and votes, implementing the [voting procedure](https://github.com/terra-money/andromeda-oracle/blob/main/x/oracle/spec/01_concepts.md#voting-procedure).

## Make a new key for oracle votes

You can separate the keys used for controlling a validator account from those that are submitting oracle votes on behalf of a validator. Run:

```bash
oracled keys add <feeder>
```

Show the feeder account details:

```bash
oracled keys show <feeder>
```

## Delegate feeder consent

The account address used to submit oracle voting transactions is called a `feeder`. When you set up your oracle voting process for the first time, you must delegate the feeder permission to an account.

```bash
oracled tx oracle set-feeder <feeder-address> --from=<validator>
```


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
      -d http://localhost:8532/latest \
      --lcd-url https://lcd.terraclassic.community \
      --chain-id colmbus-5 \
      --validators terravaloper1xx \
      --validators terravaloper1yy \
      --password <password>
   ```

* Env
   ```shell
   # set your env vars 
   $ npm start vote
   ```


| Argument              | Env                              | Description                                               | Example                        |
| --------------------- | -------------------------------- | --------------------------------------------------------- | ------------------------------ |
| `password`            | `ORACLE_FEEDER_PASSWORD`         | Password for mnemonic (assigned in step #2)               | `12345678`                     |
| `data-source-url`     | `ORACLE_FEEDER_DATA_SOURCE_URL`  | Price server URL.                                         | http://localhost:8532/latest   |
| `lcd-url`             | `ORACLE_FEEDER_LCD_ADDRESS`      | LCD server URL (can be multiple)                          | https://lcd.terraclassic.community |
| `chain-id`            | `ORACLE_FEEDER_CHAIN_ID`         | Chain ID.                                                 | `colmbus-5         `           |
| `validators`          | `ORACLE_FEEDER_VALIDATORS`       | Validator to submit prices for (can be multiple)          | `terravaloper1xx...`           |
| `key-name`            | `ORACLE_FEEDER_KEY_NAME`         | name to be given to the key that will be encrypted in file| `voter`                        |
| `coin-type`           | `ORACLE_FEEDER_COIN_TYPE`        | coin type used to derive the public address (default 330) | `330`                          |
| `key-path`            | `ORACLE_FEEDER_KEY_PATH`         | signing key store path (default voter.json)               | `voter.json`                   |
| Unsupported           | `ORACLE_FEEDER_ADDR_PREFIX`      |                                                           | `terra`                        |
| Unsupported           | `ORACLE_FEEDER_IV_SALT`          | salt used in IV vector                                    | `myHashedIV`                   |