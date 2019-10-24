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
  "---",
  "a",
  "about",
  "after",
  "and",
  "are",
  "as",
  "asked",
  "at",
  "be",
  "but",
  "by",
  "could",
  "for",
  "from",
  "go",
  "going",
  "has",
  "have",
  "he",
  "her",
  "his",
  "i",
  "in",
  "is",
  "it",
  "its",
  "may",
  "most",
  "new",
  "no",
  "not",
  "now",
  "of",
  "on",
  "or",
  "other",
  "our",
  "said",
  "she",
  "take",
  "that",
  "the",
  "their",
  "they",
  "this",
  "to",
  "us",
  "was",
  "we",
  "were",
  "what",
  "while",
  "who",
  "will",
  "with",
  "would",
  "you",
  "your"
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
    .replace("—", "---")
    .replace(/’/g, "'")
    .replace(/'s$/, "")
    .replace(/'$/g, "")
    .replace(/[–;…!?.,:"“”]/g, "")
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

const newsSource = process.argv[2];

if (!Object.keys(storeData).some(key => newsSource === key)) {
  console.error(`News source ${newsSource} not found in data`);
  console.error("Possible values:\n ", Object.keys(storeData).join("\n  "));
  console.log();
  throw new Error();
}

Object.values(storeData[newsSource]).forEach(article => {
  if (!article.content) return;
  const articleText = removeHtmlTags(article.content);
  const cleanedArticleText = cleanText(articleText);
  const articleKeywords = collectKeyPhrases(cleanedArticleText, 6);
  const { score, comparative } = sentiment.analyze(cleanedArticleText);
  console.log();
  console.log(article.title);
  console.log(articleKeywords);
  console.log({ score, comparative });
});
