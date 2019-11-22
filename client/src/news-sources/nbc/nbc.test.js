const puppeteer = require('puppeteer')

const { runHref } = require('../')

describe('nbc snapshots', () => {
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

  it('gets multiple authors', async () => {
    const result = await runHref(
      page,
      'https://www.nbcnews.com/news/us-news/two-u-s-service-members-killed-helicopter-crash-afghanistan-n1086486'
    )
    expect(result).toMatchSnapshot()
  })

  it('gets subheadings', async () => {
    const result = await runHref(
      page,
      'https://www.nbcnews.com/business/business-news/wework-lays-2-400-employees-n1088521'
    )
    expect(result).toMatchSnapshot()
  })

  it('does articles on white supremecism on nbc that have a random "Why?" in the middle', async () => {
    const result = await runHref(
      page,
      'https://www.nbcnews.com/think/opinion/syracuse-suspends-fraternities-racism-greek-system-s-prejudice-national-problem-ncna1087111'
    )
    expect(result).toMatchSnapshot()
  })

  it('gets articles on Zuckbaby', async () => {
    const result = await runHref(
      page,
      'https://www.nbcnews.com/tech/tech-news/trump-hosted-zuckerberg-undisclosed-dinner-white-house-october-n1087986'
    )
    expect(result).toMatchSnapshot()
  })
})
