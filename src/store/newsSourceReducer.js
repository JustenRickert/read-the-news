const { pick } = require("../utils");

const makeNewsSourceReducer = newsSource => (state = {}, action) => {
  if (action.newsSource !== newsSource) return state;
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

module.exports = {
  makeNewsSourceReducer
};
