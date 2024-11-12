import type { Flight } from '../../base/flight/flight';
import type { IgnoreEnum } from '@ama-sdk/core';

export type FlightCoreIfy<T extends IgnoreEnum<Flight>> = T & {
  id: string;
};
