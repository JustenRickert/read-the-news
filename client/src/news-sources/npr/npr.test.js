const {
  __impl: { parsePublicationDate, isHeadline },
} = require('./')

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

  it('gets headlines from hrefs', () => {
    const testHeadlines = [
      'https://www.npr.org/2019/11/05/776331817/new-transcripts-of-closed-door-depositions-released-in-trump-impeachment-inquiry',
      'https://www.npr.org/2019/11/05/776305627/mcdonalds-fired-ceo-is-getting-millions-putting-spotlight-on-pay-gap',
    ]
    expect(testHeadlines.map(href => ({ href })).every(isHeadline)).toBeTruthy()
  })
})
