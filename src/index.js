const puppeteer = require("puppeteer");

const {
  addArticles,
  updateArticleVideoContent,
  updateArticleNormalContent,
  articlesWithoutContent,
  store
} = require("./store");
const { isFoxArticleVideo } = require("./fox-news-utils");

const sample = xs => xs[Math.floor(Math.random() * xs.length)];

const range = n =>
  Array(n)
    .fill(undefined)
    .map((_, i) => i);

const zip = xss => {
  const minLength = Math.min(...xss.map(xs => xs.length));
  return range(minLength).map(i => xss.map(xs => xs[i]));
};

const foxNews = "https://www.foxnews.com/";

const articleTitleSelector = "h2.title a";

const articleParagraphs = async page => {
  return page.$$eval(".article-body > p", articles =>
    Array.from(articles)
      .filter(article => {
        // These are ads that link to fox news articles unrelated to the current
        // article. They seem to be generated with a random order, which is
        // annoying...
        return ![["strong", "a"], ["a", "strong"], ["u", "strong", "a"]].some(
          selectorOrder => article.querySelector(selectorOrder.join(" "))
        );
      })
      .map(article => ({
        innerHTML: article.innerHTML
      }))
  );
};

const allDOMContent = (page, selector) =>
  page.$$eval(selector, tags =>
    Array.from(tags).map(tag => ({
      href: tag.href,
      innerHTML: tag.innerHTML
    }))
  );

const discoverAllHomepageArticles = async page => {
  await page.goto(foxNews);
  await allDOMContent(page, articleTitleSelector)
    .then(articles => {
      store.dispatch(
        addArticles(
          articles.map(article => ({
            ...article,
            title: article.innerHTML.trim()
          }))
        )
      );
    })
    .catch(console.error);
};

const articlePageContent = async page => {
  const embeddedTwitterMedia = await allDOMContent(
    page,
    ".article-body .embed-media.twitter"
  );
  const authors = await allDOMContent(
    page,
    '.author-byline a[href^="/person/"]'
  );
  const videoContainer = await page.$(".video-container");
  const ps = await articleParagraphs(page);
  const timestamp = await page
    .$eval("time", time => ({
      scrapeDate: Date(),
      relativeDate: time.innerHTML.trim()
    }))
    .catch(() => ({ scrapeDate: Date(), relativeDate: null }));
  const images = await page.$$eval(".image-ct.inline", imageSections =>
    Promise.all(
      imageSections.map(async section => {
        const img = section.querySelector("img");
        const p = section.querySelector(".caption p");
        return {
          imageSrc: img ? img.src : null,
          caption: p
            ? p.innerHTML
                .replace("\n", "")
                .replace(/ */, " ")
                .trim()
            : null
        };
      })
    )
  );
  return {
    authors,
    content: ps.map(p => p.innerHTML).join("\n"),
    hasVideo: Boolean(videoContainer),
    images,
    timestamp,
    twitterContent:
      embeddedTwitterMedia
        .map(
          content =>
            // TODO Maybe clean this up. It looks like we can pull the twitter id
            // which maps directly to a url like
            // `twitter.com/literally-a-random-user-name/status/<twitter-id>`
            `<div class=".embed-media-twitter">${content.innerHTML}</div>`
        )
        .join("") || null
  };
};

puppeteer.launch().then(async browser => {
  const page = await browser.newPage();
  await discoverAllHomepageArticles(page);
  const state = store.getState();
  await articlesWithoutContent(state).reduce(
    (prom, article) =>
      prom.then(async () => {
        if (article.visited) {
          return;
        } else if (isFoxArticleVideo(article)) {
          store.dispatch(updateArticleVideoContent(article));
        } else {
          await page.goto(article.href);
          const articleContent = await articlePageContent(page);
          store.dispatch(
            updateArticleNormalContent({
              href: article.href,
              title: article.title,
              ...articleContent
            })
          );
        }
      }),
    Promise.resolve(null)
  );
});
