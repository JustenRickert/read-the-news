const puppeteer = require('puppeteer')

const voxModule = require('./index')
const { runHref } = require('../')

describe('vox media', () => {
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

  it('collects from an article that needs ASIDE and FIGURE tags removed', async () => {
    const result = await runHref(
      page,
      'https://www.vox.com/science-and-health/2019/11/18/20970604/amazon-rainforest-2019-brazil-burning-deforestation-bolsonaro'
    )
    expect(result).toMatchSnapshot()
  })

  it('skips twitter content [that is ideally quoted in the body of the article itself...]', async () => {
    const result = await runHref(
      page,
      'https://www.vox.com/science-and-health/2019/11/18/20970633/trump-vaping-ban'
    )
    expect(result).toMatchSnapshot()
  })

  it('Takes out /goods-newsletter/ internal ads from the end', async () => {
    const result = await runHref(
      page,
      'https://www.vox.com/the-goods/2019/11/18/20966941/thirdlove-bra-pivot-ai-inclusivity-employee'
    )
    expect(result).toMatchSnapshot()
  })

  it('Removes the twitter link to /first-person/ authors', async () => {
    const result = await runHref(
      page,
      'https://www.vox.com/first-person/2019/11/12/20961357/marquis-jefferson-black-family-heart'
    )
    expect(result).toMatchSnapshot()
  })

  it('quotes `blockquote`s and removes "related" `aside`s', async () => {
    const result = await runHref(
      page,
      'https://www.vox.com/2019/11/13/20961074/impeachment-hearings-testimony-live-stream-taylor-kent'
    )
    expect(result).toMatchSnapshot()
  })
})
