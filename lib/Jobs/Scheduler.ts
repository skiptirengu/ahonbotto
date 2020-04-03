import { autoInjectable, inject, injectAll, singleton } from 'tsyringe'
import { Logger } from 'winston'

import { Job } from './Job'

@singleton()
@autoInjectable()
export class Scheduler {
  public constructor(
    /**
     * All registed jobs
     */
    @injectAll('Job') private readonly jobs?: Job[],
    /**
     * Logger
     */
    @inject('Logger') protected readonly logger?: Logger
  ) {
    this.jobs!.forEach((job) => this.schedule(job))
  }

  private schedule(job: Job): void {
    setInterval(() => this.execute(job), job.interval * 60000)
  }

  private execute(job: Job): void {
    job
      .execute()
      .then(() => {
        this.logger!.info('Job executed successfully', {
          name: job.constructor.name,
        })
      })
      .catch((error) => {
        this.logger!.error('Error executing job', {
          name: job.constructor.name,
          err: error,
        })
      })
  }

  public static start(): void {
    new Scheduler()
  }
}
