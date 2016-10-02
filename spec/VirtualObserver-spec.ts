import * as Rx from 'rxjs';

import { expect } from 'chai';

import { TestScheduler } from '../src/TestScheduler';
import { next, error, complete, TestMessageValue } from '../src/TestMessageValue';
import { BaseVirtualObserver } from '../src/VirtualObserver';

describe('VirtualObserver', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler();
  });

  it('should records received next notification and its timestamp', () => {
    const observer = new BaseVirtualObserver(scheduler);

    const messages = [
        next(20, 'a'),
        next(40, 'b'),
        next(60, 'c'),
        complete(80)
      ];

    const expected = [
      new TestMessageValue(20, Rx.Notification.createNext('a')),
      new TestMessageValue(40, Rx.Notification.createNext('b')),
      new TestMessageValue(60, Rx.Notification.createNext('c')),
      new TestMessageValue(80, Rx.Notification.createComplete()),
    ];

    const subject = scheduler.createHotObservable(messages);
    subject.subscribe(observer);

    scheduler.flush();

    expect(observer.messages).to.deep.equal(expected);
  });

  it('should records received error notification and its timestamp', () => {
    const observer = new BaseVirtualObserver(scheduler);

    const messages = [
        next(20, 'a'),
        next(40, 'b'),
        error(60, 'c'),
        complete(80)
      ];

    const expected = [
      new TestMessageValue(20, Rx.Notification.createNext('a')),
      new TestMessageValue(40, Rx.Notification.createNext('b')),
      new TestMessageValue(60, Rx.Notification.createError('c')),
    ];

    const subject = scheduler.createHotObservable(messages);
    subject.subscribe(observer);

    scheduler.flush();

    expect(observer.messages).to.deep.equal(expected);
  });
});