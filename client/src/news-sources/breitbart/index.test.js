const puppeteer = require('puppeteer')

const { collectArticle } = require('../')

const TIMEOUT = 30e3

describe('breitbart snapshots', () => {
  jest.setTimeout(TIMEOUT)

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

  it('does articles without subheadings', async () => {
    const result = await collectArticle(
      page,
      'https://www.breitbart.com/clips/2019/10/11/msnbcs-wallace-on-shep-smiths-fox-news-departure-very-sad-news-for-the-truth-today/'
    )
    expect(result).toMatchSnapshot()
  })

  it('does not do ending citations', async () => {
    const result = await collectArticle(
      page,
      'https://www.breitbart.com/politics/2019/11/21/watch-david-holmes-refuses-to-say-he-will-be-more-careful-with-communications/'
    )
    expect(result).toMatchSnapshot()
  })

  it('does articles with weird endings', async () => {
    const result = await collectArticle(
      page,
      'https://www.breitbart.com/politics/2019/08/05/kenny-marchant-fourth-texas-republican-not-seek-re-election/'
    )
    expect(result).toMatchSnapshot()
  })
})