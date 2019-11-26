import throttle from "lodash.throttle";
import React, { useReducer, useEffect, useRef } from "react";
import logo from "./logo.svg";
import "./App.css";

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
  if (n >= high - 1) return high - 1;
  if (n < low) return low;
  return n;
};

const clampPage = (n, articles) => clamp(0, articles.length, n);

const reducer = (state, action) => {
  switch (action.type) {
    case "NEXT_PAGE": {
      const { currentSite } = action.payload;
      const siteSlice = state.siteRecord[currentSite];
      return {
        ...state,
        currentPage: clampPage(
          state.currentPage + 1,
          siteSlice ? siteSlice.articles : []
        )
      };
    }
    case "PREVIOUS_PAGE": {
      const { currentSite } = action.payload;
      const siteSlice = state.siteRecord[currentSite];
      return {
        ...state,
        currentPage: clampPage(
          state.currentPage - 1,
          siteSlice ? siteSlice.articles : []
        )
      };
    }
    case "NAVIGATION#SITE":
      return {
        ...state,
        currentSite: action.payload
      };
    case "GET_RANDOM_FOR_SITE": {
      const { site, articles } = action.payload;
      const siteSlice = state.siteRecord[site];
      const newArticles = unique(
        siteSlice.articles.concat(articles),
        ({ href }) => href
      );
      return {
        ...state,
        siteRecord: Object.assign({}, state.siteRecord, {
          [site]: {
            ...siteSlice,
            hasNoArticles: !newArticles.length,
            articles: newArticles
          }
        })
      };
    }
    case "UPDATE_STATE_DRAFT": {
      const { site, article } = action.payload;
      const slice = state.siteRecord[site];
      return {
        ...state,
        siteRecord: Object.assign({}, state.siteRecord, {
          [site]: {
            ...slice,
            articleUnsavedState: article
          }
        })
      };
    }
    case "REPLACE_STATE": {
      const { site } = action.payload;
      const slice = state[site];
      return {
        ...state,
        siteRecord: Object.assign({}, state.sitRecord, {
          [site]: {
            ...slice,
            articleUnsavedState: null,
            article: slice.articleUnsavedState,
            articleHistory: slice.articleHistory.concat(slice.article)
          }
        })
      };
    }
    case "ADD_SITES": {
      const stubSiteState = action.payload.reduce(
        (stubSiteRecord, { site }) =>
          Object.assign(stubSiteRecord, {
            [site]: {
              articleUnsavedState: null,
              article: null,
              articles: [],
              articleHistory: []
            }
          }),
        {}
      );
      return Object.assign({}, state, {
        siteRecord: stubSiteState,
        currentSite: sample(Object.keys(stubSiteState))
      });
    }
  }
  return state;
};

function App() {
  const [{ currentSite, siteRecord, currentPage }, dispatch] = useReducer(
    reducer,
    {
      currentSite: "",
      currentPage: 0,
      siteRecord: {}
    }
  );

  useEffect(() => {
    fetch(`http://192.168.1.7:3001/api/news-source`)
      .then(res => res.json())
      .then(sites => dispatch({ type: "ADD_SITES", payload: sites }));
  }, []);

  useEffect(() => {
    if (
      currentSite &&
      ((!siteRecord[currentSite].hasNoArticles &&
        !siteRecord[currentSite].articles.length) ||
        currentPage > siteRecord[currentSite].articles.length - 2)
    )
      fetch(`http://192.168.1.7:3001/api/news-source/${currentSite}/random/5`)
        .then(res => res.json())
        .then(articles =>
          dispatch({
            type: "GET_RANDOM_FOR_SITE",
            payload: { site: currentSite, articles }
          })
        );
  }, [currentSite, currentPage, siteRecord[currentSite]]);

  const updateHrefDraft = (site, article) => {
    console.log("UPDATE HREF", {
      type: "UPDATE_STATE_DRAFT",
      payload: { site, article }
    });
    dispatch({ type: "UPDATE_STATE_DRAFT", payload: { site, article } });
  };

  const [ws, wsDispatch] = useWsConnectionRefState({
    onMessage: payload => {
      const message = JSON.parse(payload.data).message;
      switch (message.type) {
        case "CLIENT#COLLECT#SUCCESS":
          updateHrefDraft(message.site, message.article);
          break;
      }
    },
    onError: e => console.log("ERROR", e)
  });

  const siteState = siteRecord[currentSite] || {};
  const { articles = [] } = siteState;

  const article = articles[currentPage];

  console.log({ articles, article, currentPage });

  return (
    <div className="App">
      <ul>
        {Object.keys(siteRecord).map(site => (
          <li>
            <button
              onClick={() =>
                dispatch({ type: "NAVIGATION#SITE", payload: site })
              }
              children={site}
            />
          </li>
        ))}
      </ul>
      currently {currentSite}
      <section>
        {!article ? null : (
          <>
            <h2>
              {article.title}{" "}
              <button
                onClick={() =>
                  wsDispatch({ type: "SEND#UPDATE#HREF", href: article.href })
                }
              >
                Refresh
              </button>
            </h2>
            <aside>{article.href}</aside>
            {article.subheading && <h3 />}
            {article.content.split("\n").map(p => (
              <p>{p}</p>
            ))}
          </>
        )}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            onClick={() =>
              dispatch({ type: "PREVIOUS_PAGE", payload: { currentSite } })
            }
          >
            Previous
          </button>
          <button
            onClick={() =>
              dispatch({ type: "NEXT_PAGE", payload: { currentSite } })
            }
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}

export default App;
