import json


class Price:
    currency: str
    price: str
    raw_price: float

    def __init__(self, currency: str, price: float):
        self.currency = currency

        self.raw_price = price
        self.price = format(price, ".18f")  # cut data to limit precision to 18

    def __json__(self):
        return {
            "currency": self.currency,
            "price": self.price,
        }


class PriceEncoder(json.JSONEncoder):
    def default(self, obj): # pylint: disable=E0202
        if isinstance(obj, Price):
            return obj.__json__()

        return json.JSONEncoder.default(self, obj)
