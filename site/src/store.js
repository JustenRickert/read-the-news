import assert from "assert";
import {
  createSlice,
  combineReducers,
  createStore,
  applyMiddleware
} from "@reduxjs/toolkit";
import debounce from "lodash.debounce";
import { parseSite } from "read-the-news-shared/utils";
import uuid from "uuid/v4";

const stubDashboard = () => ({
  id: uuid(),
  createdDate: Date(),
  updatedDate: Date(),
  value: {}
});

const dashboard = createSlice({
  name: "dashboard",
  initialState: {
    onlineDashboards: {
      savedDashboards: {}
    },
    currentDashboard: stubDashboard(),
    savedDashboards: [],
    sentimentRecord: {}
  },
  reducers: {
    updateOnlineSavedDashboards(state, { payload: savedDashboards }) {
      Object.assign(state.onlineDashboards.savedDashboards, savedDashboards);
      savedDashboards.forEach(dashboard => {
        state.onlineDashboards.savedDashboards[dashboard.id] = dashboard;
      });
    },
    saveDashboard(state) {
      state.savedDashboards.push({
        ...state.currentDashboard,
        updatedDate: Date()
      });
      state.currentDashboard = stubDashboard();
    },
    returnToSavedDashboard(state, { payload: dashboard }) {
      state.savedDashboards = state.savedDashboards.filter(
        sd => sd.id !== dashboard.id
      );
      state.currentDashboard = dashboard;
    },
    removeArticles(state, { payload: articles }) {
      if (!Array.isArray(articles)) articles = [articles];
      articles.forEach(article => {
        const site = parseSite(article);
        delete state.currentDashboard.value[article.href];
      });
    },
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
      state.currentDashboard.value[href] = {
        href,
        error: true,
        message
      };
    },
    updateArticleRecord(state, { payload: article }) {
      state.currentDashboard.value[article.href] = article;
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

export const store = createStore(
  combineReducers({
    articles: articles.reducer,
    sites: sites.reducer,
    dashboard: dashboard.reducer
  }),
  preloadedState,
  applyMiddleware(save)
);

export const actions = {
  ...articles.actions,
  ...sites.actions,
  dashboard: dashboard.actions
};
