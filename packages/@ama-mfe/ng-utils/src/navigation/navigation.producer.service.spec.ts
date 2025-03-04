import {
  NavigationMessage,
  NavigationV1_0,
} from '@ama-mfe/messages';
import {
  MessagePeerService,
} from '@amadeus-it-group/microfrontends-angular';
import {
  Injector,
  runInInjectionContext,
} from '@angular/core';
import {
  TestBed,
} from '@angular/core/testing';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
} from '@angular/router';
import {
  Subject,
} from 'rxjs';
import {
  ProducerManagerService,
} from '../managers/index';
import type {
  ErrorContent,
} from '../messages/error';
import {
  RoutingService,
} from './navigation.producer.service';

describe('Navigation Producer Service', () => {
  let navProducerService: RoutingService;
  let producerManagerService: ProducerManagerService;
  let messageService: MessagePeerService<NavigationMessage>;

  let routerEventsSubject: Subject<any>;
  let router: Router;

  beforeEach(() => {
    routerEventsSubject = new Subject<any>();
    const producerManagerServiceMock = {
      register: jest.fn(),
      unregister: jest.fn()
    };
    const messageServiceMock = {
      send: jest.fn()
    };
    TestBed.configureTestingModule({
      providers: [
        RoutingService,
        { provide: Router, useValue: { events: routerEventsSubject.asObservable(), getCurrentNavigation: jest.fn(() => {}) } },
        { provide: ProducerManagerService, useValue: producerManagerServiceMock },
        { provide: MessagePeerService, useValue: messageServiceMock },
        { provide: ActivatedRoute, useValue: { routeConfig: { path: 'test-path' } } }
      ]
    });

    navProducerService = TestBed.inject(RoutingService);
    messageService = TestBed.inject(MessagePeerService<NavigationMessage>);
    producerManagerService = TestBed.inject(ProducerManagerService);
    router = TestBed.inject(Router);
  });

  it('should register itself when instantiated', () => {
    jest.spyOn(producerManagerService, 'register');
    expect(producerManagerService.register).toHaveBeenCalledWith(navProducerService);
  });

  it('should send navigation message via messageService if document.referrer is present', () => {
    Object.defineProperty(document, 'referrer', { value: 'some-referrer', configurable: true });
    runInInjectionContext(TestBed.inject(Injector), () => {
      navProducerService.handleEmbeddedRouting();
    });

    routerEventsSubject.next(new NavigationEnd(1, 'start-url', 'end-url'));

    expect(messageService.send).toHaveBeenCalledWith({
      type: 'navigation',
      version: '1.0',
      url: 'end-url'
    });
  });

  it('should send navigation message via endpointManagerService if channelId is present and document.referrer is not present', () => {
    Object.defineProperty(document, 'referrer', { value: '', configurable: true });
    jest.spyOn(router, 'getCurrentNavigation').mockReturnValue({ extras: { state: { channelId: 'test-channel-id' } } } as any);

    runInInjectionContext(TestBed.inject(Injector), () => {
      navProducerService.handleEmbeddedRouting();
    });

    routerEventsSubject.next(new NavigationEnd(1, 'start-url', 'end-url'));

    expect(messageService.send).toHaveBeenCalledWith({
      type: 'navigation',
      version: '1.0',
      url: 'end-url'
    }, { to: ['test-channel-id'] });
  });

  it('should log an error if endpointManagerService.send throws an error', () => {
    Object.defineProperty(document, 'referrer', { value: '', configurable: true });
    jest.spyOn(router, 'getCurrentNavigation').mockReturnValue({ extras: { state: { channelId: 'test-channel-id' } } } as any);
    jest.spyOn(messageService, 'send').mockImplementation(() => {
      throw new Error('send error');
    });
    // eslint-disable-next-line no-console -- spy on console error
    console.error = jest.fn();
    runInInjectionContext(TestBed.inject(Injector), () => {
      navProducerService.handleEmbeddedRouting();
    });

    routerEventsSubject.next(new NavigationEnd(1, 'start-url', 'end-url'));

    // eslint-disable-next-line no-console -- check console error calls
    expect(console.error).toHaveBeenCalledWith('Error sending navigation message', expect.objectContaining({ message: 'send error' }));
  });

  it('should warn if no channelId is provided and document.referrer is not present', () => {
    Object.defineProperty(document, 'referrer', { value: '', configurable: true });
    // eslint-disable-next-line no-console -- spy on console warn
    console.warn = jest.fn();
    runInInjectionContext(TestBed.inject(Injector), () => {
      navProducerService.handleEmbeddedRouting();
    });

    routerEventsSubject.next(new NavigationEnd(1, 'start-url', 'end-url'));

    // eslint-disable-next-line no-console -- check console warn calls
    expect(console.warn).toHaveBeenCalledWith('No channelId provided for navigation message');
  });

  it('should handle errors', () => {
    // eslint-disable-next-line no-console -- spy on console error
    console.error = jest.fn();
    const errorMessage: ErrorContent<NavigationV1_0> = { reason: 'unknown_type', source: { type: 'navigation', version: '1.0', url: '' } };

    navProducerService.handleError(errorMessage);

    // eslint-disable-next-line no-console -- check console error calls
    expect(console.error).toHaveBeenCalledWith('Error in navigation service message', errorMessage);
  });
});
