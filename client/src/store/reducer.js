const assert = require('assert')
const { createSlice } = require('@reduxjs/toolkit')
const { pick, unique } = require('../utils')

const { assertValidArticle } = require('../../../shared/data-assertions')

const initialState = {}

const addHeadline = (state, action) => {
  let { payload } = action
  if (!Array.isArray(payload)) payload = [payload]
  // Maybe dont need to use `unique` here?
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
      console.log('ERROR: SENT TO SERVER ERROR UPDATE:', update)
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
    const slice = state[update.href]
    try {
      assert(slice, '`slice[href]` not found in data')
      assert(update.href, 'Need `href` to mark sent')
    } catch (e) {
      console.log('ERROR: SENT TO SERVER UPDATE:', update)
      return
    }
    slice.sentToServer = true
    // because it takes up a lot of space
    delete slice.content
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
      assert(slice, '\nState not found. Payload not a valid href maybe?')
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
  })
}

const clearErrors = state =>
  Object.values(state).forEach(slice => {
    delete slice.error
    delete slice.sentToServer
    delete slice.sendToServerError
  })

const createNewsSourceSlice = newsSource => {
  const slice = createSlice({
    name: newsSource,
    initialState,
    reducers: {
      addHeadline,
      updateArticle,
      markArticleSentToServer,
      markArticleErrorWhenSentToServer,
      clearErrors,
    },
  })

  slice.select = {}

  slice.select.articles = state => state[newsSource]

  slice.select.articlesWithoutContent = state =>
    Object.values(state[newsSource]).filter(
      article => !article.content && !article.error && !article.sentToServer
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
