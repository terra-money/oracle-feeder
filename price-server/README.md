# Oracle PriceServer

## How to use
1. Install dependencies
```
$ npm i
```

2. Set config
```
# Start with sample script
$ cp ./config/default.sample.js ./config/default.js

# Update config as you want
# Set api key of forex API
$ vim ./config/default.js
```

3. Run price server
```
# Listen on `tcp://127.0.0.1:8532/latest`
$ npm run start
```
