const puppeteer = require("puppeteer");

const {
  makeAddArticlesAction,
  makeUpdateArticleNormalContentAction
} = require("../store/actions");
const { makeArticlesWithoutContentSelector } = require("../store/selectors");
const { store, saveStore } = require("../store/index");
const { NPR } = require("../constant");
const { or, complement } = require("../utils");

const {
  isNprSectionHref,
  isNprHref,
  isNprSeriesHref,
  isNprMusicVideosHref,
  isNprPodcastsHref
} = require("./npr-utils");

const addArticles = makeAddArticlesAction(NPR);
const updateArticles = makeUpdateArticleNormalContentAction(NPR);
const articlesWithoutContent = makeArticlesWithoutContentSelector(NPR);

const NPR_URL = "https://www.npr.org/";

const updateArticleContent = async page => {
  const authors = await page.$$eval('div[aria-label="Byline"]', bylines => {
    const authors = bylines.map(byline => {
      const author = byline.querySelector("p a") || byline.querySelector("p");
      return {
        href: author.href,
        name: author.innerHTML.trim()
      };
    });
    return authors;
  });
  const ps = await page.$$eval("#storytext > p", ps => {
    const updateTimestamp = ps[0].querySelector("strong");
    const paragraphs = ps.map(p => p.innerHTML.trim().replace(/&amp;/g, "&"));
    return {
      updateTimestamp: updateTimestamp && updateTimestamp.innerHTML,
      paragraphs: updateTimestamp ? paragraphs.slice(1) : paragraphs
    };
  });
  const timestampDate = await page.$eval("time .date", date => date.innerHTML);
  const timestampTime = await page.$eval("time .time", date => date.innerHTML);
  return {
    timestamp: {
      date: timestampDate,
      time: timestampTime,
      updated: ps.updateTimestamp,
      scrapeDate: Date()
    },
    content: ps.paragraphs.join("\n"),
    authors
  };
};

const gotoSectionAndDiscoverAllArticles = async (page, sectionHref) => {
  await page.goto(sectionHref);
  // TODO
};

const discoverAllHomepageLinks = async page => {
  return await page
    .$$eval(".story-wrap", articles =>
      articles.map(article => {
        const link = article.querySelector("a");
        const title = article.querySelector("h3.title");
        return {
          href: link ? link.href : article.href,
          title: title && title.innerHTML.replace(/&amp;/g, "&")
        };
      })
    )
    .then(articles => articles.filter(isNprHref));
};

const discoverAllHomepageArticles = async page => {
  const immediateArticles = await discoverAllHomepageLinks(page).then(
    articles =>
      articles.filter(
        complement(
          // TODO These hrefs may lead to articles that can have their content
          // scraped.
          or(
            isNprSectionHref,
            isNprSeriesHref,
            isNprMusicVideosHref,
            isNprPodcastsHref
          )
        )
      )
  );
  return immediateArticles;
};

puppeteer.launch({ devtools: true }).then(async browser => {
  const page = await browser.newPage();
  await page.goto(NPR_URL);
  const articles = await discoverAllHomepageArticles(page);
  store.dispatch(addArticles(articles));
  await articlesWithoutContent(store.getState()).reduce(
    (p, article) =>
      p.then(async () => {
        await page.goto(article.href);
        const articleContent = await updateArticleContent(page);
        store.dispatch(
          updateArticles({
            href: article.href,
            title: article.title,
            ...articleContent
          })
        );
      }),
    Promise.resolve(null)
  );
  saveStore(store);
  process.exit(0);
});