import assert from "assert";
import {
  createSlice,
  combineReducers,
  createStore,
  applyMiddleware
} from "@reduxjs/toolkit";
import debounce from "lodash.debounce";

const dashboard = createSlice({
  name: "dashboard",
  initialState: {
    dashboards: [],
    sentimentRecord: {},
    articleRecord: {}
  },
  reducers: {
    addSentimentForArticle(
      state,
      {
        payload: { href, sentiment }
      }
    ) {
      if (!state.sentimentRecord) state.sentimentRecord = {};
      state.sentimentRecord[href] = sentiment;
    },
    markArticleRecordCollectFailure(
      state,
      {
        payload: { href, message }
      }
    ) {
      state.articleRecord[href] = {
        href,
        error: true,
        message
      };
    },
    updateArticleRecord(state, { payload: article }) {
      state.articleRecord[article.href] = article;
    }
  }
});

const articles = createSlice({
  name: "articleRecord",
  initialState: {},
  reducers: {
    markNoArticlesOnServer(state, action) {
      const site = action.payload;
      state[site] = {};
      state[site].articles = {};
      state[site].noArticlesOnServer = true;
    },
    addArticles(
      state,
      {
        payload: { articles, site }
      }
    ) {
      if (!Array.isArray(articles)) articles = [articles];
      if (!state[site]) {
        state[site] = {
          articles: {},
          noArticles: true
        };
      }
      articles.forEach(article => {
        state[site].articles[article.href] = article;
        state[site].noArticles = false;
      });
    }
  }
});

const sites = createSlice({
  name: "siteRecord",
  initialState: {},
  reducers: {
    addSites(state, action) {
      const sites = action.payload;
      sites.forEach(({ site }) => {
        state[site] = { site };
      });
    }
  }
});

const locationPath = "STORE_STATE";

const loadState = () => {
  const data = localStorage.getItem(locationPath);
  return data && JSON.parse(data);
};

const saveState = store => {
  localStorage.setItem(locationPath, JSON.stringify(store.getState()));
};

const throttledSave = debounce(saveState, 5000);

const save = store => next => action => {
  throttledSave(store);
  return next(action);
};

const preloadedState = loadState() || undefined;

const store = createStore(
  combineReducers({
    articles: articles.reducer,
    sites: sites.reducer,
    dashboard: dashboard.reducer
  }),
  preloadedState,
  applyMiddleware(save)
);

const actions = {
  ...articles.actions,
  ...sites.actions,
  dashboard: dashboard.actions
};

export { actions, store };
