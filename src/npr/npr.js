const assert = require("assert");
const puppeteer = require("puppeteer");

const { store, saveStore, npr } = require("../store");
const { NPR } = require("../constant");
const { or, partition, sequentiallyMap } = require("../utils");

const {
  isNprSectionsHref,
  isNprHref,
  isNprSeriesHref,
  isNprMusicVideosHref,
  isNprPodcastsHref
} = require("./npr-utils");

const NPR_URL = "https://www.npr.org/";

const parseTimestamp = (date, time) => {
  date = /(\w+) (\w+), (\w+)/.exec(date);
  time = /(\w+):(\w+) (AM|PM) ET/.exec(time);
  assert(date && time, "datetime must be invalid :(");
  const [, month, day, year] = date;
  let [, hour, minute, amOrPm] = time;
  if (amOrPm === "PM" && hour !== "12") hour = String(Number(hour) + 12);
  else if (amOrPm === "AM" && hour === "12") hour = String(Number(hour) - 12);
  // This format is serializable by `new Date(...).toString()`
  return `${day} ${month} ${year} ${hour.padStart(2, "0")}:${minute}:00 EST`;
};

const articleContents = async page => {
  const authors = await page.$$eval('div[aria-label="Byline"]', bylines => {
    const authors = bylines.map(byline => {
      const author = byline.querySelector("p a") || byline.querySelector("p");
      return {
        href: author.href,
        name: author.innerText
      };
    });
    return authors;
  });
  const ps = await page.$$eval("#storytext > p", ps => {
    // TODO(maybe) use this updateTimestamp somehow
    const updateTimestamp = ps[0].querySelector("strong");
    const paragraphs = ps.map(p => p.innerText);
    return {
      paragraphs: updateTimestamp ? paragraphs.slice(1) : paragraphs
    };
  });
  const timestampDate = await page.$eval("time .date", date => date.innerText);
  const timestampTime = await page.$eval("time .time", date => date.innerText);
  return {
    timestamp: parseTimestamp(timestampDate, timestampTime),
    content: ps.paragraphs.join("\n"),
    authors
  };
};

const discoverNpr = async page => {
  await page.goto(NPR_URL);
  const homepageHeadlines = await page
    .$$eval(".story-wrap", articles =>
      articles.map(article => {
        const link = article.querySelector("a");
        const title = article.querySelector("h3.title");
        return {
          href: link ? link.href : article.href,
          title: title && title.innerText
        };
      })
    )
    .then(headlines =>
      headlines.filter(
        // Don't want ads...
        isNprHref
      )
    );
  const [sections, headlines] = partition(
    homepageHeadlines,
    or(
      isNprSectionsHref,
      isNprSeriesHref,
      isNprMusicVideosHref,
      isNprPodcastsHref
    )
  );
  return { headlines, sections };
};

const articlesWithoutContent = state =>
  Object.values(state[NPR]).filter(article => !article.content);

const run = () =>
  puppeteer.launch({ devtools: true }).then(async browser => {
    const page = await browser.newPage();
    const { headlines, sections } = await discoverNpr(page);
    // TODO look at other sections
    await sequentiallyMap(sections.slice(1), async ({ href }) => {
      await page.goto(href);
      await page.waitFor(1000e3);
    });
    store.dispatch(npr.addHeadline(headlines));
    // TODO dispatch `addHeadlines` with other sections
    const updates = await sequentiallyMap(
      articlesWithoutContent(store.getState()).slice(0, 3),
      article => page.goto(article.href).then(() => articleContents(page))
    );
    store.dispatch(npr.updateArticle);
    // TODO dispatch these updates
    console.log(updates);
    saveStore(store);
    process.exit(0);
  });

module.exports = {
  __impl: {
    parseTimestamp
  },
  run
};
