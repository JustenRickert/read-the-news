const path = require('path')
const fs = require('fs')
const throttle = require('lodash.throttle')
const { combineReducers } = require('@reduxjs/toolkit')

const {
  dataStoreFilename,

  BREITBART,
  CNN,
  DEMOCRACY_NOW,
  FOX,
  NBC,
  NPR,
  THE_INTERCEPT,
  THE_NATION,
  VICE,
  VOX,
} = require('../constant')

const { createNewsSourceSlice } = require('./reducer')

const defer = (fn, ...args) => setTimeout(fn, 1, ...args)

const ensureDir = filepath => {
  if (!fs.existsSync(path.dirname(filepath))) {
    ensureDir(path.dirname(filepath))
    fs.mkdirSync(path.dirname(filepath))
  }
}

const saveStore = store => {
  ensureDir(dataStoreFilename)
  console.log('Saving store data')
  fs.writeFileSync(
    dataStoreFilename,
    JSON.stringify(store.getState(), null, 2),
    'utf-8'
  )
}

// const logAction = () => next => action => {
//   console.log(action);
//   return next(action);
// };

// const throttledWriteSync = throttle(
//   (...args) => (
//     console.log("saving store data"), defer(fs.writeFileSync, ...args)
//   ),
//   30000
// );

// const saveContentMiddleware = ({ dispatch, getState }) => next => action => {
//   const result = next(action);
//   throttledWriteSync(
//     dataStoreFilename,
//     JSON.stringify(getState(), null, 2),
//     "utf-8"
//   );
//   return result;
// };

const loadFileState = () => {
  if (!fs.existsSync(dataStoreFilename)) return undefined
  const result = fs.readFileSync(dataStoreFilename, 'utf-8')
  return JSON.parse(result)
}

const breitbart = createNewsSourceSlice(BREITBART)
const cnn = createNewsSourceSlice(CNN)
const democracyNow = createNewsSourceSlice(DEMOCRACY_NOW)
const fox = createNewsSourceSlice(FOX)
const nbc = createNewsSourceSlice(NBC)
const npr = createNewsSourceSlice(NPR)
const theIntercept = createNewsSourceSlice(THE_INTERCEPT)
const theNation = createNewsSourceSlice(THE_NATION)
const vice = createNewsSourceSlice(VICE)
const vox = createNewsSourceSlice(VOX)

const slices = [
  breitbart,
  cnn,
  democracyNow,
  fox,
  nbc,
  npr,
  theIntercept,
  theNation,
  vice,
  vox,
]

const newsSourceSliceMap = slices.reduce(
  (sliceMap, slice) => Object.assign(sliceMap, { [slice.name]: slice }),
  {}
)

const reducer = combineReducers(
  slices.reduce(
    (reducerMap, slice) =>
      Object.assign(reducerMap, { [slice.name]: slice.reducer }),
    {}
  )
)

module.exports = {
  newsSourceSliceMap,
  reducer,
  saveStore,
  loadFileState,

  breitbart,
  cnn,
  democracyNow,
  fox,
  nbc,
  npr,
  theIntercept,
  theNation,
  vice,
  vox,
}
