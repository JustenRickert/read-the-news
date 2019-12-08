const puppeteer = require('puppeteer')

const { collectArticle } = require('../')

describe('fox snapshots', () => {
  jest.setTimeout(30e3)

  let browser
  let page

  beforeAll(async () => {
    browser = await puppeteer.launch()
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

  it('gets it good on a first pager', async () => {
    const result = await collectArticle(
      page,
      'https://www.foxnews.com/politics/impeachment-articles-senate-trial-republicans'
    )
    expect(result).toMatchSnapshot()
  })

  it('does gutfield fuuuu', async () => {
    const result = await collectArticle(
      page,
      'https://www.foxnews.com/opinion/gutfeld-on-last-nights-debate'
    )
    expect(result).toMatchSnapshot()
  })

  it('does dates statically when running in test', async () => {
    const result = await collectArticle(
      page,
      'https://www.foxnews.com/politics/trump-administration-begins-sending-migrants-to-guatemala-as-part-of-safe-third-country-agreement'
    )
    expect(result).toMatchSnapshot()
  })

  it('gets rid of ^WATCH: type advertisements', async () => {
    const result = await collectArticle(
      page,
      'https://www.foxbusiness.com/markets/charles-schwab-buying-td-ameritrade-for-26b'
    )
    expect(result).toMatchSnapshot()
  })
})
