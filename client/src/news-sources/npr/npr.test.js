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

  it('removes weird #comments and `bucketwrap`s', async () => {
    const result = await runHref(
      page,
      'https://www.npr.org/2019/11/20/781259322/key-takeaways-from-gordon-sondlands-watershed-impeachment-hearing'
    )
    expect(result).toMatchSnapshot()
  })

  it('does a weird npr ad better than I can', async () => {
    const result = await runHref(
      page,
      'https://www.npr.org/2019/11/20/779405142/democratic-debate-live-fact-check-analysis-of-novembers-face-off'
    )
    expect(result).toMatchSnapshot()
  })

  it('does cool articles about science', async () => {
    const result = await runHref(
      page,
      'https://www.npr.org/2019/11/19/780602012/50-years-ago-americans-made-the-2nd-moon-landing-why-doesnt-anyone-remember'
    )
    expect(result).toMatchSnapshot()
  })

  it('it handles list items', async () => {
    const result = await runHref(
      page,
      'https://www.npr.org/2019/11/20/781353829/national-book-awards-handed-to-susan-choi-arthur-sze-and-more'
    )
    expect(result).toMatchSnapshot()
  })

  it('gets ending author citation note', async () => {
    const result = await runHref(
      page,
      'https://www.npr.org/2019/11/16/779475558/nicole-krauss-and-zeruya-shalev-on-israel-jewishness-and-defying-reader-expectat'
    )
    expect(result).toMatchSnapshot()
  })
})
