import type { Flight } from '../../base/flight/flight';
import type { reviveFlight } from '../../base/flight/flight.reviver';
import type { FlightCoreIfy } from './flight';

/**
 * Generate reviver for Flight core model
 *
 * @param baseRevive
 */
export function reviveFlightFactory<R extends typeof reviveFlight>(baseRevive: R) {
  const reviver = <T extends Flight = Flight>(data: any, dictionaries?: any) => {
    const revivedData = baseRevive<FlightCoreIfy<T>>(data, dictionaries);
    /* Set the value of your new fields here */
    revivedData.id = 'sampleIdValue';
    return revivedData;
  };

  return reviver;
}
