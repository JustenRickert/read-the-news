import { useEffect, useState, useCallback } from "react";
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
      fetch(`/api/news-source/${currentSite}/random/5`)
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
    fetch(`/api/news-source`)
      .then(res => res.json())
      .then(sites => {
        onNewSites(sites);
      });
  }, []);
};

const getSentiment = href =>
  fetch(`/api/sentiment/${encodeURIComponent(href)}`)
    .then(res => res.json())
    .catch(e => {
      console.error(e.stack);
      return { error: true, message: e.stack };
    });

export const useDashboardHandles = ({
  articleRecord,
  onReceiveArticle,
  onReceiveSentiment,
  wsSend
}) => {
  const handleFetchHrefContentAsync = useCallback(
    href => {
      const site = parseSite(href);
      if (!site)
        return Promise.resolve({
          error: true,
          message: "HREF_BAD",
          href
        });
      let article = articleRecord[site] && articleRecord[site].articles[href];
      if (!article) {
        article = fetch(`/news-source/${site}/${encodeURIComponent(href)}`)
          .then(res => res.json())
          .then(article => {
            onReceiveArticle(article);
            getSentiment(href).then(sentiment =>
              onReceiveSentiment({ sentiment, href })
            );
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
        getSentiment(href).then(sentiment =>
          onReceiveSentiment({ href, sentiment })
        );
      }
      return Promise.resolve(article);
    },
    [articleRecord, onReceiveArticle, wsSend]
  );
  return { handleHrefContent: handleFetchHrefContentAsync };
};
