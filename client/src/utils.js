const tap = x => (console.log(x), x)

const map = (xs, fn) => xs.map(fn)

const sequentiallyMap = async (xs, fn) =>
  (await xs).reduce(
    (p, x) => p.then(async ys => ys.concat(await fn(x))),
    Promise.resolve([])
  )

const sequentiallyReduce = async (xs, accumulatorFn, initialValue) =>
  (await xs)
    .slice(initialValue === undefined ? 1 : 0)
    .reduce(
      (p, x) => p.then(acc => accumulatorFn(acc, x)),
      initialValue === undefined
        ? Promise.resolve(await xs[0])
        : Promise.resolve(initialValue)
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

const difference = (xs, ys, idFn = id => id) =>
  xs.filter(x => !ys.some(y => idFn(x) === idFn(y)))

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
      uniqueXs.some(ux => idFn(ux) === idFn(x)) ? uniqueXs : uniqueXs.concat(x),
    []
  )

const zip = xss => {
  const minLength = Math.min(...xss.map(xs => xs.length))
  return range(minLength).map(i => xss.map(xs => xs[i]))
}

module.exports = {
  and,
  complement,
  difference,
  or,
  partition,
  partitionGroups,
  pick,
  range,
  sample,
  sequentiallyMap,
  sequentiallyReduce,
  tap,
  unique,
  zip,
}
