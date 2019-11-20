const puppeteer = require('puppeteer')

const theInterceptModule = require('./')
const { runHref } = require('../')

describe('The intercept', () => {
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

  it('', async () => {
    const result = await runHref(
      page,
      'https://theintercept.com/2019/11/18/iran-iraq-spy-cables/'
    )
    console.log({
      ...result,
      content: result.content.split('\n'),
    })
  })
})
