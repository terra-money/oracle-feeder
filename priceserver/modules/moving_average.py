import json
import statistics
from typing import Dict, List, Union

class MovingAverage:
    prices: List[float] = []

    def append(self, price: float):
        self.prices.append(price)

    def get_price(self) -> float:
        return statistics.mean(self.prices)
