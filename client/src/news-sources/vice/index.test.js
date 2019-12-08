const puppeteer = require('puppeteer')

const viceModule = require('./')
const { collectArticle } = require('../')

describe('vice', () => {
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

  it('clears `Cover:` and some unrelated content', async () => {
    const result = await collectArticle(
      page,
      'https://www.vice.com/en_us/article/9ke4jz/the-white-house-attacked-lt-col-vindman-as-he-was-testifying'
    )
    expect(result).toMatchSnapshot()
  })

  it('gets `subheading` and knows to real `li`s', async () => {
    const result = await collectArticle(
      page,
      'https://www.vice.com/en_us/article/43kebb/this-lawsuit-against-trump-could-have-big-implications-for-the-impeachment-inquiry'
    )
    expect(result).toMatchSnapshot()
  })

  it('does pretty large articles with a bunch of interwoven stuff', async () => {
    const result = await collectArticle(
      page,
      'https://www.vice.com/en_us/article/j5yzpk/they-cant-stop-us-people-are-having-sex-with-3d-avatars-of-their-exes-and-celebrities'
    )
    expect(result).toMatchSnapshot()
  })

  it('handles normal `p`s containing `i` tags... about food', async () => {
    const result = await collectArticle(
      page,
      'https://www.vice.com/en_us/article/43kmb9/best-thanksgiving-turkey-recipes'
    )
    expect(result).toMatchSnapshot()
  })

  it('handles long articles about health', async () => {
    const result = await collectArticle(
      page,
      'https://www.vice.com/en_us/article/kz49ge/this-gene-technology-could-change-the-world-its-maker-isnt-sure-it-should-v26n4'
    )
    expect(result).toMatchSnapshot()
  })
})
