const map = (xs, fn) => xs.map(fn);

const sequentiallyMap = async (xs, fn) =>
  (await xs).reduce(
    (p, x) => p.then(async ys => ys.concat(await fn(x))),
    Promise.resolve([])
  );

const partition = (xs, predicate) =>
  xs.reduce(
    ([lhs, rhs], x, i) => {
      if (predicate(x, i, xs)) return [lhs.concat(x), rhs];
      else return [lhs, rhs.concat(x)];
    },
    [[], []]
  );

const and = (...predicates) => (...args) =>
  predicates.every(predicate => predicate(...args));

const or = (...predicates) => (...args) =>
  predicates.some(predicate => predicate(...args));

const complement = predicate => (...args) => !predicate(...args);

const pick = (o, keys) =>
  keys.reduce((acc, key) => Object.assign(acc, { [key]: o[key] }), {});

const sample = xs => xs[Math.floor(Math.random() * xs.length)];

const range = n =>
  Array(n)
    .fill(undefined)
    .map((_, i) => i);

const zip = xss => {
  const minLength = Math.min(...xss.map(xs => xs.length));
  return range(minLength).map(i => xss.map(xs => xs[i]));
};

module.exports = {
  and,
  or,
  complement,
  partition,
  pick,
  sample,
  range,
  sequentiallyMap,
  zip
};
