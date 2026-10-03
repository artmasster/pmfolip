import worldBank from "./indicators.json";
import historical from "./historical-indicators.json";
import extended from "./extended-indicators.json";
import type { Indicator } from "../types";

/** Alternative sources are compared within a family, never counted twice. */
const families: Record<string, string> = {
  "gdp-per-capita-growth": "gdp-per-capita-growth",
  "life-expectancy": "life-expectancy",
  "voice-accountability": "civic-rights",
};

export const indicators: Indicator[] = [
  ...(worldBank.indicators as Indicator[]).map((indicator) => ({
    ...indicator,
    scoreFamily: families[indicator.id] || indicator.id,
    scorePriority: 20,
    ...(indicator.uncertainty?.length
      ? {
          uncertaintyLevel: 0.9,
          uncertaintyDescription: "ช่วงความเชื่อมั่น 90% ของ WGI ต้นทาง",
        }
      : {}),
  })),
  ...(historical.indicators as Indicator[]),
  ...(extended.indicators as Indicator[]),
];

export const indicatorSnapshot = {
  asOf: worldBank.asOf,
  methodologyVersion: 2,
  indicators,
};
