# oracle-feeder
Oracle Feeder Daemon
Oracle feeder manual

## BUILD
```bash
$ git clone https://github.com/terra-project/oracle-feeder
$ cd oracle-feeder
$ dep ensure
$ make
```
## RUN

#### Option 1 :  enter the password through System Environment
```bash
$ FEEDER_PASSPHRASE=12345678 terrafeeder --from val0 --chain-id soju-0007
```
#### Option 2 :  enter the password through flag
```bash
$ terrafeeder --from val0 --chain-id soju-0007 --pass 12345678
```

#### Option 3 :  Interactive mode
```bash
$ terrafeeder --from val0 --chain-id soju-0007
Password for account 'val0' (default 12345678):
```

## FLAGS

### REQUIRED

* **--from**
    * voter key name
* **--chain-id**
    * target chain id


### OPTIONAL

* **--vote-by**
    * voting method (rpc, ~~lcd~~, ~~cli~~)
* **--updating-interval**
    * duration format (ex: 10m or 3h)
* **--updating-source**
    * comma separated url list to get price data
* **--no-voting**
    * working as proxy mode (skip voting)
* **--lcd**
    * LCD Address (LCD voting only)
* **--node**
    * RPC node address (RPC voting only)
* **--home**
    * set home directory, used to bring key data (default ~/.terracli)

## EXAMPLE
#### Voting Mode
```bash
$ FEEDER_PASSPHRASE=12345678 terrafeeder --from validator0 --chain-id soju-0007
 --vote-by rpc --updating-interval 10m --updating-source http://price.terra.money:7658/last,http://price2.terra.money:7658/last --node 54.248.60.232:26657 --home ~/validators/val0
```
#### Proxy Mode
```bash
$ terrafeeder --no-voting --updating-interval 10m --updating-source http://price.terra.money:7658/last,http://price2.terra.money:7658/last
```
