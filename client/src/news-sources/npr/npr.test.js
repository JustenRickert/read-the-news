const puppeteer = require('puppeteer')
const { inspect } = require('util')

const {
  __impl: { parsePublicationDate, isHeadline },
} = require('./')

const nprModule = require('./')
const { runHref } = require('../')

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

describe('Npr snapshots', () => {
  let browser
  let page

  beforeAll(async () => {
    browser = await puppeteer.launch({ devtools: true })
  })

  beforeEach(async () => {
    page = await browser.newPage()
  })

  afterEach(async () => {
    await page.close()
  })

  afterAll(async () => {
    await browser.close()
  })

  it('', async () => {
    const result = await runHref(
      page,
      'https://www.npr.org/2019/11/20/781259322/key-takeaways-from-gordon-sondlands-watershed-impeachment-hearing'
    )
    console.log(
      inspect(
        {
          ...result,
          content: result.content.split('\n').slice(50),
        },
        { depth: null, colors: true }
      )
    )
  })
})
