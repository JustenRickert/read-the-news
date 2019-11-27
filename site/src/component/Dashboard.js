import React, { useReducer } from "react";
import { createSlice, combineReducers } from "@reduxjs/toolkit";

const hrefs = createSlice({
  name: "hrefs",
  initialState: { hrefs: [] },
  reducers: {
    addHref: (state, action) => {
      const { payload } = action;
      state.hrefs.push(payload);
    }
  }
});

const Dashboard = ({ hrefRecord, onFetchHrefData }) => {
  const [state, dispatch] = useReducer(hrefs.reducer, { hrefs: [] });
  console.log({ hrefRecord });
  return (
    <div>
      <textarea onChange={console.log} />
      <ul>
        {state.hrefs.map(href => (
          <li>{href}</li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
