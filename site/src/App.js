import React, { useReducer, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";

const sample = xs => xs[Math.floor(Math.random() * xs.length)];

const unique = (xs, idFn) =>
  xs.reduce(
    (uniqueXs, x) =>
      uniqueXs.some(ux => idFn(ux) === idFn(x)) ? uniqueXs : uniqueXs.concat(x),
    []
  );

const reducer = (state, action) => {
  switch (action.type) {
    case "NAVIGATION#SITE":
      return {
        ...state,
        currentSite: action.payload
      };
    case "GET_RANDOM_FOR_SITE":
      const siteState = state.siteStateRecord[action.payload.site];
      return {
        ...state,
        siteStateRecord: Object.assign({}, state.siteStateRecord, {
          [action.payload.site]: {
            ...siteState,
            articles: unique(
              siteState.articles.concat(action.payload.articles),
              ({ href }) => href
            )
          }
        })
      };
    case "ADD_SITES":
      const stubSiteState = action.payload.reduce(
        (stubSiteRecord, { site }) =>
          Object.assign(stubSiteRecord, { [site]: { articles: [] } }),
        {}
      );
      return Object.assign({}, state, {
        siteStateRecord: stubSiteState,
        currentSite: sample(Object.keys(stubSiteState))
      });
  }
  return state;
};

function App() {
  const [{ currentSite, siteStateRecord }, dispatch] = useReducer(reducer, {
    currentSite: "",
    siteStateRecord: {}
  });

  useEffect(() => {
    fetch(`http://192.168.1.7:3001/api/news-source`)
      .then(res => res.json())
      .then(sites => dispatch({ type: "ADD_SITES", payload: sites }));
  }, []);

  useEffect(() => {
    if (currentSite && !siteStateRecord[currentSite].articles.length) {
      fetch(`http://192.168.1.7:3001/api/news-source/${currentSite}/random/50`)
        .then(res => res.json())
        .then(articles =>
          dispatch({
            type: "GET_RANDOM_FOR_SITE",
            payload: { site: currentSite, articles }
          })
        );
    }
  }, [currentSite]);

  const siteState = siteStateRecord[currentSite];
  const articles = siteState && siteState.articles;

  return (
    <div className="App">
      <ul>
        {Object.keys(siteStateRecord).map(site => (
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
      {(articles || []).map(article => (
        <section>
          <h2>{article.title}</h2>
          <aside>{article.href}</aside>
          {article.subheading && <h3 />}
          {article.content.split("\n").map(p => (
            <p>{p}</p>
          ))}
        </section>
      ))}
    </div>
  );
}

export default App;
