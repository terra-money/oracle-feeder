import * as luna from './luna';
import * as fiat from './fiat';

let lunaPrices: { [quote: string]: number } = {};
let tickTimer;

export async function initialize(): Promise<void> {
  await luna.initialize();
  await fiat.initialize();

  await tick();
}

async function tick(): Promise<void> {
  const isUpdated: boolean[] = [
    await luna.tick(), // update LUNA/KRW LUNA/...
    await fiat.tick(), // update KRW/SDR, KRW/USD, KRW/MNT KRW/...
  ];

  if (isUpdated.indexOf(true) > -1) {
    calculateLunaPrices();
  }

  // set timer for loop
  if (tickTimer) clearTimeout(tickTimer);
  tickTimer = setTimeout(() => tick(), 100);
}

function calculateLunaPrices() {
  lunaPrices = luna.getLunaPrices();

  if (lunaPrices['KRW']) {
    lunaPrices = Object.assign(lunaPrices, fiat.getLunaPrices(lunaPrices['KRW']));
  }

  console.log(lunaPrices);
}

export function getLunaPrices() {
  return lunaPrices;
}
