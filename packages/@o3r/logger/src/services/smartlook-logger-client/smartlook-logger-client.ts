import {
  Action,
  ActionReducer,
  MetaReducer,
} from '@ngrx/store';
import SmartLook from 'smartlook-client';
import type {
  LoggerClient,
} from '@o3r/logger';

/**
 * SmartLook client.
 */
export class SmartLookClient implements LoggerClient {
  /**
   * Constructor.
   * @param key SmartLook key
   */
  constructor(key: string) {
    SmartLook.init(key);
  }

  /**
   * @inheritdoc
   */
  public identify(uid: string, vars: { [key: string]: string } = {}): void {
    SmartLook.identify(uid, vars);
  }

  /**
   * @inheritdoc
   */
  public event(name: string, properties?: any): void {
    SmartLook.track(name, properties);
  }

  /**
   * @inheritdoc
   */
  public error(message?: any, ...optionalParams: any[]): void {
    // eslint-disable-next-line no-console -- done on purpose
    console.error(message, ...optionalParams);
  }

  /**
   * @inheritdoc
   */
  public warn(message?: any, ...optionalParams: any[]): void {
    // eslint-disable-next-line no-console -- done on purpose
    console.warn(message, ...optionalParams);
  }

  /**
   * @inheritdoc
   */
  public log(message?: any, ...optionalParams: any[]): void {
    // eslint-disable-next-line no-console -- done on purpose
    console.log(message, ...optionalParams);
  }

  /**
   * @inheritdoc
   */
  public getSessionURL(): undefined {
    this.error('Session URL not implemented in SmartLook client');

    return undefined;
  }

  /**
   * @inheritdoc
   */
  public stopRecording(): void {
    SmartLook.pause();
  }

  /**
   * @inheritdoc
   */
  public resumeRecording(): void {
    SmartLook.resume();
  }

  /**
   * @inheritdoc
   */
  public createMetaReducer(): MetaReducer<any, Action> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias, unicorn/no-this-assignment -- TODO check later if we can move to arrow function without regression
    const client: SmartLookClient = this;
    // eslint-disable-next-line prefer-arrow/prefer-arrow-functions -- TODO check later if we can move to arrow function without regression
    return function debug(reducer: ActionReducer<any>): ActionReducer<any> {
      return (state, action) => {
        // Filter @ngrx actions
        if (!action.type.startsWith('@ngrx/')) {
          client.log('State', state);
          client.log('Action', action);
        }

        return reducer(state, action);
      };
    };
  }
}
