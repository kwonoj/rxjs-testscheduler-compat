import * as _ from 'lodash';
import { assert } from 'chai';

import * as Rx from 'rxjs';
import { TestMessage } from 'rxjs/testing/TestMessage';
import { observableToBeFn } from 'rxjs/testing/TestScheduler';
import { HotObservable } from 'rxjs/testing/HotObservable';
import { next, error, complete, subscribe } from '../src/TestMessageValue';

function deleteErrorNotificationStack(marble: TestMessage) {
  const { notification } = marble;

  if (notification) {
    const { kind, exception } = notification;
    if (kind === 'E' && exception instanceof Error) {
      notification.exception = { name: exception.name, message: exception.message };
    }
  }
  return marble;
}

function stringify (x: Object): string {
  return JSON.stringify(x, (_key, value) => {
    return _.isArray(value) ?
      `[${value.map(i => `\n\t${stringify(i)}`)}\n]` : value;
  })
  .replace(/\\"/g, '"')
  .replace(/\\t/g, '\t')
  .replace(/\\n/g, '\n');
}

function observableMatcher(actual: Array<TestMessage>, expected: Array<TestMessage>) {
  if (Array.isArray(actual) && Array.isArray(expected)) {
    actual = actual.map(deleteErrorNotificationStack);
    expected = expected.map(deleteErrorNotificationStack);
    const passed = _.isEqual(actual, expected);
    if (passed) {
      return;
    }

    let message = '\nExpected \n';
    actual.forEach((x) => message += `\t${stringify(x)}\n`);

    message += '\t\nto deep equal \n';
    expected.forEach((x) => message += `\t${stringify(x)}\n`);

    assert(passed, message);
  } else {
    console.log(expected);
    console.log(actual);
    assert.deepEqual(actual, expected);
  }
}

describe('TestMessageValue', () => {
  let scheduler: Rx.TestScheduler;
  let expectObservable: (observable: HotObservable<any>, unsubscriptionMarbles?: string) => ({ toBe: observableToBeFn });

  beforeEach(() => {
    scheduler = new Rx.TestScheduler(observableMatcher);

    expectObservable = (observable: HotObservable<any>, unsubscriptionMarbles?: string) => {
      (scheduler as any).hotObservables.push(observable);
      return scheduler.expectObservable.apply(scheduler, [observable, unsubscriptionMarbles]);
    };
  });

  describe('factory method', () => {
    it('`next` should create notifcation', () => {
      const value = 'x';
      const subject = new HotObservable([next(20, value)], scheduler);
      const expected = '--x';

      expectObservable(subject).toBe(expected);

      scheduler.flush();
    });

    it('`error` should create notifcation', () => {
      const value = new Error('x');
      const subject = new HotObservable([error(20, value)], scheduler);
      const expected = '--#';

      expectObservable(subject).toBe(expected, null, value);

      scheduler.flush();
    });

    it('`complete` should create notifcation', () => {
      const subject = new HotObservable([complete(20)], scheduler);
      const expected = '--|';

      expectObservable(subject).toBe(expected);

      scheduler.flush();
    });

    it('`subscribe should create subscription log`', () => {
      const subscription = [subscribe(0, 60)];

      scheduler.expectSubscriptions(subscription).toBe('^     !');
      scheduler.flush();
    });
  });
});