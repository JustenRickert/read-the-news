const assert = require('assert')
const { store, theNation } = require('../../store')
const {
  and,
  dropRightWhile,
  or,
  range,
  sequentiallyDoTimes,
  sequentiallyDoWhile,
  sequentiallyMap,
  unique,
} = require('../../utils')
const { isTheNationHref } = require('../../../../shared/predicates')

const nonNavigableSections = [
  'https://www.thenation.com/',
  'https://www.thenation.com/world',
  'https://www.thenation.com/economy',
  'https://www.thenation.com/culture',
]

const navigableSections = [
  'https://www.thenation.com/subjects/politics',
  'https://www.thenation.com/subjects/society',
  'https://www.thenation.com/subjects/environment',
]

const isHeadline = ({ href }) => /article\/[\w\-]+\/?/.test(href)

const collect = async (page, needsContent) => []

const discover = async page => {
  // const nonNavigableSectionHeadlines = await sequentiallyMap(
  //   nonNavigableSections,
  //   async url => {
  //     await page.goto(url)
  //     return page.$$eval('a[href]', ls => ls.map(l => ({ href: l.href })))
  //   }
  // )
  // const navigableSectionHeadlines = await sequentiallyMap(
  //   navigableSections,
  //   url =>
  //     sequentiallyMap(range(10), async i => {
  //       await page.goto(`${url}/?page=${i + 1}`)
  //       return page.$$eval('a[href]', ls => ls.map(l => ({ href: l.href })))
  //     })
  // )
  // return nonNavigableSectionHeadlines
  //   .concat(navigableSectionHeadlines)
  //   .filter(isHeadline)
  return []
}

module.exports = {
  slice: theNation,
  collect,
  discover,
}
