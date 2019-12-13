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

const { parseSite, omit } = require('../../shared/utils')

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

module.exports = {
  parseSite,
  omit,
}
