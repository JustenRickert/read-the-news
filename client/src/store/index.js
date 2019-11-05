const path = require('path')
const fs = require('fs')
const throttle = require('lodash.throttle')
const { createStore, applyMiddleware, combineReducers } = require('redux')

const defer = (fn, ...args) => setTimeout(fn, 1, ...args)

const { dataStoreFilename, CNN, FOX, NPR, NBC } = require('../constant')

const { createNewsSourceSlice } = require('./reducer')

const ensureDir = filepath => {
  if (!fs.existsSync(path.dirname(filepath))) {
    ensureDir(path.dirname(filepath))
    fs.mkdirSync(path.dirname(filepath))
  }
}

ensureDir(dataStoreFilename)

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

const initialState = () => {
  if (!fs.existsSync(dataStoreFilename)) return undefined
  const result = fs.readFileSync(dataStoreFilename, 'utf-8')
  return JSON.parse(result)
}

const cnn = createNewsSourceSlice(CNN)
const fox = createNewsSourceSlice(FOX)
const nbc = createNewsSourceSlice(NBC)
const npr = createNewsSourceSlice(NPR)

const reducer = combineReducers({
  [CNN]: cnn.reducer,
  [FOX]: fox.reducer,
  [NBC]: nbc.reducer,
  [NPR]: npr.reducer,
})

const store = createStore(
  reducer,
  initialState()
  // applyMiddleware(saveContentMiddleware, logAction)
)

const saveStore = () => {
  console.log('Saving store data')
  fs.writeFileSync(
    dataStoreFilename,
    JSON.stringify(store.getState(), null, 2),
    'utf-8'
  )
}

module.exports = {
  store,
  saveStore,
  cnn: cnn.actions,
  fox: fox.actions,
  nbc: nbc.actions,
  npr: npr.actions,
}
