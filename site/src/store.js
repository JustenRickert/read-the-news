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
    addArticles(state, action) {
      const { articles, site } = action.payload;
      state[site] = {};
      if (!state[site].articles) state[site].articles = articles;
      else state[site].articles.push(...articles);
      state[site].noArticles = false;
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
