# read-the-news

## How to run me

First install me
```
git clone https://github.com/JustenRickert/read-the-news.git
cd read-the-news
npm i
```

Then run the script to collect and store articles from one of the supported news sources
```
npm run article-collection npr
# or
npm run article-collection fox-news
```

Wait for some time to collect results...

Then run the sentiment analysis tool on the collected data
```
npm run article-sentiment fox-news
# or
npm run article-sentiment npr
```
