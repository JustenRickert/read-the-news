import React, { useReducer } from "react";
import { useDispatch, Provider } from "react-redux";
import { createSlice, combineReducers } from "@reduxjs/toolkit";

export default function Pagination({ articles, onChangePage }) {
  const handleNext = () =>
    onChangePage({
      type: "NEXT",
      length: articles.length
    });

  const handlePrevious = () =>
    onChangePage({
      type: "PREVIOUS",
      length: articles.length
    });

  const handleFirst = () =>
    onChangePage({
      type: "FIRST",
      length: articles.length
    });

  const handleLast = () =>
    onChangePage({
      type: "LAST",
      length: articles.length
    });

  return (
    <>
      <button onClick={handleFirst} children="first" />
      <button onClick={handlePrevious} children="previous" />
      <button onClick={handleNext} children="next" />
      <button onClick={handleLast} children="last" />
    </>
  );
}
