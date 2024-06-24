import app from '../app/index.js'

const port = process.env.APP_PORT || 3000

const server = app.listen(port, () => {
  console.info(`HTTP server is listening on port ${port}...`)
})

process.on('SIGTERM', () => {
  console.info('SIGTERM signal received. Closing HTTP server...')
  
  server.close(() => {
    console.info('HTTP server closed.')
  })
})
