const puppeteer = require('puppeteer')

const { isNbcBetterHref, isNbcFeatureNbcOutHref } = require('./')
const { runHref } = require('../')

// describe('nbc utils', () => {
//   it('should not collect certain "busines" hrefs', () => {
//     const badHrefs = ['https://www.nbcnews.com/business/consumer']
//     expect(isNbcBusinessArticleLink({ href: badHrefs[0] })).toBeFalsy()
//   })

//   it('should know about "better" hrefs', () => {
//     const exampleHref =
//       'https://www.nbcnews.com/better/lifestyle/travel-website-you-re-using-says-there-s-only-1-ncna1073066'
//     expect(isNbcBetterHref(exampleHref)).toBeTruthy()
//   })

//   it('should know about "feature/nbc-out" hrefs', () => {
//     const exampleHref =
//       'https://www.nbcnews.com/feature/nbc-out/almost-30-percent-bisexual-women-trans-people-live-poverty-report-n1073501'
//     expect(isNbcFeatureNbcOutHref(exampleHref)).toBeTruthy()
//   })
// })

describe('nbc snapshots', () => {
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
})
