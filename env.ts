import appRoot from 'app-root-path'
import { config } from 'dotenv'
import { join } from 'path'

config({
  path: join(appRoot.path, '.env')
})
