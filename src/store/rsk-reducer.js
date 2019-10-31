const assert = require("assert");
const { createSlice } = require("redux-starter-kit");
const { pick } = require("../utils");

const initialState = {};

const addHeadline = (state, action) => {
  let { payload } = action;
  if (!Array.isArray(payload)) payload = [payload];
  payload.forEach(update => {
    assert(update.href, "Update must contain `href`");
    // TODO consider getting rid of early return
    if (state[update.href]) return;
    assert(
      !state[update.href],
      "Article cannot be overwritten by a new headline"
    );
    state[update.href] = pick(update, ["href", "title"]);
    console.log("Headline found:", update.title || update.href);
  });
};

const assertValidArticle = (update, article) => {
  assert(update.href, "Article updates require `href`");
  assert("content" in update, 'Article updates require "content" key');
  assert(
    typeof update.content === "string",
    'Article content must be of type "string"'
  );
  assert("timestamp" in update, 'Article updates require "timestamp" key');
  assert(
    typeof timestamp === "string",
    'Article timestamp must be of type "string"'
  );
  assert("authors" in update, 'Article updates require "authors" key');
  assert(
    Array.isArray(authors) &&
      authors.every(author => "href" in author && "name" in author),
    "Article authors must have name and href (may be `null`)"
  );
  assert(
    update[key] || article[key],
    "`title` needs to be given in either an `updateArticle` action or `addHeadline` action"
  );
};

const updateArticle = (state, action) => {
  let { payload } = action;
  if (!Array.isArray(payload)) payload = [payload];
  payload.forEach(update => {
    assertValidArticle(update);
    const slice = state[update.href];
    state.content = update.content;
    state.timestamp = update.timestamp;
    state.authors = update.timestamp;
    if (update.title) state.title = update.title;
    console.log("Updated article", update.title || slice.title || update.href);
  });
};

const createNewsSourceSlice = newsSource =>
  createSlice({
    name: newsSource,
    initialState,
    reducers: {
      addHeadline,
      updateArticle
    }
  });

module.exports = {
  createNewsSourceSlice
};
