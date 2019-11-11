const isCnnHref = ({ href }) => /^https?:\/\/www\.cnn\.com/.test(href);

const isFoxHref = ({ href }) => /^https:\/\/www.foxnews\.com/.test(href);

const isNbcHref = ({ href }) => /^https?:\/\/www\.nbcnews\.com/.test(href);

const isNprHref = ({ href }) => /^https?:\/\/www\.npr\.org/.test(href);

module.exports = {
  isCnnHref,
  isFoxHref,
  isNbcHref,
  isNprHref
};
