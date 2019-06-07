# Oracle Feeder

## Install depencancies
```
$ yarn
```

## Create a key from mnemonic 
```
$ yarn start update-key
Enter a passphrase to encrypt your key to disk: ********
Repeat the passphrase: ********
Enter your bip39 mnemonic : <some nice mnemonic>
saved!
✨  Done in 9.19s.
```

## Voting
```
$ yarn start vote --source "http://price.terra.money/latest" --lcd <lcd url> --chain-id columbus-2 --denoms krw,usd,sdr
Enter a passphrase: *******
```
