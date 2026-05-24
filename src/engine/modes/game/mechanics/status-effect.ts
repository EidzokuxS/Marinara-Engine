export interface StatusEffect {
  name: string;
  /** Positive = buff, negative = debuff */
  modifier: number;
  /** Stat it modifies */
  stat: "attack" | "defense" | "speed" | "hp";
  /** Turns remaining */
  turnsLeft: number;
}
