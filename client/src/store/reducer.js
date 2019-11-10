const assert = require('assert')
const { createSlice } = require('redux-starter-kit')
const { pick, unique } = require('../utils')

const { assertValidArticle } = require('../../../shared/data-assersions')

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
      console.log('Added article', u.href, u.title || 'No title found')
      return updates
    }, {})
  )
}

const updateArticle = (state, action) => {
  let { payload } = action
  if (!Array.isArray(payload)) payload = [payload]
  payload.forEach(update => {
    const slice = state[update.href]
    // TODO more error logging?
    if (update.error) {
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

const createNewsSourceSlice = newsSource =>
  createSlice({
    name: newsSource,
    initialState,
    reducers: {
      addHeadline,
      updateArticle,
    },
  })

module.exports = {
  createNewsSourceSlice,
}
