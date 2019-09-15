import { config } from 'dotenv'
import { join } from 'path'
import appRoot from 'app-root-path'

config({
  path: join(appRoot.path, '.env')
})
