const puppeteer = require('puppeteer')

const { runHref } = require('../')

describe('cnn snapshots', () => {
  jest.setTimeout(15e3)

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

  it('does not do ending citations', async () => {
    const result = await runHref(
      page,
      'https://www.breitbart.com/politics/2019/11/21/watch-david-holmes-refuses-to-say-he-will-be-more-careful-with-communications/'
    )
    expect(result).toMatchSnapshot()
  })

  it('does articles with weird endings', async () => {
    const result = await runHref(
      page,
      'https://www.breitbart.com/politics/2019/08/05/kenny-marchant-fourth-texas-republican-not-seek-re-election/'
    )
    expect(result).toMatchSnapshot()
  })
})
