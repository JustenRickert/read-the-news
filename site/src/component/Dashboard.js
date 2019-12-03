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

const Dashboard = ({ articleRecord, fetchHrefData }) => {
  const [state, dispatch] = useReducer(stateModule.reducer, {
    articlesLoading: []
  });
  const [text, setText] = useState("");

  const handleFetchHrefData = text => {
    setText("");
    return fetchHrefData(text).then(message => {
      if (message.error) {
        dispatch(stateModule.actions.markLoadingArticle(text));
        return;
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
      <textarea
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
              {article.href}
              {article.error ? ` (${article.message})` : ""}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default Dashboard;
