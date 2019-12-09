const ws = require('ws')
const {
  createStore,
  createSlice,
  combineReducers,
} = require('@reduxjs/toolkit')
const uuid = require('uuid/v4')

const savedDashboards = createSlice({
  name: 'saved-dashboards',
  initialState: {
    dashboards: {},
  },
  reducers: {
    upsertDashboard(
      state,
      {
        payload: { dashboard },
      }
    ) {
      if (!Array.isArray(dashboard)) dashboard = [dashboard]
      console.log(dashboard)
      dashboard.forEach(d => {
        state.dashboards[dashboard.id] = d
      })
    },
  },
})

const onlineDashboard = createStore(
  combineReducers({
    savedDashboards: savedDashboards.reducer,
  })
)

const createDashboardWsServer = wsServerOptions => {
  const wsServer = new ws.Server(wsServerOptions)
  const { getState, dispatch } = onlineDashboard
  wsServer.on('connection', socket => {
    const {
      savedDashboards: { dashboards },
    } = getState()
    socket.send(JSON.stringify({ type: 'INIT', payload: dashboards }))
    socket.on('message', payload => {
      const action = JSON.parse(payload).message
      if (action.type === 'UPDATE') {
        store.dispatch(savedDashboards.actions.upsertDashboard(action))
      }
      console.log({ payload })
    })
  })
  console.log(getState())
  return wsServer
}

module.exports = {
  createDashboardWsServer,
}
