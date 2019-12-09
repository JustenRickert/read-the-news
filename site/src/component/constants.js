export const IS_DEV = process.env.NODE_ENV === "development";

export const ORIGIN = IS_DEV
  ? window.location.protocol + "//" + window.location.hostname + ":3001"
  : "";
