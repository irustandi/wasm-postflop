export const ranks = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "T",
  "J",
  "Q",
  "K",
  "A",
];

const suits = ["♣", "♦", "♥", "♠"];

const suitClasses = [
  "text-green-600",
  "text-blue-600",
  "text-pink-600",
  "text-black",
];

export const cardText = (card: number) => {
  return {
    rank: ranks[Math.floor(card / 4)],
    suit: suits[card % 4],
    colorClass: suitClasses[card % 4],
  };
};

export const cardPairCellIndex = (card1: number, card2: number) => {
  if (card1 > card2) [card1, card2] = [card2, card1];
  const hr = Math.floor(card2 / 4);
  const lr = Math.floor(card1 / 4);
  const hs = card2 % 4;
  const ls = card1 % 4;
  const isSuited = hs === ls;
  return {
    row: 12 - (isSuited ? hr : lr),
    col: 12 - (isSuited ? lr : hr),
    index: isSuited
      ? 3 - hs
      : hr === lr
      ? 6 - ((ls * (5 - ls)) / 2 + hs)
      : 11 - (3 * hs + ls - +(hs < ls)),
  };
};

export const cardPairOrder = (card1: number, card2: number) => {
  if (card1 > card2) [card1, card2] = [card2, card1];
  const hr = Math.floor(card2 / 4);
  const lr = Math.floor(card1 / 4);
  const hs = card2 % 4;
  const ls = card1 % 4;
  const isSuited = hs === ls;
  return (((hr * 2 + +isSuited) * 16 + lr) * 4 + hs) * 4 + ls;
};

export const average = (
  values: Float64Array,
  weights: Float64Array
): number => {
  let sum = 0;
  let totalWeight = 0;
  for (let i = 0; i < values.length; ++i) {
    sum += values[i] * weights[i];
    totalWeight += weights[i];
  }
  return sum / totalWeight;
};

export const colorString = (color: {
  red: number;
  green: number;
  blue: number;
}) => {
  const red = color.red.toString(16).padStart(2, "0");
  const green = color.green.toString(16).padStart(2, "0");
  const blue = color.blue.toString(16).padStart(2, "0");
  return `#${red}${green}${blue}`;
};

const parseFloat = (s: string): number => {
  if (/[beox+-]/.test(s)) {
    return Number.NaN;
  } else {
    return Number(s);
  }
};

export const MAX_AMOUNT = 30000;
export const MAX_BET_SIZES = 30;

export const sanitizeBetString = (
  s: string,
  is_raise: boolean
): { s: string; valid: boolean } => {
  const trimmed = s.trim();
  if (trimmed === "") return { s: "", valid: true };

  const split = trimmed.split(",").flatMap((s) => s.trim().split(" "));
  const elements = split.map((s) => s.toLowerCase());

  if (elements[elements.length - 1] === "") {
    elements.pop();
  }

  if (elements.length > MAX_BET_SIZES) {
    return { s: "Too many bet sizes", valid: false };
  }

  let sanitized = "";

  for (const e of elements) {
    if (sanitized !== "") {
      sanitized += ", ";
    }
    if (e === "") {
      return { s: "Found empty string", valid: false };
    } else if (e.endsWith("x")) {
      // Previous bet relative
      if (!is_raise) {
        return {
          s: `Multiplicative size is not allowed: ${e}`,
          valid: false,
        };
      } else {
        const float = parseFloat(e.slice(0, -1));
        if (Number.isNaN(float)) {
          return { s: `Invalid multiplicative size: ${e}`, valid: false };
        } else if (float <= 1.0) {
          return { s: `Multiplier must be greater than 1: ${e}`, valid: false };
        } else {
          sanitized += `${float}x`;
        }
      }
    } else if (e.endsWith("c")) {
      // Additive
      const float = parseFloat(e.slice(0, -1));
      if (Number.isNaN(float)) {
        return { s: `Invalid additive size: ${e}`, valid: false };
      } else if (float % 1 !== 0) {
        return { s: `Addition size must be an integer: ${e}`, valid: false };
      } else if (float > MAX_AMOUNT) {
        return { s: `Addition size too large: ${e}`, valid: false };
      } else {
        sanitized += `${float}c`;
      }
    } else if (e.includes("e")) {
      // Geometric
      const split = e.split("e");
      if (split.length !== 2) {
        return { s: `Invalid geometric size: ${e}`, valid: false };
      }
      const float1 = split[0] === "" ? null : parseFloat(split[0]);
      const float2 = split[1] === "" ? null : parseFloat(split[1]);
      if (float1 !== null) {
        if (Number.isNaN(float1)) {
          return { s: `Invalid geometric size: ${e}`, valid: false };
        } else if (float1 % 1 !== 0 || float1 === 0) {
          return {
            s: `Geometric size must be a positive integer: ${e}`,
            valid: false,
          };
        } else if (float1 > 100) {
          return { s: `Geometric size too large: ${e}`, valid: false };
        }
      }
      if (float2 !== null && Number.isNaN(float2)) {
        return { s: `Invalid geometric size: ${e}`, valid: false };
      }
      sanitized += `${float1 ?? ""}e${float2 ?? ""}`;
    } else if (e === "a") {
      // All-in
      sanitized += "a";
    } else {
      // Pot relative
      const float = parseFloat(e);
      if (Number.isNaN(float)) {
        return { s: `Invalid bet size: ${e}`, valid: false };
      }
      sanitized += `${float}`;
    }
  }

  return { s: sanitized, valid: true };
};

export const convertBetString = (s: string): string => {
  if (s === "") return s;
  return s
    .split(", ")
    .map((e) => ("acex".includes(e[e.length - 1]) ? e : e + "%"))
    .join(",");
};

const parseBetAmount = (
  s: string,
  index: number
): { amount: number; indexEnd: number } => {
  let indexEnd = index;
  while (indexEnd < s.length && /\d/.test(s[indexEnd])) indexEnd++;
  const amount = Number(s.slice(index, indexEnd));
  return { amount, indexEnd };
};

export const readableLineString = (s: string): string => {
  if (s === "(Root)") return s;

  let ret = "";
  let index = 0;

  while (index < s.length) {
    if (s[index] === "-") {
      ret += " - ";
      index += 1;
    } else if (s[index] === "|") {
      ret += ", ";
      index += 1;
    } else if (s[index] === "F") {
      ret += "Fold";
      index += 1;
    } else if (s[index] === "X") {
      ret += "Check";
      index += 1;
    } else if (s[index] === "C") {
      ret += "Call";
      index += 1;
    } else if (s[index] === "B") {
      const { amount, indexEnd } = parseBetAmount(s, index + 1);
      ret += `Bet ${amount}`;
      index = indexEnd;
    } else if (s[index] === "R") {
      const { amount, indexEnd } = parseBetAmount(s, index + 1);
      ret += `Raise ${amount}`;
      index = indexEnd;
    } else if (s[index] === "A") {
      const { amount, indexEnd } = parseBetAmount(s, index + 1);
      ret += `All-in ${amount}`;
      index = indexEnd;
    } else {
      return "Invalid line string";
    }
  }

  return ret;
};