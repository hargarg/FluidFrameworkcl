/**
 * This to schedule the frequency of hitting the API while pulling from third Party to Fluid
 *
 */
export class BridgeScheduler {
  private countNilChanges: number = 0;

  /**
   *
   * @param defaultTimeinMs  -refers to defaltTimefrequency of Hitting the ThirdParty APIs
   * @param maxAllowedTimeinMs - this refers to maximum timedelay allowed between hitting API calls
   */
  constructor(private defaultTimeinMs: number, private maxAllowedTimeinMs: number = 100000) {}

  /**
   *
   * @param len_changes this is to identify if there are any changes between new and old data
   */
  public getTimer(len_changes: Number): number {
    if (len_changes > 0) {
      this.countNilChanges = 0;
      return this.defaultTimeinMs;
    }
    this.countNilChanges = this.countNilChanges + 1;

    if (this.countNilChanges > 3) {
      let timer = (5 * (this.countNilChanges / 3) + (this.defaultTimeinMs / 1000) * (this.countNilChanges % 3)) * 1000;
      if (timer > this.maxAllowedTimeinMs) {
        this.countNilChanges = this.countNilChanges / 3;
        return Math.round(timer / 2) as number;
      }
      return Math.round(timer) as number;
    }
    return this.defaultTimeinMs;
  }
}
