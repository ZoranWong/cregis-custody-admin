export const BASE_UNIT_NAMES: Record<string, string> = {
  ETH: "wei",
  SOL: "lamport",
  TRX: "sun",
  SUI: "mist",
  BNB: "jager",
  MATIC: "drop",
};

export function getBaseUnitName(coinId: string): string {
  return BASE_UNIT_NAMES[coinId.toUpperCase()] ?? coinId;
}