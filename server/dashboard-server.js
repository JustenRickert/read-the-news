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
    upsertDashboard(state, { payload: dashboard }) {
      if (!Array.isArray(dashboard)) dashboard = [dashboard]
      dashboard.forEach(d => {
        Object.assign(state, { [d.id]: d })
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
  let sockets = []
  wsServer.on('connection', socket => {
    sockets.push(socket)

    const {
      savedDashboards: { dashboards },
    } = getState()
    socket.send(JSON.stringify({ type: 'INIT', payload: dashboards }))

    socket.on('close', () => {
      sockets = sockets.filter(s => s !== socket)
    })

    socket.on('message', payload => {
      const action = JSON.parse(payload).message
      if (action.type === 'UPDATE') {
        dispatch(savedDashboards.actions.upsertDashboard(action.dashboard))
        sockets
          .filter(s => s !== socket)
          .forEach(otherSocket => {
            otherSocket.send(JSON.stringify(action))
          })
      }
    })
  })
  return wsServer
}

module.exports = {
  createDashboardWsServer,
}
