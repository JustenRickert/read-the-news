const {
  __impl: { parseAuthorInformation, parsePublicationDateInformation },
} = require('./')

const puppeteer = require('puppeteer')

const { collectArticle } = require('../')

describe('parsing utils', () => {
  it('parses publication dates', () => {
    const tests = ['Updated 1:13 AM ET, Sat November 2, 2019']
    expect(tests.map(parsePublicationDateInformation)).toMatchSnapshot()
  })

  it('parses authors info', () => {
    const tests = [['Opinion by Lori Harrison-Kahan']]
    expect(tests.map(parseAuthorInformation)).toMatchSnapshot()
  })
})

const TIMEOUT = 60e3

describe('cnn snapshots', () => {
  jest.setTimeout(TIMEOUT)

  let browser
  let page

  beforeAll(async () => {
    browser = await puppeteer.launch()
    browser.setDefaultTimeout(TIMEOUT)
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

  it("gets the cool STATE (CNN) - with just the state because it's pretty cool-looking", async () => {
    const result = await collectArticle(
      page,
      'https://www.cnn.com/2019/11/21/politics/fbi-fisa-russia-investigation/index.html'
    )
    expect(result).toMatchSnapshot()
  })

  it('does articles about the queen of Sweden', async () => {
    const result = await collectArticle(
      page,
      'https://www.cnn.com/2019/08/08/business/ikea-sweden-dementia/index.html'
    )
    expect(result).toMatchSnapshot()
  })

  it('drops unrelated content off at the end of the article', async () => {
    const result = await collectArticle(
      page,
      'https://www.cnn.com/2019/05/30/us/cnnheroes-staci-alonso-noahs-animal-house-pets-domestic-violence/index.html'
    )
    expect(result).toMatchSnapshot()
  })

  it('likes to do movie reviews too', async () => {
    const result = await collectArticle(
      page,
      'https://www.cnn.com/2019/11/15/entertainment/dollface-review/index.html'
    )
    expect(result).toMatchSnapshot()
  })
})
