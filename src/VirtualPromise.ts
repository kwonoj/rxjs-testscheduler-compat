import { PartialObserver } from 'rxjs/Observer';
import { Notification } from 'rxjs/Notification';
import { TestMessage } from 'rxjs/testing/TestMessage';

import { VirtualTestScheduler } from './VirtualTestScheduler';
import { next, complete } from './TestMessageValue';

export interface VirtualPromise extends Promise<any> {
  messages: Array<TestMessage>;
}

export class BaseVirtualPromise implements VirtualPromise {
  public readonly [Symbol.toStringTag]: 'Promise';
  public readonly messages: Array<TestMessage>;
  private observers: Array<PartialObserver<any>> = [];

  constructor(private scheduler: VirtualTestScheduler, messages: Array<TestMessage>) {
    this.messages = messages;
    this.setup();
  }

  private setup(): void {
    const subject = this;
    const { messages } = subject;

    messages.forEach((message: TestMessage) =>
      subject.scheduler.scheduleAbsolute(
        (x: Notification<any>) => {
          subject.observers.slice(0);
          subject.observers.forEach(x.observe.bind(x));
        },
        message.frame,
        message.notification)
    );
  }

  public then<TResult, TResult2 = never>(onfulfilled?: ((value: any) => TResult | PromiseLike<TResult>) | undefined | null,
                                         onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): VirtualPromise
  public then<TResult, TResult2 = never>(onfulfilled?: ((value: any) => TResult | PromiseLike<TResult>) | undefined | null,
                                         onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): VirtualPromise {
    const subject = this;
    const { scheduler, messages } = subject;
    const updateObservers = (observer: PartialObserver<any>) => {
      const idx = subject.observers.indexOf(observer);
      subject.observers.splice(idx, 1);
    };

    let promise: Promise<TResult> | null = null;

    const observer: PartialObserver<any> = {
      next: (value: any) => {
        if (!onfulfilled) {
          return;
        }
        const ret = onfulfilled(value);

        if (ret && typeof (ret as PromiseLike<TResult>).then === 'function') {
          promise = ret as Promise<TResult>;
        } else {
          const frame = scheduler.now();
          promise = new BaseVirtualPromise(scheduler, [next(frame, undefined), complete(frame)]);
        }
        updateObservers(observer);
      },
      error: (err: any) => {
        if (!onrejected) {
          return;
        }

        onrejected(err);
        updateObservers(observer);
      }
    };

    this.observers.push(observer);

    return promise || new BaseVirtualPromise(scheduler, messages);
  }

  public catch(_onrejected?: (reason: any) => any | PromiseLike<any>): Promise<any>
  public catch(_onrejected?: (reason: any) => void): Promise<any> {
    throw new Error('not implemented');
  }
}