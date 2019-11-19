const {
  isBreitbartHref,
  isCnnHref,
  isFoxHref,
  isNbcHref,
  isNprHref,
  isTheInterceptHref,
  isViceHref,
  isVoxHref,
  isTheNationHref,
} = require('../../shared/predicates')

const {
  BREITBART,
  CNN,
  FOX,
  NBC,
  NPR,
  THE_NATION,
  THE_INTERCEPT,
  VICE,
  VOX,
} = require('../../shared/constants')

const constant = x => () => x

const cond = matches => x => {
  if (!matches.length) return undefined
  if (matches[0][0](x)) return matches[0][1](x)
  return cond(matches.slice(1))(x)
}

const parseSite = cond([
  [isBreitbartHref, constant(BREITBART)],
  [isCnnHref, constant(CNN)],
  [isFoxHref, constant(FOX)],
  [isNprHref, constant(NPR)],
  [isNbcHref, constant(NBC)],
  [isTheNationHref, constant(THE_NATION)],
  [isTheInterceptHref, constant(THE_INTERCEPT)],
  [isViceHref, constant(VICE)],
  [isVoxHref, constant(VOX)],
])

const omit = (o, keys) =>
  Object.keys(o)
    .filter(key => !keys.includes(key))
    .reduce((acc, key) => Object.assign(acc, { [key]: o[key] }), {})

module.exports = {
  parseSite,
  omit,
}
