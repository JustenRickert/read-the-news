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
        state.dashboards[d.id] = {
          ...d,
          value: Object.keys(dashboards.values),
        }
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
  const sockets = []
  wsServer.on('connection', socket => {
    sockets.push(socket)
    const {
      savedDashboards: { dashboards },
    } = getState()
    console.log('CONNECTING')
    socket.send(JSON.stringify({ type: 'INIT', payload: dashboards }))
    socket.on('message', payload => {
      const action = JSON.parse(payload).message
      if (action.type === 'UPDATE') {
        dispatch(savedDashboards.actions.upsertDashboard(action.dashboard))
        sockets
          .filter(s => s !== socket)
          .forEach(otherSocket => {
            console.loG('SENDING TO OTHER SOCKETS')
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
