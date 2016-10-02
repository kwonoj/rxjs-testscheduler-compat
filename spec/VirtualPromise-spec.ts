import { expect } from 'chai';

import * as Rx from 'rxjs';
import { TestScheduler } from '../src/TestScheduler';
import { BaseVirtualPromise } from '../src/VirtualPromise';
import { next, error, complete, TestMessageValue } from '../src/TestMessageValue';

describe('VirtualPromise', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler();
  });

  it('should resolve at scheduled time', () => {
    const observer = scheduler.createObserver();
    const expected = [
      new TestMessageValue(50, Rx.Notification.createNext('a')),
      new TestMessageValue(50, Rx.Notification.createComplete()),
    ];

    const promise = new BaseVirtualPromise(scheduler, [next(50, 'a'), complete(50)]);

    const subscription = Rx.Observable.fromPromise(promise, scheduler).subscribe(observer);
    scheduler.advanceTo(40);

    expect(observer.messages).to.empty;

    scheduler.flush();
    subscription.unsubscribe();

    expect(observer.messages).to.deep.equal(expected);
  });

  it('should reject at scheduled time', () => {
    const observer = scheduler.createObserver();
    const expected = [ new Error('x') ];
    const value: Array<any> = [];
    const promise = new BaseVirtualPromise(scheduler, [error(50, new Error('x'))]);

    promise.then(() => null, x => value.push(x));

    scheduler.advanceTo(40);

    expect(observer.messages).to.empty;

    scheduler.flush();

    expect(value).to.deep.equal(expected);
  });
});