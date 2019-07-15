import json
import statistics
from typing import Dict, List, Union
from modules.settings import settings

MOVING_AVG_PERIOD_NUM = settings['UPDATER'].get("MOVING_AVG_PERIOD_NUM", 15)

class MovingAvgPrice:
    currency: str
    prices: List[float]

    def __init__(self, currency: str, prices: List[float] = []):
        self.currency = currency
        self.prices = prices

    def append(self, price: float):
      self.prices.append(price)
      
      if len(self.prices) > MOVING_AVG_PERIOD_NUM:
        self.prices = self.prices[1:]

    def get_price(self) -> float:
      return statistics.mean(self.prices)
