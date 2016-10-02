import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { TestMessage } from 'rxjs/testing/TestMessage';
import { VirtualTimeScheduler } from 'rxjs/scheduler/VirtualTimeScheduler';

import { VirtualObserver } from './VirtualObserver';
import { VirtualPromise } from './VirtualPromise';

export interface SchedulerOptions {
  created?: number;
  subscribed?: number;
  unsubscribed?: number;
}

export interface VirtualTestScheduler extends VirtualTimeScheduler {
  isFlushing: boolean;

  createObserver(): VirtualObserver;

  createHotObservable(...value: Array<TestMessage | Array<TestMessage>>): Observable<any>;
  createColdObservable(...value: Array<TestMessage | Array<TestMessage>>): Observable<any>;

  createResolvedPromise(frame: number, value: any): VirtualPromise;
  createRejectedPromise(frame: number, reason: any): VirtualPromise;

  advanceTo(toFrame: number): void;
  advanceBy(byFrame: number): void;

  scheduleAbsolute<T>(work: (state?: T) => void, dueFrame?: number, state?: T): Subscription;
  scheduleRelative<T>(work: (state?: T) => void, byFrame?: number, state?: T): Subscription;

  startScheduler<T>(observableFactory: () => Observable<T>, options?: SchedulerOptions): VirtualObserver;
  stop(): void;
}