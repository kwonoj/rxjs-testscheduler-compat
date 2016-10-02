import * as Rx from 'rxjs';
import { TestMessage } from 'rxjs/testing/TestMessage';
import { SubscriptionLog } from 'rxjs/testing/SubscriptionLog';

export class TestMessageValue implements TestMessage {
  readonly frame: number;
  readonly notification: Rx.Notification<any>;

  constructor(frame: number, notification: Rx.Notification<any>) {
    this.frame = frame;
    this.notification = notification;
  }
}

export function next(frame: number, value: any): TestMessage {
  return new TestMessageValue(frame, Rx.Notification.createNext(value));
}

export function error(frame: number, value: any): TestMessage {
  return new TestMessageValue(frame, Rx.Notification.createError(value));
}

export function complete(frame: number): TestMessage {
  return new TestMessageValue(frame, Rx.Notification.createComplete());
}

export function subscribe(subscribedFrame: number,
                          unsubscribedFrame: number = Number.POSITIVE_INFINITY) {
  return new SubscriptionLog(subscribedFrame, unsubscribedFrame);
}