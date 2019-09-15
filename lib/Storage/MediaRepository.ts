import { singleton, inject } from 'tsyringex'
import { Connection } from './Connection'
import { Statement } from 'better-sqlite3'
import dayjs from 'dayjs'

@singleton()
export class MediaRepository {
  /**
   * Statement to mark a file for deletion
   */
  private readonly stmtDeletion: Statement<any[]>
  /**
   * Statement to insert a new media
   */
  private readonly stmtUpsert: Statement<any[]>
  /**
   * Search by key
   */
  private readonly stmtSelect: Statement<any[]>
  /**
   * Set flag completed on database
   */
  private readonly stmtComplete: Statement<any[]>
  /**
   * Select by time
   */
  private readonly stmtSelectTime: Statement<any[]>
  /**
   * Delete by key
   */
  private readonly stmtDelete: Statement<any[]>

  public constructor(
    /**
     * SQLite connection
     */
    @inject(Connection) protected readonly connection: Connection
  ) {
    this.stmtComplete = this.connection.database.prepare(
      'UPDATE media SET completed = @completed WHERE filename = @file'
    )
    this.stmtDeletion = this.connection.database.prepare(
      'UPDATE media SET time_marked_deletion = @time WHERE filename = @file AND completed IS TRUE'
    )
    this.stmtUpsert = this.connection.database.prepare(
      'INSERT OR REPLACE INTO media (filename, completed) VALUES (@file, FALSE)'
    )
    this.stmtSelect = this.connection.database.prepare(
      'SELECT * FROM media WHERE filename = @filename AND completed IS TRUE'
    )
    this.stmtSelectTime = this.connection.database.prepare(
      'SELECT filename FROM media WHERE time_marked_deletion IS NOT NULL AND time_marked_deletion <= @time'
    )
    this.stmtDelete = this.connection.database.prepare(
      'DELETE FROM media WHERE filename = @filename'
    )
  }

  public marked(time: number): string[] {
    const data = this.stmtSelectTime.all({ time })
    return data.map((x) => x.filename)
  }

  public complete(file: string): void {
    this.stmtComplete.run({ file, completed: 1 })
  }

  public markForDeletion(file: string): void {
    const time = dayjs().unix()
    this.setDeletion(file, time)
  }

  public upsert(file: string): void {
    this.stmtUpsert.run({ file })
  }

  public checkAndEnable(file: string): boolean {
    const model = this.stmtSelect.get({ filename: file })
    if (model) this.setDeletion(file, null)
    return !!model
  }

  private setDeletion(file: string, time?: number | null): void {
    this.stmtDeletion.run({ time, file })
  }

  public remove(filename: string): void {
    this.stmtDelete.run({ filename })
  }
}
