const makeArticlesWithoutContentSelector = newsSource => state => {
  return Object.values(state[newsSource]).filter(
    article => !article.content || article.isVideoContent
  );
};

module.exports = {
  makeArticlesWithoutContentSelector
};
