const { performance } = require('perf_hooks')

const tap = x => (console.log(x), x)

const range = n =>
  Array(n)
    .fill(undefined)
    .map((_, i) => i)

const map = (xs, fn) => xs.map(fn)

const last = xs => xs[xs.length - 1]

const sequentiallyDoTimes = async (n, fn) =>
  range(n).reduce(p => p.then(fn), Promise.resolve(null))

const sequentiallyMap = async (xs, fn) =>
  (await xs).reduce(
    (p, x) => p.then(async ys => ys.concat(await fn(x))),
    Promise.resolve([])
  )

const sequentiallyForEach = (xs, fn) =>
  sequentiallyReduce(xs, (_, x) => fn(x), null).then(() => undefined)

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

const not = predicate => (...args) => !predicate(...args)

const and = (...predicates) => (...args) =>
  predicates.every(predicate => predicate(...args))

const or = (...predicates) => (...args) =>
  predicates.some(predicate => predicate(...args))

const complement = predicate => (...args) => !predicate(...args)

const pick = (o, keys) =>
  keys.reduce((acc, key) => Object.assign(acc, { [key]: o[key] }), {})

const sample = xs => xs[Math.floor(Math.random() * xs.length)]

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

const timeFn = fn => (...args) => {
  const start = performance.now()
  return Promise.resolve(fn(...args)).then(result => {
    const ms = performance.now() - start
    let duration
    if (ms / 1000 / 60 / 60 > 1)
      Math.floor(ms / 1000 / 60 / 60) +
        'h' +
        (Math.floor((ms / 1000) % 60) + 'm')
    else if (ms / 1000 > 60)
      duration =
        Math.floor(ms / 1000 / 60) + 'm' + (Math.floor((ms / 1000) % 60) + 's')
    else if (ms / 1000 > 0)
      duration =
        Math.floor(ms / 1000) +
        's' +
        Math.floor(ms % 1000)
          .toString()
          .padEnd(3, '0') +
        'ms'
    else duration = ms.toString().slice(0, 3) + 'ms'
    return {
      duration,
      result,
    }
  })
}

const sequentiallyDoWhile = async (condition, procedure) => {
  while (await condition()) await procedure()
}

const dropRightWhile = (xs, predicate) => {
  if (predicate(xs[xs.length - 1]))
    return dropRightWhile(xs.slice(0, -1), predicate)
  return xs
}

module.exports = {
  and,
  complement,
  difference,
  dropRightWhile,
  not,
  or,
  partition,
  partitionGroups,
  pick,
  range,
  sample,
  sequentiallyDoTimes,
  sequentiallyDoWhile,
  last,
  sequentiallyForEach,
  sequentiallyMap,
  sequentiallyReduce,
  tap,
  timeFn,
  unique,
  zip,
}
