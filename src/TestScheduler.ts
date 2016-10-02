import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { VirtualTimeScheduler } from 'rxjs/scheduler/VirtualTimeScheduler';
import { AsyncAction } from 'rxjs/scheduler/AsyncAction';
import { HotObservable } from 'rxjs/testing/HotObservable';
import { ColdObservable } from 'rxjs/testing/ColdObservable';
import { TestMessage } from 'rxjs/testing/TestMessage';
import { isArray } from 'rxjs/util/isArray';
import { ArgumentOutOfRangeError } from 'rxjs/util/ArgumentOutOfRangeError';

import { VirtualTestScheduler, SchedulerStartOptions } from './VirtualTestScheduler';
import { next, error, complete } from './TestMessageValue';
import { VirtualObserver, BaseVirtualObserver } from './VirtualObserver';
import { VirtualPromise, BaseVirtualPromise } from './VirtualPromise';

export class TestScheduler extends VirtualTimeScheduler implements VirtualTestScheduler {
  private _flushing: boolean = false;
  public get isFlushing(): boolean {
    return this._flushing;
  }

  constructor() {
    super();
  }

  private peek(): (AsyncAction<any> | null) {
    const { actions } = this;
    return actions && actions.length > 0 ? actions[0] : null;
  }

  private setupOptions(options: SchedulerStartOptions): SchedulerStartOptions {
    const ret = options;
    if (!options.created) {
      ret.created = 100;
    }
    if (!options.subscribed) {
      ret.subscribed = 200;
    }
    if (!options.unsubscribed) {
      ret.unsubscribed = 1000;
    }

    return ret;
  }

  private flushUntil(toFrame: number = this.maxFrames): void {
    if (this.isFlushing) {
      return;
    }

    this._flushing = true;

    const { actions } = this;
    let error: any;
    let action: AsyncAction<any> | null | undefined = null;

    while (this.isFlushing && (action = this.peek()) && action.delay <= toFrame) {
      const action: AsyncAction<any> = actions.shift()!;
      this.frame = action.delay;

      if (error = action.execute(action.state, action.delay)) {
        break;
      }
    }

    this._flushing = false;

    if (error) {
      while (action = actions.shift()) {
        action.unsubscribe();
      }
      throw error;
    }
  }

  private pickValue(value: Array<TestMessage | Array<TestMessage>>): Array<TestMessage> {
    if (value.length === 1 && isArray(value[0])) {
      value = value[0] as Array<TestMessage>;
    }
    return value as Array<TestMessage>;
  }

  public createObserver(): VirtualObserver {
    return new BaseVirtualObserver(this);
  }

  public createHotObservable(...value: Array<TestMessage | Array<TestMessage>>): HotObservable<any> {
    const ret = new HotObservable<any>(this.pickValue(value), this);
    ret.setup();

    return ret;
  }

  public createColdObservable(...value: Array<TestMessage | Array<TestMessage>>): ColdObservable<any> {
    return new ColdObservable<any>(this.pickValue(value), this);
  }

  public createResolvedPromise(frame: number, value: any): VirtualPromise {
    return new BaseVirtualPromise(this, [ next(frame, value), complete(frame) ]);
  }

  public createRejectedPromise(frame: number, reason: any): VirtualPromise {
    return new BaseVirtualPromise(this, [ error(frame, reason) ]);
  }

  public advanceTo(toFrame: number): void {
    if (toFrame < 0 || toFrame < this.frame) {
      throw new ArgumentOutOfRangeError();
    }

    this.flushUntil(toFrame);

    this.frame = toFrame;
  }

  public advanceBy(byFrame: number): void {
    if (byFrame < 0) {
      throw new ArgumentOutOfRangeError();
    }

    if (byFrame === 0) {
      return;
    }

    const toFrame = this.frame + byFrame;
    this.advanceTo(toFrame);
  }

  public scheduleAbsolute<T>(work: (state?: T) => void, dueFrame: number = 0, state?: T): Subscription {
    if (dueFrame < 0 || this.frame > dueFrame) {
      throw new ArgumentOutOfRangeError();
    }

    return super.schedule(work, dueFrame - this.frame, state);
  }

  public scheduleRelative<T>(work: (state?: T) => void, byFrame: number = 0, state?: T): Subscription {
    return this.scheduleAbsolute(work, this.frame + byFrame, state);
  }

  public startScheduler<T>(observableFactory: () => Observable<T>,
                           options: SchedulerStartOptions = {}): VirtualObserver {
    const schedulerOptions = this.setupOptions(options);
    const { created, subscribed, unsubscribed } = schedulerOptions;
    const observer = this.createObserver();
    let sourceObservable: Observable<T>;
    let subscription: Subscription;

    this.scheduleAbsolute(() => {
      sourceObservable = observableFactory();
      return Subscription.EMPTY;
    }, created);

    this.scheduleAbsolute(() => {
      subscription = sourceObservable.subscribe(observer);
      return Subscription.EMPTY;
    }, subscribed);

    this.scheduleAbsolute(() => {
      subscription.unsubscribe();
      return Subscription.EMPTY;
    }, unsubscribed);

    this.flush();

    return observer;
  }

  public flush(): void {
    this.flushUntil();
  }

  public stop(): void {
    this._flushing = false;
  }
}
