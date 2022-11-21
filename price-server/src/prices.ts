import { PriceBySymbol } from 'provider/base'
import { fiatProvider, cryptoProvider } from 'provider'
import { getBaseCurrency, getQuoteCurrency } from 'lib/currency';

export function getCryptoPrices(): PriceBySymbol {
  let prices = cryptoProvider.getPrices();
  console.log("prices before", JSON.stringify(prices))
  const CRYPTO_PRICES_TO_USD = new Array<PriceBySymbol>();

  for (const key in prices) {
    const base = getBaseCurrency(key);
    const quoter = getQuoteCurrency(key);
    const isStableCoin = key.endsWith("/USD");

    // TODO: find a BUSD/USD api to query
    // TODO: fix kucoin replace "-" with "/"
    
    if (isStableCoin) CRYPTO_PRICES_TO_USD.push({[key]: prices[key]})
    else {
      const basePrice = prices[key];
      const assetKeyUsd = base + "/USD";

      const stableCoinQuoter = quoter + "/USD";
      const stableCoinPrice = prices[stableCoinQuoter];
      
      const TO_USD = basePrice.multipliedBy(stableCoinPrice).precision(6);

      CRYPTO_PRICES_TO_USD.push({[assetKeyUsd]: TO_USD})
    }
  }

  console.log("prices after", JSON.stringify(CRYPTO_PRICES_TO_USD))

  // TODO: groupBy denom = (sum_amount / denom_occurrences)

  return prices;
}

export function getFiatPrices(): PriceBySymbol {
  return fiatProvider.getPrices()
}
