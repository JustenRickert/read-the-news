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

const { parseSite } = require('../../shared/utils')

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

const omit = (o, keys) =>
  Object.keys(o)
    .filter(key => !keys.includes(key))
    .reduce((acc, key) => Object.assign(acc, { [key]: o[key] }), {})

module.exports = {
  parseSite,
  omit,
}
