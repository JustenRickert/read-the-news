import assert from "assert";
import React, { useReducer, useEffect, useState, useRef } from "react";
import { createSlice, combineReducers } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import throttle from "lodash.throttle";
import { parseSite } from "shared/utils";

import { actions as storeActions } from "../store";

import Article from "./Article";
import Section from "./Section";
import Pagination from "./Pagination";
import Dashboard from "./Dashboard";
import "./App.css";

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
      ws.current = new WebSocket("ws://" + "192.168.1.7:3001");
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
      : () => {},
    ws
  ];
};

const clamp = (low, high, n) => {
  if (n >= high) return high;
  if (n < low) return low;
  return n;
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

const dashboard = createSlice({
  name: "dashboard",
  // initialState: {
  //   dashboards: [],
  //   hrefRecord: {}
  // },
  reducers: {
    updateHrefRecord(
      state,
      {
        payload: { href, article }
      }
    ) {
      state.hrefRecord[href] = article;
    }
  }
});

const Tabination = ({ children }) => {
  if (!Array.isArray(children)) children = [children];
  const [currentTab, setCurrentTab] = useState(0);
  console.log(currentTab, children[currentTab]);
  return (
    <div>
      <ul>
        {range(children.length).map(i => (
          <li onClick={() => setCurrentTab(i)} children={`experiment ${i}`} />
        ))}
      </ul>
      <div>
        {children.map((child, i) => (
          <div
            style={currentTab !== i ? { display: "none" } : null}
            children={child}
          />
        ))}
      </div>
    </div>
  );
};

function App() {
  const storeDispatch = useDispatch();
  const [dashboardState, dashboardDispatch] = useReducer(dashboard.reducer, {
    dashboards: [],
    hrefRecord: {}
  });
  const [{ currentSite, currentPage }, sectionDispatch] = useReducer(
    section.reducer,
    {
      currentSite: "",
      currentPage: 0
    }
  );
  const articleRecord = useSelector(state => state.articles) || {};
  const sites = useSelector(state => state.sites) || {};

  useEffect(() => {
    fetch(`http://192.168.1.7:3001/api/news-source`)
      .then(res => res.json())
      .then(sites => {
        storeDispatch(storeActions.addSites(sites));
        sectionDispatch(
          section.actions.tab(sample(sites.map(({ site }) => site)))
        );
      });
  }, []);

  useEffect(() => {
    if (
      currentSite &&
      (!articleRecord[currentSite] ||
        (!articleRecord[currentSite].noArticlesOnServer &&
          !articleRecord[currentSite].articles.length))
      // || currentPage > articles[currentSite].articles.length - 2
    )
      fetch(`http://192.168.1.7:3001/api/news-source/${currentSite}/random/5`)
        .then(res => res.json())
        .then(articles => {
          if (!articles.length)
            storeDispatch(storeActions.markNoArticlesOnServer(currentSite));
          else
            storeDispatch(
              storeActions.addArticles({ site: currentSite, articles })
            );
        });
  }, [currentSite, articleRecord[currentSite]]);

  const [ws, wsDispatch] = useWsConnectionRefState({
    onMessage: payload => {
      const message = JSON.parse(payload.data).message;
      switch (message.type) {
        case "CLIENT#COLLECT#SUCCESS":
          // updateHrefDraft(message.site, message.article);
          break;
      }
    },
    onError: e => console.log("ERROR", e)
  });

  const siteArticleRecord = articleRecord[currentSite];

  const handleFetchHrefDataMaybeAsync = href => {
    console.log(sites, href, sites[href]);
    const site = parseSite(href);
    const article =
      articleRecord[site].articles[href] ||
      fetch(
        `http://192.168.1.7:3001/news-source/${encodeURIComponent(href)}`
      ).then(res => res.json());
    if (isPromise(article)) console.log({ article });
    else article.then(console.log);
    dashboardDispatch(dashboard.actions.updateHrefRecord({ href, article }));
    return article;
  };

  return (
    <div className="App">
      <Tabination>
        <Dashboard
          hrefRecord={dashboardState.hrefRecord}
          onFetchHrefData={handleFetchHrefDataMaybeAsync}
        />
        <div>
          <Section
            sites={sites}
            onChangeSection={site => sectionDispatch(section.actions.tab(site))}
          />
          <Article
            article={
              siteArticleRecord && siteArticleRecord.articles[currentPage]
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
