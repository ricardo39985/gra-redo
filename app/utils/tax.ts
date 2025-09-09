export interface TaxResult {
  duty: number;
  excise: number;
  vat: number;
  totalTax: number;
  dutyRate: number;
  exciseRate: number;
  vatRate: number;
  exciseType: 'rate' | 'flat' | 'compound' | null;
  exciseConstUSD: number;
  exciseFlatGYD: number;
}

interface GasolineParams {
  cc: number;
  cif: number;
  exchangeRate: number;
  vehicleType: string;
  ageCategory: string | null;
}

interface DieselParams {
  cc: number;
  cif: number;
  exchangeRate: number;
  ageCategory: string | null;
}

export function calculateGasoline({ cc, cif, exchangeRate, vehicleType, ageCategory }: GasolineParams): TaxResult {
  let duty = 0, excise = 0, vat = 0, totalTax = 0;
  let dutyRate = 0, exciseRate = 0, vatRate = 0, exciseType: TaxResult['exciseType'] = null, exciseConstUSD = 0, exciseFlatGYD = 0;

  if (vehicleType === 'Bike') {
    dutyRate = 0.20;
    if (cc > 175) {
      exciseRate = 0.10;
    }
    exciseType = 'rate';
    vatRate = 0.14;
    duty = dutyRate * cif;
    excise = exciseRate * (duty + cif);
    vat = (cif + duty + excise) * vatRate;
    totalTax = duty + excise + vat;
  } else if (ageCategory === 'under4') {
    vatRate = 0.14;
    if (cc <= 1500) {
      dutyRate = 0.35;
      exciseRate = 0;
    } else if (cc <= 2000) {
      dutyRate = 0.45;
      exciseRate = 0.10;
    } else if (cc <= 3000) {
      dutyRate = 0.45;
      exciseRate = 1.10;
    } else {
      dutyRate = 0.45;
      exciseRate = 1.40;
    }
    exciseType = 'rate';
    duty = dutyRate * cif;
    excise = exciseRate * (duty + cif);
    vat = (cif + duty + excise) * vatRate;
    totalTax = duty + excise + vat;
  } else {
    dutyRate = 0;
    vatRate = 0;
    if (cc <= 1000) {
      exciseType = 'flat';
      exciseFlatGYD = 800000;
      excise = exciseFlatGYD / exchangeRate;
      totalTax = excise;
    } else if (cc <= 1500) {
      exciseType = 'flat';
      exciseFlatGYD = 800000;
      excise = exciseFlatGYD / exchangeRate;
      totalTax = excise;
    } else if (cc <= 1800) {
      exciseType = 'compound';
      exciseConstUSD = 6000;
      exciseRate = 0.30;
      excise = (cif + exciseConstUSD) * exciseRate + exciseConstUSD;
      totalTax = excise;
    } else if (cc <= 2000) {
      exciseType = 'compound';
      exciseConstUSD = 6500;
      exciseRate = 0.30;
      excise = (cif + exciseConstUSD) * exciseRate + exciseConstUSD;
      totalTax = excise;
    } else if (cc <= 3000) {
      exciseType = 'compound';
      exciseConstUSD = 13500;
      exciseRate = 0.70;
      excise = (cif + exciseConstUSD) * exciseRate + exciseConstUSD;
      totalTax = excise;
    } else {
      exciseType = 'compound';
      exciseConstUSD = 14500;
      exciseRate = 1.00;
      excise = (cif + exciseConstUSD) * exciseRate + exciseConstUSD;
      totalTax = excise;
    }
  }

  return { duty, excise, vat, totalTax, dutyRate, exciseRate, vatRate, exciseType, exciseConstUSD, exciseFlatGYD };
}

export function calculateDiesel({ cc, cif, exchangeRate, ageCategory }: DieselParams): TaxResult {
  let duty = 0, excise = 0, vat = 0, totalTax = 0;
  let dutyRate = 0, exciseRate = 0, vatRate = 0, exciseType: TaxResult['exciseType'] = null, exciseConstUSD = 0, exciseFlatGYD = 0;

  if (ageCategory === 'under4') {
    vatRate = 0.14;
    if (cc <= 1500) {
      dutyRate = 0.35;
      exciseRate = 0;
    } else if (cc <= 2000) {
      dutyRate = 0.45;
      exciseRate = 0.10;
    } else if (cc <= 2500) {
      dutyRate = 0.45;
      exciseRate = 1.10;
    } else {
      dutyRate = 0.45;
      exciseRate = 1.10;
    }
    exciseType = 'rate';
    duty = dutyRate * cif;
    excise = (exciseRate || 0) * (duty + cif);
    vat = (cif + duty + excise) * vatRate;
    totalTax = duty + excise + vat;
  } else {
    dutyRate = 0;
    vatRate = 0;
    if (cc <= 1500) {
      exciseType = 'flat';
      exciseFlatGYD = 800000;
      excise = exciseFlatGYD / exchangeRate;
      totalTax = excise;
    } else if (cc <= 2000) {
      exciseType = 'compound';
      exciseConstUSD = 15400;
      exciseRate = 0.30;
      excise = (cif + exciseConstUSD) * exciseRate + exciseConstUSD;
      totalTax = excise;
    } else if (cc <= 2500) {
      exciseType = 'compound';
      exciseConstUSD = 15400;
      exciseRate = 0.70;
      excise = (cif + exciseConstUSD) * exciseRate + exciseConstUSD;
      totalTax = excise;
    } else if (cc <= 3000) {
      exciseType = 'compound';
      exciseConstUSD = 15500;
      exciseRate = 0.70;
      excise = (cif + exciseConstUSD) * exciseRate + exciseConstUSD;
      totalTax = excise;
    } else {
      exciseType = 'compound';
      exciseConstUSD = 17200;
      exciseRate = 1.00;
      excise = (cif + exciseConstUSD) * exciseRate + exciseConstUSD;
      totalTax = excise;
    }
    duty = 0;
    vat = 0;
  }

  return { duty, excise, vat, totalTax, dutyRate, exciseRate, vatRate, exciseType, exciseConstUSD, exciseFlatGYD };
}

