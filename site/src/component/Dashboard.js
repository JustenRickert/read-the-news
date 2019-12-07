import React, { useReducer, useState, useEffect } from "react";
import { createSlice, combineReducers } from "@reduxjs/toolkit";
import { parseSite } from "shared/utils";

const noop = () => {};

const bucket = (o, idFn) =>
  Object.values(o).reduce((bucket, v) => {
    const id = idFn(v);
    if (bucket[id]) bucket[id].push(v);
    else bucket[id] = [v];
    return bucket;
  }, {});

const stateModule = createSlice({
  name: "dashboard#state",
  reducers: {
    unmarkLoadingSentiment: (state, { payload: payloadHrefs }) => {
      if (!Array.isArray(payloadHrefs)) payloadHrefs = [payloadHrefs];
      payloadHrefs.forEach(href => {
        delete state.sentimentsLoading[href];
      });
    },
    unmarkLoadingArticle: (state, { payload: payloadHrefs }) => {
      if (!Array.isArray(payloadHrefs)) payloadHrefs = [payloadHrefs];
      payloadHrefs.forEach(href => {
        delete state.articlesLoading[href];
      });
    },
    markLoadingArticle: (state, { payload: href }) => {
      state.articlesLoading[href] = true;
    },
    markLoadingSentiment: (state, { payload: href }) => {
      state.sentimentsLoading[href] = true;
    }
  }
});

const Dashboard = ({
  articleRecord,
  sentimentRecord = {},
  articleRecordRecentHistory,
  onFetchHrefContent
}) => {
  const [state, dispatch] = useReducer(stateModule.reducer, {
    articlesLoading: {},
    sentimentsLoading: {}
  });
  const [text, setText] = useState("");

  const handleFetchHrefData = text => {
    setText("");
    if (state.articlesLoading[text] || state.sentimentsLoading[text])
      return Promise.resolve({ error: true, message: "ALREADY_FETCHING" });
    return onFetchHrefContent(text).then(payload => {
      if (!payload) return { error: true, message: "NO_CONTENT" };
      if (payload.error) {
        switch (payload.message) {
          case "HREF_BAD":
            dispatch(stateModule.actions.unmarkLoadingArticle(text));
            break;
          case "ARTICLE_NOT_FOUND":
            dispatch(stateModule.actions.markLoadingArticle(text));
            break;
        }
        return payload;
      }
      if (!sentimentRecord[payload.href]) {
        dispatch(stateModule.actions.markLoadingSentiment(payload.href));
        return { error: true, message: "LOADING_SENTIMENT" };
      }
    });
  };

  useEffect(() => {
    Object.values(articleRecord).forEach(article => {
      if (
        !sentimentRecord[article.href] &&
        !state.sentimentsLoading[article.href]
      ) {
        handleFetchHrefData(article.href).then(({ error }) => {
          if (error) return;
          dispatch(stateModule.actions.unmarkLoadingSentiment(article.href));
        });
      }
    });
    dispatch(
      stateModule.actions.unmarkLoadingArticle(
        Object.values(articleRecord).map(({ href }) => href)
      )
    );
  }, [articleRecord]);

  const articleSiteBucket = bucket(articleRecord, article =>
    parseSite(article.href)
  );

  return (
    <div>
      <input
        value={text}
        onKeyDown={e => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleFetchHrefData(text);
          }
        }}
        onChange={e => setText(e.target.value)}
      />
      <section>
        Loading
        <ul>
          {Object.keys(state.articlesLoading).map(href => (
            <li>{href}</li>
          ))}
        </ul>
      </section>
      <section>
        Received
        <ul>
          {Object.entries(articleSiteBucket).map(([site, articles]) => {
            return (
              <li>
                <h3 children={site} />
                <ul>
                  {articles.map(article => (
                    <h4>
                      <a target="_false" href={article.href}>
                        {article.title}
                      </a>
                      <div>
                        <SentimentDashboard
                          href={article.href}
                          sentimentRecord={sentimentRecord}
                        />
                      </div>
                    </h4>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
};

const take = (n, xs) => xs.slice(0, n);
const takeRight = (n, xs) => xs.slice(xs.length - n);

const SentimentDashboard = ({ sentimentRecord, href }) => {
  const sentiment = sentimentRecord[href];
  if (!sentiment) return null;
  const positiveWords = take(5, sentiment.words);
  const negativeWords = takeRight(5, sentiment.words);
  return (
    <ul>
      <li>
        score: {sentiment.score} ({sentiment.comparative.toFixed(3)})
      </li>
      <li>length: {sentiment.length || "unknown"} words</li>
      <li>
        (+)words:{" "}
        {positiveWords
          .map(({ word, count, score }) => `${word} (${count * score})`)
          .join(", ")}
      </li>
      <li>
        (-)words:{" "}
        {negativeWords
          .map(({ word, count, score }) => `${word} (${count * score})`)
          .join(", ")}
      </li>
    </ul>
  );
};

export default Dashboard;
