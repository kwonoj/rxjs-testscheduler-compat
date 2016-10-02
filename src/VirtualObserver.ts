import * as Rx from 'rxjs';
import { Scheduler } from 'rxjs/Scheduler';
import { TestMessage } from 'rxjs/testing/TestMessage';
import { TestMessageValue } from './TestMessageValue';

export interface VirtualObserver extends Rx.Observer<any> {
  messages: Array<TestMessage>;
}

export class BaseVirtualObserver implements VirtualObserver {
  readonly closed: boolean;
  readonly messages: Array<TestMessage> = [];

  constructor(private scheduler: Scheduler) {
  }

  next(value: any): void {
    this.messages.push(new TestMessageValue(this.scheduler.now(), Rx.Notification.createNext(value)));
  }

  error(value: any): void {
    this.messages.push(new TestMessageValue(this.scheduler.now(), Rx.Notification.createError(value)));
  }

  complete(): void {
    this.messages.push(new TestMessageValue(this.scheduler.now(), Rx.Notification.createComplete()));
  }
}