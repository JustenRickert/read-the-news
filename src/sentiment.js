const fs = require("fs");
const Sentiment = require("sentiment");

const { dataStoreFilename } = require("./constant");
const { removeHtmlTags } = require("./parse-utils");

const storeData = require(dataStoreFilename);

const range = n =>
  Array(n)
    .fill(undefined)
    .map((_, i) => i);

const commonWords = [
  "a",
  "and",
  "are",
  "at",
  "be",
  "but",
  "by",
  "for",
  "go",
  "going",
  "he",
  "her",
  "his",
  "i",
  "in",
  "is",
  "it",
  "may",
  "most",
  "new",
  "no",
  "not",
  "now",
  "of",
  "on",
  "or",
  "our",
  "said",
  "she",
  "that",
  "the",
  "their",
  "they",
  "this",
  "to",
  "us",
  "was",
  "we",
  "what",
  "who",
  "will",
  "with"
];

const isNonPhrase = phrase => {
  const words = phrase.split(" ");
  if (words.every(word => commonWords.includes(word))) {
    return true;
  }
  return false;
};

const splitIntoWords = text => text.split(/\s|---?/);

const cleanWord = word =>
  word
    .replace(/’/g, "'")
    .replace(/'s$/, "")
    .replace(/'$/g, "")
    .replace(/[;…!?.,:"“”]/g, "")
    .toLowerCase();

const cleanText = text => text.replace(/&amp;/g, "&").replace(/&nbsp;/g, " ");

const ngrams = (text, n) => {
  const words = splitIntoWords(text).map(cleanWord);
  return range(words.length - n + 1).map(i => range(n).map(j => words[i + j]));
};

const collectKeyPhrases = (text, count = 10) => {
  return [1, 2, 3]
    .reduce((ngramsRecord, n) => {
      const record = ngrams(text, n).reduce((record, ngram) => {
        const phrase = ngram.join(" ");
        if (!phrase) return record;
        if (!record[phrase]) record[phrase] = 1;
        else record[phrase]++;
        return record;
      }, {});
      return ngramsRecord.concat(
        Object.entries(record).filter(
          ([phrase, _occurences]) => !isNonPhrase(phrase)
        )
      );
    }, [])
    .sort(([_k1, v1], [_k2, v2]) => v2 - v1)
    .slice(0, count)
    .map(([phrase]) => phrase);
};

const sentiment = new Sentiment();

Object.values(storeData).forEach(article => {
  if (!article.content) return;
  const articleText = removeHtmlTags(article.content);
  const cleanedArticleText = cleanText(articleText);
  const articleKeywords = collectKeyPhrases(cleanedArticleText, 5);
  const { score, comparative } = sentiment.analyze(cleanedArticleText);
  console.log();
  console.log(article.title);
  console.log(articleKeywords);
  console.log({ score, comparative });
});
