import path from "node:path"
import express from "express"
import morgan from "morgan"

const app = express()

// Enable http requests logging.
// See: https://github.com/expressjs/morgan
app.use(morgan("short"))

// Serve files on app/public as static files.
// See: https://expressjs.com/en/starter/static-files.html
app.use(express.static(path.join(import.meta.dirname, "public")))

// Health check endpoint.
app.get("/health", (req, res) => res.sendStatus(200))

export default app
