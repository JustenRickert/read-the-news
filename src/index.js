const { FOX_NEWS, NPR, dataStoreFilename } = require("./constant");

const storeData = require(dataStoreFilename);

const newsSource = process.argv[2];

if (!Object.keys(storeData).some(key => newsSource === key)) {
  console.error(`News source ${newsSource} not found in data`);
  console.error("Possible values:\n ", Object.keys(storeData).join("\n  "));
  console.log();
  throw new Error();
}

switch (newsSource) {
  case FOX_NEWS:
    require("./fox-news");
    break;
  case NPR:
    require("./npr");
    break;
}
