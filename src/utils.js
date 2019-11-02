const map = (xs, fn) => xs.map(fn)

const sequentiallyMap = async (xs, fn) =>
  (await xs).reduce(
    (p, x) => p.then(async ys => ys.concat(await fn(x))),
    Promise.resolve([])
  )

const partition = (xs, predicate) =>
  xs.reduce(
    ([lhs, rhs], x, i) => {
      if (predicate(x, i, xs)) return [lhs.concat(x), rhs]
      else return [lhs, rhs.concat(x)]
    },
    [[], []]
  )

const partitionGroups = (xs, predicateMap) => {
  const stubArrayRecord = Object.keys(predicateMap).reduce(
    (arrayRecord, key) => Object.assign(arrayRecord, { [key]: [] }),
    { rest: [] }
  )
  return xs.reduce((groups, x) => {
    const key = Object.keys(groups).find(key =>
      (predicateMap[key] || (() => false))(x)
    )
    return Object.assign(groups, {
      [key || 'rest']: groups[key || 'rest'].concat(x),
    })
  }, stubArrayRecord)
}

const and = (...predicates) => (...args) =>
  predicates.every(predicate => predicate(...args))

const or = (...predicates) => (...args) =>
  predicates.some(predicate => predicate(...args))

const complement = predicate => (...args) => !predicate(...args)

const pick = (o, keys) =>
  keys.reduce((acc, key) => Object.assign(acc, { [key]: o[key] }), {})

const sample = xs => xs[Math.floor(Math.random() * xs.length)]

const range = n =>
  Array(n)
    .fill(undefined)
    .map((_, i) => i)

const unique = (xs, idFn) =>
  xs.reduce(
    (uniqueXs, x) =>
      uniqueXs.some(ux => idFn(ux) === idFn(xs))
        ? uniqueXs
        : uniqueXs.concat(x),
    []
  )

const zip = xss => {
  const minLength = Math.min(...xss.map(xs => xs.length))
  return range(minLength).map(i => xss.map(xs => xs[i]))
}

module.exports = {
  and,
  or,
  complement,
  partition,
  partitionGroups,
  pick,
  sample,
  range,
  sequentiallyMap,
  unique,
  zip,
}
