import React, { useReducer, useEffect, useRef } from "react";
import { createSlice, combineReducers } from "@reduxjs/toolkit";

export default function Section({ sites, onChangeSection }) {
  return (
    <ul>
      {Object.keys(sites).map(site => (
        <li>
          <button onClick={() => onChangeSection(site)} children={site} />
        </li>
      ))}
    </ul>
  );
}
