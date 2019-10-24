const makeUpdateArticleNormalContentAction = newsSource => (
  {
    href,
    title,
    authors,
    content,
    hasVideo,
    images,
    timestamp,
    twitterContent
  },
  { save = true } = {}
) => ({
  type: "UPDATE_CONTENT",
  newsSource,
  href,
  title,
  authors,
  content,
  hasVideo,
  images,
  timestamp,
  twitterContent,
  meta: { save }
});

const makeUpdateArticleVideoContentAction = newsSource => (
  { href, title },
  { save = true } = {}
) => ({
  newsSource,
  type: "UPDATE_CONTENT",
  title,
  href,
  isVideoContent: true,
  meta: { save }
});

const makeAddArticlesAction = newsSource => (
  articles,
  { save = true } = {}
) => ({
  type: "ADD_ARTICLES",
  newsSource,
  articles,
  meta: { save }
});

module.exports = {
  makeUpdateArticleVideoContentAction,
  makeUpdateArticleNormalContentAction,
  makeAddArticlesAction
};
