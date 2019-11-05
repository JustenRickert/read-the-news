const assert = require('assert')
const { pick } = require('../utils')

const makeNewsSourceReducer = newsSource => (state = {}, action) => {
  if (action.newsSource !== newsSource) return state
  let newState = null
  switch (action.type) {
    case 'UPDATE_CONTENT': {
      assert(
        typeof action.href !== 'undefined',
        'UPDATE_CONTENT action requires an href!'
      )
      newState = Object.assign({}, state)
      if (action.content) {
        console.log('update content!', action.title)
        Object.assign(newState, {
          [action.href]: Object.assign(
            {},
            state[action.href],
            pick(action, [
              'authors',
              'content',
              'hasVideo',
              'images',
              'timestamp',
              'twitterContent',
            ]),
            {
              // Some sites (CNN) have titles that differ between the article
              // and the homepage
              title: action.title || state[action.href].title,
            }
          ),
        })
      }
      if (action.isVideoContent) {
        console.log('update video content!', action.title)
        Object.assign(newState, {
          [action.href]: Object.assign({}, state[action.href], {
            visited: true,
            isVideoContent: true,
          }),
        })
      }
      break
    }
    case 'ADD_ARTICLES':
      newState = Object.assign({}, state)
      Object.assign(
        newState,
        action.articles.reduce((newArticles, { href, title }) => {
          if (!state[href]) {
            console.log('new article!', title)
            Object.assign(newArticles, { [href]: { title, href } })
          }
          return newArticles
        }, {})
      )
      break
  }
  return newState || state
}

module.exports = {
  makeNewsSourceReducer,
}
