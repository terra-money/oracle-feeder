import json
import statistics
from typing import Dict, List, Union

class MovingAverage:
    prices: List[float] = []

    def append(self, price: float):
        self.prices.append(price)

    def get_price(self) -> float:
        if len(self.prices) == 0:
            raise ValueError

        return statistics.mean(self.prices)
