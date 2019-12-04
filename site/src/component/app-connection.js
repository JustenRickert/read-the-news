import { useEffect } from "react";
import { parseSite } from "shared/utils";

export const useLazyGetRandomArticles = ({
  articleRecord,
  currentPage,
  currentSite,
  onNoArticlesOnServer,
  onNewArticles
}) => {
  useEffect(() => {
    const siteArticles = currentSite && articleRecord[currentSite];
    if (
      !siteArticles ||
      (siteArticles &&
        !siteArticles.noArticlesOnServer &&
        (!Object.values(siteArticles).length ||
          siteArticles.noArticles ||
          currentPage + 2 > Object.values(siteArticles.articles).length))
    ) {
      fetch(`http://192.168.1.7:3001/api/news-source/${currentSite}/random/5`)
        .then(res => res.json())
        .then(articles => {
          if (!articles.length) {
            onNoArticlesOnServer(currentSite);
          } else {
            onNewArticles({ site: currentSite, articles });
          }
        });
    }
  }, [
    currentSite,
    currentPage,
    articleRecord[currentSite],
    onNoArticlesOnServer,
    onNewArticles
  ]);
};

export const useSites = ({ onNewSites }) => {
  useEffect(() => {
    fetch(`http://192.168.1.7:3001/api/news-source`)
      .then(res => res.json())
      .then(sites => {
        onNewSites(sites);
      });
  }, []);
};

export const useHrefFetchHandles = ({
  articleRecord,
  onReceiveArticle,
  wsSend
}) => {
  let handleFetchHrefContentAsync = () => {};
  useEffect(() => {
    handleFetchHrefContentAsync = href => {
      const site = parseSite(href);
      if (!site)
        return Promise.resolve({
          error: true,
          message: "HREF_BAD",
          href
        });
      let article = articleRecord[site] && articleRecord[site].articles[href];
      if (!article) {
        article = fetch(
          `http://192.168.1.7:3001/api/news-source/${site}/${encodeURIComponent(
            href
          )}`
        )
          .then(res => res.json())
          .then(article => {
            onReceiveArticle(article);
            return article;
          })
          .catch(() => {
            wsSend({ type: "SEND#UPDATE#HREF", href, context: "DASHBOARD" });
            return {
              error: true,
              message: "ARTICLE_NOT_FOUND",
              result: "TRYING_TO_READ"
            };
          });
      } else {
        onReceiveArticle(article);
      }
      return Promise.resolve(article);
    };
  }, [wsSend, articleRecord, onReceiveArticle]);
  return { fetchHrefContent: handleFetchHrefContentAsync };
};
