const {
  __impl: { parsePublicationDate },
} = require('./npr')

describe('utils', () => {
  it('has working timestamp parsing', () => {
    const date = 'October 30, 2019'
    const times = ['12:00 AM ET', '12:00 PM ET', '5:05 AM ET', '5:05 PM ET']
    const expected = [
      'Wed Oct 30 2019 00:00:00 GMT-0500 (Central Daylight Time)',
      'Wed Oct 30 2019 12:00:00 GMT-0500 (Central Daylight Time)',
      'Wed Oct 30 2019 05:05:00 GMT-0500 (Central Daylight Time)',
      'Wed Oct 30 2019 17:05:00 GMT-0500 (Central Daylight Time)',
    ]
    expect(times.map(time => parsePublicationDate(date, time))).toEqual(
      expected
    )
  })
})
