const assert = require('assert')
const {
  partitionGroups,
  sequentiallyMap,
  unique,
  dropRightWhile,
  sequentiallyDoTimes,
} = require('../../utils')

const THE_INTERCEPT = 'https://theintercept.com'

const isTheInterceptSection = ({ href }) =>
  /^https:\/\/theintercept\.com\/(politics|justice|national-security|world|technology|environment)\/?/.test(
    href
  )

const isTheInterceptHeadline = ({ href }) =>
  /\/\d{4}\/\d{2}\/\d{2}\/[\w\-]+\/?$/.test(href)

const discoverLinks = page =>
  page
    .$$eval('a[href]', ls =>
      ls
        .filter(l => /^https?:\/\/theintercept\.com/.test(l.href))
        .map(l => ({ href: l.href }))
    )
    .then(ls =>
      partitionGroups(ls, {
        headlines: isTheInterceptHeadline,
        sections: isTheInterceptSection,
      })
    )

const discover = async (page, sectionHref = null) => {
  await page.goto(sectionHref || THE_INTERCEPT)

  if (sectionHref) {
    await sequentiallyDoTimes(100, () =>
      page
        .evaluate(() => window.scrollBy(0, window.innerHeight))
        .then(() => page.waitFor(100))
    )
    const { headlines } = await discoverLinks(page)
    console.log('Found', headlines.length, 'headlines on', sectionHref)
    return headlines
  }

  const { headlines, sections } = await discoverLinks(page)

  return sequentiallyMap(unique(sections, ({ href }) => href), section =>
    discover(page, section.href).then(sectionHeadlines =>
      unique(headlines.concat(sectionHeadlines), ({ href }) => href)
    )
  )
}

const parseDate = date => {
  // WARNING: the last capture group has a nbsp space in it, so we have to treat
  // it differently than normal...
  const result = /(\w+) (\d+) (\d+), (\d+:\d+)(.+)/.exec(date)
  assert(result, 'Date parsing failed')
  let [, month, day, year, hourMinute, amOrPm] = result
  amOrPm = amOrPm.slice(1)
  return new Date(
    [year, month, day, hourMinute, amOrPm.replace(/\./g, '')].join(' ')
  )
}

const collect = async (page, href) => {
  await page.goto(href)
  const title = await page.$eval('h1', title => title.textContent)

  const authors = await page.$$eval(
    '.PostByline-names .PostByline-link',
    $bylines =>
      $bylines.map($by => ({
        href: $by.href,
        name: $by.textContent,
      }))
  )
  const date = await page.$eval('.PostByline-date', date => date.innerText)
  const content = await page
    .$eval('.PostContent', $content =>
      Array.from($content.childNodes)
        .filter($section => {
          if (
            ['img-wrap', 'PhotoGrid'].some(className =>
              $section.classList.contains(className)
            )
          )
            return false
          return true
        })
        .reduce((ps, $section) => {
          const $chapter = $section.querySelector('.chapter')
          if ($chapter) return ps.concat($chapter.textContent)
          const innerPs = Array.from($section.querySelectorAll('p') || [])
          return ps.concat(
            innerPs
              .filter($p => {
                const $subscribeTo = $p.querySelector('.no-underline')
                if ($subscribeTo && /subscribe/i.test($subscribeTo.textContent))
                  return false
                if (/^<em>.*<\/em>$/.test($p.innerHTML)) return false
                const $correction = $p.querySelector('strong')
                if (
                  $correction &&
                  /^(Correction|Update):/.test($correction.textContent)
                )
                  return false
                return true
              })
              .map($p => $p.textContent)
          )
        }, [])
        .map(p => p.trim())
        .filter(Boolean)
    )
    .then(paragraphs => paragraphs.join('\n'))
  return {
    href,
    title,
    authors,
    publicationDate: parseDate(date),
    content,
  }
}

module.exports = {
  discover,
  collect,
}
