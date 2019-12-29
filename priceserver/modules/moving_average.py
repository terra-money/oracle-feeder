import json
import statistics
from typing import Dict, List, Union
from time import time

class MovingAverage:
    prices: List[float]
    times: List[int]

    def __init__(self):
        self.prices = []
        self.times = []

    def append(self, price: float, time: int = time() / 60):
        self.prices.append(price)
        self.times.append(time)

    def get_price(self) -> float:
        if len(self.prices) == 0:
            raise ValueError

        return statistics.mean(self.prices)
   
    # slice list to {size}
    # i.e. [1,2,3,4,5] with size 3 becomes [3,4,5]
    def slice(self, size):
        self.prices = self.prices[-size:]
        self.times = self.times[-size:]