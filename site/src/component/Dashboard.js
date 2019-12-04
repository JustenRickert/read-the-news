import React, { useReducer, useState, useEffect } from "react";
import { createSlice, combineReducers } from "@reduxjs/toolkit";

const stateModule = createSlice({
  name: "dashboard#state",
  reducers: {
    unmarkLoadingArticle: (state, { payload: payloadHrefs }) => {
      if (!Array.isArray(payloadHrefs)) payloadHrefs = [payloadHrefs];
      state.articlesLoading = state.articlesLoading.filter(
        loadingHref =>
          !payloadHrefs.some(payloadHref => loadingHref === payloadHref)
      );
    },
    markLoadingArticle: (state, { payload: href }) => {
      state.articlesLoading.push(href);
    }
  }
});

const Dashboard = ({
  articleRecord,
  articleRecordRecentHistory,
  fetchHrefContent
}) => {
  const [state, dispatch] = useReducer(stateModule.reducer, {
    articlesLoading: []
  });
  const [text, setText] = useState("");

  const handleFetchHrefData = text => {
    setText("");
    return fetchHrefContent(text).then(payload => {
      if (payload.error) {
        switch (payload.message) {
          case "HREF_BAD":
            dispatch(stateModule.actions.unmarkLoadingArticle(text));
            break;
          case "ARTICLE_NOT_FOUND":
            dispatch(stateModule.actions.markLoadingArticle(text));
            break;
        }
      }
    });
  };

  useEffect(() => {
    dispatch(
      stateModule.actions.unmarkLoadingArticle(
        Object.values(articleRecord).map(({ href }) => href)
      )
    );
  }, [articleRecord]);

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
          {state.articlesLoading.map(href => (
            <li>{href}</li>
          ))}
        </ul>
      </section>
      <section>
        Received
        <ul>
          {Object.values(articleRecord).map(article => (
            <li>
              {article.error ? (
                `ERROR: ${article.message}`
              ) : (
                <h3>
                  <a target="_false" href={article.href}>
                    {article.title}
                  </a>
                </h3>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default Dashboard;
