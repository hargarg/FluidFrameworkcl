/**
 * returns a promise that resolves after timeMs
 * @param timeMs
 */
export function delay(timeMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(() => resolve(), timeMs));
}

/**
 * Returns a promise that resolves when any of the terminator promises resolve or the specified duration has elapsed, whichever happens first.
 * @param timeoutInMs The time to wait before resolving the returned promise if it hasn't already been resolved.
 * @param terminators An array of promises, the resolution of any of which within the timeout duration would cause the returned promise to be resolved.
 * @returns When the promise resolves, returns true if we timed out, false if any of the terminators resolved before timeout.
 */
export function timeoutWithTerminator<T>(timeoutInMs: number, terminators: Promise<T>[]): Promise<boolean> {
  const timeoutP = delay(timeoutInMs).then((_) => true);
  const terminatorsP = terminators.map((terminator) =>
    terminator
      .then((_) => false)
      .catch(
        (_) => false /*Intentionally ignoring errors as we expect terminator rejection to be handled individually*/
      )
  );
  return Promise.race([timeoutP, ...terminatorsP]);
}
