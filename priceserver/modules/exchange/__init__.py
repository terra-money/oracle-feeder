class Price:
    currency: str
    price: str
    raw_price: float
    dispersion: float

    def __init__(self, currency: str, price: float, dispersion: float = 0.0):
        self.currency = currency
        self.dispersion = dispersion

        self.raw_price = price
        self.price = format(price, ".18f")  # cut data to limit precision to 18
