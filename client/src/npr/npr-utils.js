const isNprSectionsHref = ({ href }) =>
  /^https?:\/\/www\.npr\.org\/sections\/[\w\-]+\/$/.test(href)

const isNprMusicVideosHref = ({ href }) =>
  /^https?:\/\/www\.npr\.org\/sections\/music-videos\/$/.test(href)

const isNprMovieInterviewHref = ({ href }) =>
  /^https?:\/\/www\.npr\.org\/sections\/movie-interviews\/$/.test(href)

const isNprPodcastsHref = ({ href }) =>
  /^https?:\/\/www\.npr\.org\/podcasts\//.test(href)

const isNprPoliticsHref = ({ href }) =>
  /^https?:\/\/www\.npr\.org\/sections\/politics\/$/.test(href)

const isNprHealthShotsHref = ({ href }) =>
  /^https?:\/\/www\.npr\.org\/sections\/health-shots\/$/.test(href)

const isNprHealthIncHref = ({ href }) =>
  /^https?:\/\/www\.npr\.org\/sections\/health-shots\/\w+\/health-inc/.test(
    href
  )

const isNprSeriesHref = ({ href }) =>
  /^https?:\/\/www\.npr\.org\/series\//.test(href)

const isNprHref = ({ href }) => /^https?:\/\/www\.npr\.org/.test(href)

module.exports = {
  isNprHealthIncHref,
  isNprHealthShotsHref,
  isNprHref,
  isNprMovieInterviewHref,
  isNprMusicVideosHref,
  isNprPodcastsHref,
  isNprPoliticsHref,
  isNprSectionsHref,
  isNprSeriesHref,
}
