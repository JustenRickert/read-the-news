const { FOX_NEWS, NPR, CNN, NBC, dataStoreFilename } = require("./constant");

const newsSource = process.argv[2];

const possibleArguments = [CNN, FOX_NEWS, NBC, NPR];

if (!possibleArguments.some(key => newsSource === key)) {
  console.error(`News source ${newsSource} not found in data`);
  console.error(
    "Possible values:\n ",
    Object.keys(possibleArguments).join("\n  ")
  );
  console.log();
  throw new Error();
}

switch (newsSource) {
  case NBC:
    require("./nbc/nbc");
    break;
  case CNN:
    require("./cnn/cnn");
    break;
  case FOX_NEWS:
    require("./fox-news/fox-news");
    break;
  case NPR:
    require("./npr/npr").run();
    break;
}
