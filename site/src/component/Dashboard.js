import React, { useReducer, useState, useEffect } from "react";
import { createSlice, combineReducers } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import { parseSite } from "read-the-news-shared/utils";
import { actions as storeActions } from "../store";
import { useDashboardWsRefState } from "./dashboard-connection";
import throttle from "lodash.throttle";

import { Radar } from "./Graph";
import { take, takeRight, noop, bucket } from "./utils";

const ViewDashboards = ({
  isPeeking,
  handleSaveDashboard,
  handleRemoveArticleFromDashboard,
  dashboardArticleBucket,
  sentimentRecord
}) => {
  return (
    <section>
      {isPeeking && "Peeking..."}{" "}
      {!isPeeking && (
        <button onClick={handleSaveDashboard}>Save dashboard</button>
      )}
      <ul>
        {Object.entries(dashboardArticleBucket).map(([site, articles]) => {
          return (
            <li>
              <h3 children={site} />
              <ul>
                {articles.map(article => (
                  <h4>
                    <a target="_false" href={article.href}>
                      {article.title}
                    </a>
                    {!isPeeking && (
                      <>
                        {" "}
                        <button
                          onClick={() =>
                            handleRemoveArticleFromDashboard(article)
                          }
                        >
                          Remove from dashboard
                        </button>
                      </>
                    )}
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
  );
};

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

const stateModule = createSlice({
  name: "dashboard#state",
  reducers: {
    peekDashboard(state, { payload: dashboard }) {
      state.peekingDashboard = dashboard;
    },
    unmarkLoadingSentiment: (state, { payload: payloadHrefs }) => {
      if (!Array.isArray(payloadHrefs)) payloadHrefs = [payloadHrefs];
      payloadHrefs.forEach(href => {
        state.sentimentsLoading[href] = false;
      });
    },
    unmarkLoadingArticle: (state, { payload: payloadHrefs }) => {
      if (!Array.isArray(payloadHrefs)) payloadHrefs = [payloadHrefs];
      payloadHrefs.forEach(href => {
        state.articlesLoading[href] = false;
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

const Dashboard = ({ onFetchHrefContent, onFetchSentiment }) => {
  const storeDispatch = useDispatch();
  const {
    currentDashboard: { value: currentDashboard },
    sentimentRecord,
    savedDashboards
  } = useSelector(state => state.dashboard);
  const [state, stateDispatch] = useReducer(stateModule.reducer, {
    articlesLoading: {},
    sentimentsLoading: {},
    peekingDashboard: null
  });
  const [text, setText] = useState("");

  const [ws, wsSend] = useDashboardWsRefState({
    onMessage: message => {
      console.log({ received: true, wsMessage: message });
    }
    // onOpen: message => () => {}
    // onClose,
    // onError,
  });

  const handlePushDashboardOnline = dashboard => {
    wsSend({
      type: "UPDATE",
      dashboard
    });
  };

  const handleSwitchDashboard = dashboard => {
    stateDispatch(stateModule.actions.peekDashboard(null));
    storeDispatch(storeActions.dashboard.returnToSavedDashboard(dashboard));
  };

  const handlePeekDashboard = dashboard => {
    stateDispatch(stateModule.actions.peekDashboard(dashboard));
  };

  const handleSaveDashboard = () => {
    storeDispatch(storeActions.dashboard.saveDashboard());
  };

  const handleRemoveArticleFromDashboard = article => {
    storeDispatch(storeActions.dashboard.removeArticles(article));
  };

  const handleFetchSentiment = href => {
    stateDispatch(stateModule.actions.markLoadingSentiment(href));
    const unmarkLoading = () => {
      stateDispatch(stateModule.actions.unmarkLoadingSentiment(href));
    };
    onFetchSentiment(href).then(unmarkLoading, unmarkLoading);
  };

  const handleFetchHrefData = text => {
    setText("");
    if (state.articlesLoading[text] || state.sentimentsLoading[text])
      return Promise.resolve({ error: true, message: "ALREADY_FETCHING" });
    return onFetchHrefContent(text).then(payload => {
      if (!payload) return { error: true, message: "NO_CONTENT" };
      if (payload.error) {
        switch (payload.message) {
          case "HREF_BAD":
            stateDispatch(stateModule.actions.unmarkLoadingArticle(text));
            break;
          case "ARTICLE_NOT_FOUND":
            stateDispatch(stateModule.actions.markLoadingArticle(text));
            break;
        }
        return payload;
      }
      if (!sentimentRecord[payload.href]) {
        return { error: true, message: "LOADING_SENTIMENT" };
      }
    });
  };

  useEffect(() => {
    Object.values(currentDashboard)
      .filter(
        article =>
          !sentimentRecord[article.href] &&
          !state.sentimentsLoading[article.href]
      )
      .forEach(({ href }) => handleFetchSentiment(href));
    stateDispatch(
      stateModule.actions.unmarkLoadingArticle(
        Object.values(currentDashboard).map(({ href }) => href)
      )
    );
  }, [
    currentDashboard,
    handleFetchSentiment,
    sentimentRecord,
    state.sentimentsLoading
  ]);

  const dashboardArticleBucket = bucket(
    state.peekingDashboard ? state.peekingDashboard.value : currentDashboard,
    article => parseSite(article.href)
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
          {Object.entries(state.articlesLoading)
            .filter(([, loading]) => loading)
            .map(([href]) => (
              <li>{href}</li>
            ))}
        </ul>
      </section>
      {!state.peekingDashboard ? (
        <ul>
          {savedDashboards.map((dashboard, i) => (
            <li onClick={() => handlePeekDashboard(dashboard)}>
              dashboard {i}{" "}
              <button
                onClick={() => handlePushDashboardOnline(dashboard)}
                children="Save online"
              />
            </li>
          ))}
        </ul>
      ) : (
        <div>
          <button
            onClick={() => handlePeekDashboard(null)}
            children="stop peeking"
          />
          <button
            onClick={() => handleSwitchDashboard(state.peekingDashboard)}
            children="switch to dashboard"
          />
        </div>
      )}
      <Radar
        dashboard={
          state.peekingDashboard
            ? state.peekingDashboard.value
            : currentDashboard
        }
        sentimentRecord={sentimentRecord}
      />
      <ViewDashboards
        isPeeking={Boolean(state.peekingDashboard)}
        handleSaveDashboard={handleSaveDashboard}
        handleRemoveArticleFromDashboard={handleRemoveArticleFromDashboard}
        dashboardArticleBucket={dashboardArticleBucket}
        sentimentRecord={sentimentRecord}
      />
    </div>
  );
};

export default Dashboard;
