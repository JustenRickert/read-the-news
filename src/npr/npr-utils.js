const isNprSectionsHref = ({ href }) =>
  /^https?:\/\/www\.npr\.org\/sections\/[\w\-]+\/$/.test(href);

const isNprMusicVideosHref = ({ href }) =>
  /^https?:\/\/www\.npr\.org\/music-videos\/$/.test(href);

const isNprPodcastsHref = ({ href }) =>
  /^https?:\/\/www\.npr\.org\/podcasts\//.test(href);

const isNprSeriesHref = ({ href }) =>
  /^https?:\/\/www\.npr\.org\/series\//.test(href);

const isNprHref = ({ href }) => /^https?:\/\/www\.npr\.org/.test(href);

module.exports = {
  isNprSectionsHref,
  isNprSeriesHref,
  isNprPodcastsHref,
  isNprMusicVideosHref,
  isNprHref
};
