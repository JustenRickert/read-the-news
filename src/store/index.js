const path = require("path");
const fs = require("fs");
const throttle = require("lodash.throttle");
const { createStore, applyMiddleware, combineReducers } = require("redux");

const defer = (fn, ...args) => setTimeout(fn, 1, ...args);

const { dataStoreFilename, CNN, FOX_NEWS, NPR } = require("../constant");

const { makeNewsSourceReducer } = require("./newsSourceReducer");

const ensureDir = filepath => {
  if (!fs.existsSync(path.dirname(filepath))) {
    ensureDir(path.dirname(filepath));
    fs.mkdirSync(path.dirname(filepath));
  }
};

ensureDir(dataStoreFilename);

// const logAction = () => next => action => {
//   console.log(action);
//   return next(action);
// };

const throttledWriteSync = throttle(
  (...args) => (
    console.log("saving store data"), defer(fs.writeFileSync, ...args)
  ),
  30000
);

const saveStore = ({ getState }) => {
  console.log("Saving store data");
  fs.writeFileSync(
    dataStoreFilename,
    JSON.stringify(getState(), null, 2),
    "utf-8"
  );
};

const saveContentMiddleware = ({ dispatch, getState }) => next => action => {
  const result = next(action);
  if (action.meta.save)
    throttledWriteSync(
      dataStoreFilename,
      JSON.stringify(getState(), null, 2),
      "utf-8"
    );
  return result;
};

const initialState = () => {
  if (!fs.existsSync(dataStoreFilename)) return undefined;
  const result = fs.readFileSync(dataStoreFilename, "utf-8");
  return JSON.parse(result);
};

const reducer = combineReducers({
  [CNN]: makeNewsSourceReducer(CNN),
  [FOX_NEWS]: makeNewsSourceReducer(FOX_NEWS),
  [NPR]: makeNewsSourceReducer(NPR)
});

const store = createStore(
  reducer,
  initialState(),
  applyMiddleware(saveContentMiddleware)
);

module.exports = {
  store,
  saveStore
};
