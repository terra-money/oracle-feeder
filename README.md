# Terra Oracle Feeder

**NOTE:** This version is for mainnet Columbus-4 and Tequila testnet.

Validators must periodically submit votes for the price of LUNA, so it is recommended to set up a program to automatically retrieve prices and submit them to the blockchain. This is the official reference Oracle Feeder setup, used internally for Terraform Labs' validator nodes.

## Overview

This solution has 2 components:

1. [`price-server`](price-server/)

   Connects to outside data sources (such as cryptocurrency exchanges and Forex data providers) to retrieve the current price of LUNA and currency exchange rates. Makes the prices available to other services through an API server.

2. [`feeder`](feeder/)

   Daemon software that implements the Terra Oracle module's voting procedure and regularly submits exchange rate votes.

## Instructions

1. Clone this repository

```sh
git clone https://github.com/terra-project/oracle-feeder
cd oracle-feeder
```

2. Launch `price-server`. Learn how to configure it [here](price-server/).

3. Launch `oracle-feeder`. Learn how to configure it [here](feeder/).
