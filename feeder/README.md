# Oracle Feeder

## Install dependencies
```
$ npm i
```

## Create a key from mnemonic 
```
$ npm start update-key
Enter a passphrase to encrypt your key to disk: ********
Repeat the passphrase: ********
Enter your bip39 mnemonic : <some nice mnemonic>
saved!
✨  Done in 9.19s.
```

## Start voting
> You must start Price Server and LCD rest-server first to run oracle feeder.
```
$ npm start vote -- \
--source <price source url> \
--lcd <lcd url> \
--chain-id columbus-3 \
--denoms sdr,krw,usd,mnt \
--validator terravaloper1xx \
--validator terravaloper1yy \
--password "<password>"
```
