const puppeteer = require("puppeteer");

const {
  makeAddArticlesAction,
  makeUpdateArticleNormalContentAction,
  makeUpdateArticleVideoContentAction
} = require("../store/actions");
const { makeArticlesWithoutContentSelector } = require("../store/selectors");
const { store, saveStore } = require("../store/index");
const { NBC } = require("../constant");
const { complement, partition, or } = require("../utils");

const {
  isNbcTextArticleLink,
  isNbcBetterHref,
  isNbcFeatureNbcOutHref
} = require("./nbc-utils");

const addArticles = makeAddArticlesAction(NBC);
const updateArticle = makeUpdateArticleNormalContentAction(NBC);
const articlesWithoutContent = makeArticlesWithoutContentSelector(NBC);

const NBC_URL = "https://www.nbcnews.com";

const articleContentUpdate = async page => {
  const title = await page.$eval(
    '[data-test="article-hero__headline"]',
    title => title.innerText
  );
  const timestamp = await page
    .$eval("time", timestamp => timestamp.innerText)
    .then(datetime => ({
      scrapeDate: Date(),
      datetime
    }));
  const authors = await page.$eval(
    '[data-test="byline"]',
    byline => byline.innerText
  );
  const shouldExcludeAdditionalTrailingParagraph = or(
    isNbcBetterHref,
    isNbcFeatureNbcOutHref
  )(page.url());
  const content = await page.$$eval(
    "p",
    (ps, shouldExcludeAdditionalTrailingParagraph) => {
      ps = Array.from(ps);
      const shouldExcludeFirstParagraph = ps[0].innerText[0] === "©";
      return (
        ps
          // I really hope this works for all articles lol... The first `p` tag
          // is sometimes an nbc copyright, the remaining are a tips article
          // that sometimes appears, an "about the author", and some random
          // thing
          .slice(
            shouldExcludeFirstParagraph ? 1 : 0,
            shouldExcludeAdditionalTrailingParagraph ? -3 : -2
          )
          .filter(
            p =>
              // I have no idea what this is. It's display:none and contains a
              // bunch of unrelated content...
              !p.querySelector('a[href="https://policies.google.com/terms"]') &&
              // This is quoted text from a paragraph captured separately
              !p.parentNode.classList.contains("liftOut")
          )
          .map(p => p.innerText)
      );
    },
    shouldExcludeAdditionalTrailingParagraph
  );
  return {
    title,
    timestamp,
    authors,
    content
  };
};

puppeteer.launch({ devtools: true }).then(async browser => {
  const page = await browser.newPage();
  // NBC is _sometimes_ slow... TODO(maybe) handle timeouts
  await page.setDefaultTimeout(100e3);
  await page.goto(NBC_URL);
  const textArticleLinks = await page
    .$$eval("a[href]", links =>
      links.map(l => ({ href: l.href, title: l.innerText }))
    )
    .then(links => links.filter(isNbcTextArticleLink));
  store.dispatch(addArticles(textArticleLinks));
  await articlesWithoutContent(store.getState()).reduce(
    (p, article) =>
      p.then(async () => {
        await page.goto(article.href);
        const articleContent = await articleContentUpdate(page);
        store.dispatch(
          updateArticle({ href: article.href, ...articleContent })
        );
        saveStore(store);
      }),
    Promise.resolve(null)
  );
});
