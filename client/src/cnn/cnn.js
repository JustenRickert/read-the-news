const puppeteer = require("puppeteer");

const {
  makeAddArticlesAction,
  makeUpdateArticleNormalContentAction,
  makeUpdateArticleVideoContentAction
} = require("../store/actions");
const { makeArticlesWithoutContentSelector } = require("../store/selectors");
const { store, saveStore } = require("../store/index");
const { CNN } = require("../constant");
const { complement, partition, or } = require("../utils");

const { isCnnVideoArticle, isCnnStyleArticle } = require("./cnn-utils");

const addArticles = makeAddArticlesAction(CNN);
const updateArticle = makeUpdateArticleNormalContentAction(CNN);
const updateArticleVideoContent = makeUpdateArticleVideoContentAction(CNN);
const articlesWithoutContent = makeArticlesWithoutContentSelector(CNN);

const CNN_URL = "https://www.cnn.com";

const articleContentUpdates = async page => {
  const title = await page.$eval("h1.pg-headline", title => title.innerHTML);
  const authors = await page.$eval(
    ".metadata .metadata__byline__author",
    authors => authors.innerHTML
  );
  const timestamp = await page.$eval(
    ".metadata .update-time",
    timestamp => timestamp.innerText
  );
  const content = await page.$eval('[data-zn-id="body-text"]', body => {
    const ps = body.querySelectorAll(".zn-body__paragraph");
    return (
      Array.from(ps)
        // This is an advertisement...
        .filter(p => !/^<a href=.*<\/a>$/.test(p.innerHTML))
        .map(p => p.innerText)
    );
  });
  return {
    title,
    authors,
    timestamp,
    content: [content[0].slice(5)].concat(content.slice(1)).join("\n")
  };
};

const discoverAllHomepageLinks = async page => {
  const articles = await page.$$eval(".cd__headline a[href]", articles =>
    articles.map(article => {
      const title = article.querySelector(".cd__headline-text").innerHTML;
      return {
        title: title.replace(/&amp;/g, "&"),
        href: article.href
      };
    })
  );
  return articles.filter(complement(or(isCnnStyleArticle, isCnnVideoArticle)));
};

puppeteer.launch({ devtools: true }).then(async browser => {
  const page = await browser.newPage();
  // CNN is really slow... TODO(maybe) skip hrefs that take a really long time.
  await page.setDefaultTimeout(100e3);
  await page.goto(CNN_URL);
  const articles = await discoverAllHomepageLinks(page);
  store.dispatch(addArticles(articles));
  const articlesNeedingContent = articlesWithoutContent(store.getState());
  await articlesNeedingContent.reduce(
    (p, a) =>
      p.then(async () => {
        await page.goto(a.href);
        const article = await articleContentUpdates(page);
        store.dispatch(updateArticle({ href: a.href, ...article }));
      }),
    Promise.resolve(null)
  );
  saveStore(store);
  process.exit(0);
});
