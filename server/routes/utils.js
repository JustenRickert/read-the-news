const {
  isCnnHref,
  isFoxHref,
  isNprHref,
  isNbcHref,
} = require('../../shared/predicates')
const { CNN, FOX, NBC, NPR } = require('../../shared/constants')

const constant = x => () => x

const cond = matches => x => {
  if (!matches.length) return undefined
  if (matches[0][0](x)) return matches[0][1](x)
  return cond(matches.slice(1))(x)
}

const parseSite = cond([
  [isCnnHref, constant(CNN)],
  [isFoxHref, constant(FOX)],
  [isNprHref, constant(NPR)],
  [isNbcHref, constant(NBC)],
])

const omit = (o, keys) =>
  Object.keys(o)
    .filter(key => !keys.includes(key))
    .reduce((acc, key) => Object.assign(acc, { [key]: o[key] }), {})

console.log(omit({ hello: 1, world: 2 }, ['world']))

module.exports = {
  parseSite,
  omit,
}