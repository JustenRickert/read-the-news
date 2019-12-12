export const take = (n, xs) => xs.slice(0, n);

export const takeRight = (n, xs) => xs.slice(xs.length - n);

export const noop = () => {};

export const bucket = (o, idFn) =>
  Object.values(o).reduce((bucket, v) => {
    const id = idFn(v);
    if (bucket[id]) bucket[id].push(v);
    else bucket[id] = [v];
    return bucket;
  }, {});

export const bucketEntries = (o, idFn) =>
  Object.entries(o).reduce((bucket, entry) => {
    const id = idFn(entry);
    if (bucket[id]) bucket[id].push(entry);
    else bucket[id] = [entry];
    return bucket;
  });
