const assert = require('assert')
const { createSlice } = require('redux-starter-kit')
const { pick, unique } = require('../utils')

const { assertValidArticle } = require('../../../shared/data-assertions')

const initialState = {}

const addHeadline = (state, action) => {
  let { payload } = action
  if (!Array.isArray(payload)) payload = [payload]
  const uniqueActions = unique(payload, ({ href }) => href)
  return Object.assign(
    {},
    state,
    uniqueActions.reduce((updates, u) => {
      assert(u.href, 'Update must contain `href`')
      // TODO consider getting rid of early return
      if (state[u.href]) return updates
      assert(!state[u.href], 'Article cannot be overwritten by a new headline')
      Object.assign(updates, { [u.href]: pick(u, ['href', 'title']) })
      console.log('Added article', u.href, u.title || '[Title required]')
      return updates
    }, {})
  )
}

const markArticleErrorWhenSentToServer = (state, action) => {
  let { payload } = action
  if (!Array.isArray(payload)) payload = [payload]
  payload.forEach(update => {
    try {
      assert(update.href, 'Need `href` to mark error when sending')
    } catch (e) {
      console.log('UPDATE', update)
      throw e
    }
    const slice = state[update.href]
    slice.sendToServerError = true
  })
}

const markArticleSentToServer = (state, action) => {
  let { payload } = action
  if (!Array.isArray(payload)) payload = [payload]
  payload.forEach(update => {
    try {
      assert(update.href, 'Need `href` to mark sent')
    } catch (e) {
      console.log('UPDATE', update)
      throw e
    }
    const slice = state[update.href]
    slice.sentToServer = true
  })
}

const updateArticle = (state, action) => {
  let { payload } = action
  if (!Array.isArray(payload)) payload = [payload]
  payload.forEach(update => {
    const slice = state[update.href]
    if (update.error) {
      if (update.error.message) console.error(update.error.message)
      slice.error = true
      return
    }
    try {
      assertValidArticle(update, slice)
    } catch (e) {
      console.error(e)
      console.log(update)
      return
    }
    slice.content = update.content
    slice.publicationDate = update.publicationDate
    slice.authors = update.authors
    if (update.title) slice.title = update.title
    console.log('Updated article', update.title || slice.title || update.href)
  })
}

const createNewsSourceSlice = newsSource => {
  const slice = createSlice({
    name: newsSource,
    initialState,
    reducers: {
      addHeadline,
      updateArticle,
      markArticleSentToServer,
      markArticleErrorWhenSentToServer,
    },
  })

  slice.select = {}

  slice.select.articlesWithoutContent = state =>
    Object.values(state[newsSource]).filter(
      article => !article.content && !article.error
    )

  slice.select.articlesWithErrors = state =>
    Object.values(state[newsSource]).filter(article => article.error)

  slice.select.articlesOkayForServer = state =>
    Object.values(state[newsSource]).filter(
      article =>
        article.content && !article.sentToServer && !article.sendToServerError
    )

  return slice
}

module.exports = {
  createNewsSourceSlice,
}
