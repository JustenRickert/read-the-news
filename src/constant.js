const path = require("path");

const cwd = process.cwd();
const dataStoreFilename = path.join(cwd, "data", "store.json");

const CNN = "cnn";
const FOX_NEWS = "fox-news";
const NPR = "npr";

module.exports = {
  dataStoreFilename,
  CNN,
  FOX_NEWS,
  NPR
};
