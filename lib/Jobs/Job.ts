export interface Job {
  interval: number;
  /**
   * Runs the job
   */
  execute(): Promise<void>;
}
