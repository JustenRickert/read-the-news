const { FOX_NEWS, NPR, CNN, dataStoreFilename } = require("./constant");

const storeData = require(dataStoreFilename);

const newsSource = process.argv[2];

if (![CNN, FOX_NEWS, NPR].some(key => newsSource === key)) {
  console.error(`News source ${newsSource} not found in data`);
  console.error("Possible values:\n ", Object.keys(storeData).join("\n  "));
  console.log();
  throw new Error();
}

switch (newsSource) {
  case CNN:
    require("./cnn/cnn");
    break;
  case FOX_NEWS:
    require("./fox-news/fox-news");
    break;
  case NPR:
    require("./npr/npr");
    break;
}
