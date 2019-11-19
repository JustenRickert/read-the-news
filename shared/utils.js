const {
  isBreitbartHref,
  isCnnHref,
  isFoxHref,
  isNprHref,
  isNbcHref,
  isTheNationHref,
  isTheInterceptHref,
  isViceHref,
  isVoxHref
} = require("./predicates");

const {
  BREITBART,
  CNN,
  DEMOCRACY_NOW,
  FOX,
  NBC,
  NPR,
  THE_NATION,
  THE_INTERCEPT,
  VICE,
  VOX
} = require("./constants");

const constant = x => () => x;

const cond = matches => x => {
  if (!matches.length) return undefined;
  if (matches[0][0](x)) return matches[0][1](x);
  return cond(matches.slice(1))(x);
};

const parseSite = cond([
  [isBreitbartHref, constant(BREITBART)],
  [isCnnHref, constant(CNN)],
  [isFoxHref, constant(FOX)],
  [isNprHref, constant(NPR)],
  [isNbcHref, constant(NBC)],
  [isTheNationHref, constant(THE_NATION)],
  [isTheInterceptHref, constant(THE_INTERCEPT)],
  [isViceHref, constant(VICE)],
  [isVoxHref, constant(VOX)]
]);

module.exports = {
  parseSite
};
