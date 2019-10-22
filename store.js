const path = require("path");
const throttle = require("lodash.throttle");
const fs = require("fs");
const { createStore, applyMiddleware } = require("redux");

const pick = (o, keys) =>
  keys.reduce((acc, key) => Object.assign(acc, { [key]: o[key] }), {});

const updateArticleNormalContent = ({
  href,
  title,
  authors,
  content,
  hasVideo,
  images,
  timestamp,
  twitterContent
}) => ({
  type: "UPDATE_CONTENT",
  href,
  title,
  authors,
  content,
  hasVideo,
  images,
  timestamp,
  twitterContent
});

const updateArticleVideoContent = ({ href, title }) => ({
  type: "UPDATE_CONTENT",
  title,
  href,
  isVideoContent: true
});

const addArticles = articles => ({
  type: "ADD_ARTICLES",
  articles
});

const reducer = (state = {}, action) => {
  let newState = null;
  switch (action.type) {
    case "UPDATE_CONTENT": {
      newState = Object.assign({}, state);
      if (action.content) {
        console.log("update content!", action.title);
        Object.assign(newState, {
          [action.href]: Object.assign(
            {},
            state[action.href],
            pick(action, [
              "authors",
              "content",
              "hasVideo",
              "images",
              "timestamp",
              "twitterContent"
            ])
          )
        });
      }
      if (action.isVideoContent) {
        console.log("update video content!", action.title);
        Object.assign(newState, {
          [action.href]: Object.assign({}, state[action.href], {
            visited: true,
            isVideoContent: true
          })
        });
      }
      break;
    }
    case "ADD_ARTICLES":
      newState = Object.assign({}, state);
      Object.assign(
        newState,
        action.articles.reduce((newArticles, { href, title }) => {
          if (!state[href]) {
            console.log("new article!", title);
            Object.assign(newArticles, { [href]: { title, href } });
          }
          return newArticles;
        }, {})
      );
      break;
  }
  return newState || state;
};

const articlesWithoutContent = state => {
  return Object.values(state).filter(
    article => !article.content || article.isVideoContent
  );
};

const cwd = process.cwd();

const dataStoreFilename = path.join(cwd, "data", "store.json");

const ensureDir = filepath => {
  if (!fs.existsSync(path.dirname(filepath))) {
    ensureDir(path.dirname(filepath));
    fs.mkdirSync(path.dirname(filepath));
  }
};

ensureDir(dataStoreFilename);

// const logAction = () => next => action => {
//   console.log(action);
//   return next(action);
// };

const throttledWriteSync = throttle(fs.writeFileSync(...args), 30000);

const saveContentMiddleware = ({ dispatch, getState }) => next => action => {
  const result = next(action);
  throttledWriteSync(
    dataStoreFilename,
    JSON.stringify(getState(), null, 2),
    "utf-8"
  );
  return result;
};

const initialState = () => {
  if (!fs.existsSync(dataStoreFilename)) return undefined;
  const result = fs.readFileSync(dataStoreFilename, "utf-8");
  return JSON.parse(result);
};

const store = createStore(
  reducer,
  initialState(),
  applyMiddleware(saveContentMiddleware)
);

module.exports = {
  addArticles,
  updateArticleVideoContent,
  updateArticleNormalContent,
  articlesWithoutContent,
  store
};
