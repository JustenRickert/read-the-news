import { createSlice, combineReducers, createStore } from "@reduxjs/toolkit";

const articles = createSlice({
  name: "articleRecord",
  initialState: {},
  reducers: {
    markNoArticlesOnServer(state, action) {
      const site = action.payload;
      state[site] = {};
      state[site].articles = [];
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

const store = createStore(
  combineReducers({ articles: articles.reducer, sites: sites.reducer })
);

const actions = {
  ...articles.actions,
  ...sites.actions
};

export { actions, store };
