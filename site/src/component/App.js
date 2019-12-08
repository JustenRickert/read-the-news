import React, { useReducer, useEffect, useState, useRef } from "react";
import { createSlice, combineReducers } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import throttle from "lodash.throttle";
import { parseSite } from "shared/utils";

import { actions as storeActions } from "../store";

import {
  useSites,
  useLazyGetRandomArticles,
  useDashboardHandles
} from "./app-connection";

import Article from "./Article";
import Section from "./Section";
import Pagination from "./Pagination";
import Dashboard from "./Dashboard";
import "./App.css";

const IS_DEV = process.env.NODE_ENV === "development";

const range = n =>
  Array(n)
    .fill(undefined)
    .map((_, i) => i);

const isPromise = o =>
  o && typeof o === "object" && typeof o.then === "function";

const sample = xs => xs[Math.floor(Math.random() * xs.length)];

const unique = (xs, idFn) =>
  xs.reduce(
    (uniqueXs, x) =>
      uniqueXs.some(ux => idFn(ux) === idFn(x)) ? uniqueXs : uniqueXs.concat(x),
    []
  );

let UNIQUE_ID_COUNTER = 0;
const uniqueId = () => UNIQUE_ID_COUNTER++;

const noop = () => {};

const useWsConnectionRefState = ({
  onMessage = noop,
  onOpen = noop,
  onClose = noop,
  onError = noop
}) => {
  const ws = useRef(null);
  useEffect(() => {
    if (!ws.current) {
      ws.current = new WebSocket(
        "ws://" +
          window.location.hostname +
          ":" +
          (IS_DEV ? 3001 : window.location.port)
      );
    }
    ws.current.onmessage = onMessage;
    ws.current.onopen = onOpen;
    ws.current.onclose = onClose;
    ws.current.onerror = onError;
  }, [onMessage, onOpen, onClose, onError]);
  return [
    ws.current,
    ws.current
      ? message => {
          const id = uniqueId();
          ws.current.send(JSON.stringify({ id, message }));
          return id;
        }
      : noop,
    ws
  ];
};

const clamp = (low, high, n) => {
  if (n >= high) return high;
  if (n < low) return low;
  return n;
};

const Tabination = ({ children }) => {
  if (!Array.isArray(children)) children = [children];
  const [tab, setTab] = useState(0);
  return (
    <div>
      <ul>
        {range(children.length).map(i => (
          <li onClick={() => setTab(i)} children={`experiment ${i}`} />
        ))}
      </ul>
      <div>
        {children.map((child, i) => (
          <div
            style={tab !== i ? { display: "none" } : null}
            children={child}
          />
        ))}
      </div>
    </div>
  );
};

const clampPage = (n, length) => clamp(0, length - 1, n);

const section = createSlice({
  name: "section",
  initialState: {
    currentSite: "",
    currentPage: 0
  },
  reducers: {
    tab(state, action) {
      const site = action.payload;
      state.currentSite = site;
    },
    page(state, action) {
      const { length, n, type } = action.payload;
      switch (type) {
        case "NEXT": {
          state.currentPage = clampPage(state.currentPage + 1, length);
          break;
        }
        case "PREVIOUS": {
          state.currentPage = clampPage(state.currentPage - 1, length);
          break;
        }
        case "LAST": {
          state.currentPage = clampPage(length, length);
          break;
        }
        case "FIRST": {
          state.currentPage = clampPage(0, length);
          break;
        }
        default: {
          if (typeof action === "number") {
            state.currentPage = clampPage(n, length);
            break;
          }
          throw new Error("case not handled");
        }
      }
    }
  }
});

function App() {
  const storeDispatch = useDispatch();
  const dashboardState = useSelector(state => state.dashboard);
  const articleRecord = useSelector(state => state.articles) || {};
  const sites = useSelector(state => state.sites) || {};

  const [{ currentSite, currentPage }, sectionDispatch] = useReducer(
    section.reducer,
    {
      currentSite: "",
      currentPage: 0
    }
  );

  const [ws, wsSend] = useWsConnectionRefState({
    onMessage: payload => {
      payload = JSON.parse(payload.data);
      const message = payload.message;
      switch (payload.type) {
        case "CLIENT#COLLECT#FAIL":
          if (payload.context === "DASHBOARD") {
            storeDispatch(
              storeActions.dashboard.markArticleRecordCollectFailure(message)
            );
          }
          break;
        case "CLIENT#COLLECT#SUCCESS":
          if (payload.context === "DASHBOARD") {
            storeDispatch(
              storeActions.dashboard.updateArticleRecord(message.article)
            );
          }
          storeDispatch(
            storeActions.addArticles({
              site: message.site,
              articles: message.article
            })
          );
          break;
      }
    },
    onError: e => console.log("ERROR", e)
  });

  useSites({
    onNewSites: sites => {
      storeDispatch(storeActions.addSites(sites));
      sectionDispatch(
        section.actions.tab(sample(sites.map(({ site }) => site)))
      );
    }
  });

  useLazyGetRandomArticles({
    articleRecord,
    currentPage,
    currentSite,
    onNoArticlesOnServer: payload => {
      storeDispatch(storeActions.markNoArticlesOnServer(payload));
    },
    onNewArticles: payload => {
      storeDispatch(storeActions.addArticles(payload));
    }
  });

  const { handleHrefContent, handleSentiment } = useDashboardHandles({
    articleRecord,
    onReceiveArticle: article => {
      storeDispatch(storeActions.dashboard.updateArticleRecord(article));
    },
    onReceiveSentiment: ({ error, href, sentiment }) => {
      if (error) {
        return;
        console.log(error);
      }
      storeDispatch(
        storeActions.dashboard.addSentimentForArticle({
          href,
          sentiment
        })
      );
    },
    wsSend
  });

  const siteArticleRecord = articleRecord[currentSite];

  return (
    <div className="App">
      <Tabination>
        <Dashboard
          {...dashboardState}
          onFetchHrefContent={handleHrefContent}
          onFetchSentiment={handleSentiment}
        />
        <div>
          <Section
            sites={sites}
            onChangeSection={site => sectionDispatch(section.actions.tab(site))}
          />
          <Article
            article={
              siteArticleRecord &&
              Object.values(siteArticleRecord.articles)[currentPage]
            }
          />
          <Pagination
            onChangePage={payload =>
              sectionDispatch(section.actions.page(payload))
            }
            articles={siteArticleRecord && siteArticleRecord.articles}
          />
        </div>
      </Tabination>
    </div>
  );
}

export default App;
