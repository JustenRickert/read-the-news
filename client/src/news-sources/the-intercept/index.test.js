const puppeteer = require('puppeteer')
const { inspect } = require('util')

const theInterceptModule = require('./')
const { collectArticle } = require('../')

describe('The intercept', () => {
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

  it('does long articles', async () => {
    const result = await collectArticle(
      page,
      'https://theintercept.com/2019/11/18/iran-iraq-spy-cables/'
    )
    expect(result).toMatchSnapshot()
  })

  it('does articles with different kinds of updates at the bottom', async () => {
    const result = await collectArticle(
      page,
      'https://theintercept.com/2019/11/20/pete-buttigieg-federal-contracts-minorities/'
    )
    expect(result).toMatchSnapshot()
  })

  it('reads transcripts', async () => {
    const result = await collectArticle(
      page,
      'https://theintercept.com/2019/03/21/mayor-pete-buttigieg-on-trump-islamophobia-and-his-presidential-bid/'
    )
    expect(result).toMatchSnapshot()
  })

  it('leaves out photograph tags', async () => {
    const result = await collectArticle(
      page,
      'https://theintercept.com/2018/09/23/everything-is-connected-met-breuer-art-conspiracy/'
    )
    expect(result).toMatchSnapshot()
  })
})
