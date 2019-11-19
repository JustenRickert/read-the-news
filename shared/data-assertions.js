const assert = require("assert");

const assertValidArticle = (update, article = update) => {
  assert(update.href, "Article updates require `href`");
  assert("content" in update, 'Article updates require "content" key');
  assert(
    update.content && typeof update.content === "string",
    'Article content must be of type "string" and contentful'
  );
  assert(
    "publicationDate" in update,
    'Article updates require "publicationDate" key'
  );
  assert(
    update.publicationDate &&
      (typeof update.publicationDate === "string" ||
        update.publicationDate instanceof Date),
    'Article publicationDate must be of type "string" or a JavaScript Date object'
  );
  assert("authors" in update, 'Article updates require "authors" key');
  assert(
    Array.isArray(update.authors) &&
      update.authors.every(author => "href" in author && "name" in author),
    "Article authors must have name and href (may be `null`)"
  );
  assert(
    update.title || article.title,
    "`title` needs to be given in either an `updateArticle` action or `addHeadline` action"
  );
};

module.exports = {
  assertValidArticle
};
