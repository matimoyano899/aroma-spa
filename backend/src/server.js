import app from './index.js'
import { env } from './config/env.js'

app.listen(env.PORT, () => {
  console.log(`Aroma Spa API · http://localhost:${env.PORT}/api/health`)
})
