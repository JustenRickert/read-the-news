const { sequentiallyMap, unique } = require('./utils')

describe('utils', () => {
  it('has sequentiallyMap', () => {
    const arr = [1, 2, 3]
    const promArr = Promise.resolve(arr)
    const fn = x => 2 * x
    const asyncFn = x => Promise.resolve(2 * x)
    const expected = [2, 4, 6]
    Promise.all([
      sequentiallyMap(arr, fn),
      sequentiallyMap(promArr, fn),
      sequentiallyMap(arr, asyncFn),
      sequentiallyMap(promArr, asyncFn),
    ]).then(results =>
      results.forEach(result => expect(result).toEqual(expected))
    )
  })

  it('has unique', () => {
    const duplicates = [
      {
        href:
          'https://www.foxnews.com/politics/harris-lays-off-staff-shuts-offices-cancels-trip-to-crucial-first-primary-state',
      },
      {
        href:
          'https://www.foxnews.com/politics/harris-lays-off-staff-shuts-offices-cancels-trip-to-crucial-first-primary-state',
      },
    ]
    expect(unique(duplicates, ({ href }) => href)).toHaveLength(1)
  })
})
