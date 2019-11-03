const isCnnVideoArticle = ({ href }) =>
  /^https?:\/\/www\.cnn\.com\/videos/.test(href);

const isCnnStyleArticle = ({ href }) =>
  /^https?:\/\/www\.cnn\.com\/style\//.test(href);

module.exports = {
  isCnnVideoArticle,
  isCnnStyleArticle
};
