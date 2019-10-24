const { and, complement } = require("./utils");
const {
  isNprSectionHref,
  isNprSeriesHref,
  isNprPodcastsHref,
  isNprMusicVideosHref
} = require("./npr-utils");

describe("links needing to be filtered out of discovered homepage links", () => {
  const removedUrls = [
    "https://www.npr.org/sections/music-videos/",
    "https://www.npr.org/sections/national/",
    "https://www.npr.org/sections/economy/",
    "https://www.npr.org/sections/world-cafe/",
    "https://www.npr.org/podcasts/510351/short-wave"
  ];
  expect(removedUrls.filter(complement()).toEqual([])
});
