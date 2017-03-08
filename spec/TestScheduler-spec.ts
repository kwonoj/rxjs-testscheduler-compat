import * as Rx from 'rxjs';
import { expect } from 'chai';

import { ArgumentOutOfRangeError } from 'rxjs/util/ArgumentOutOfRangeError';
import { AsyncAction } from 'rxjs/scheduler/AsyncAction';
import { TestScheduler } from '../src/TestScheduler';
import { next, error, complete, subscribe, TestMessageValue } from '../src/TestMessageValue';
import { BaseVirtualObserver } from '../src/VirtualObserver';
import { BaseVirtualPromise } from '../src/VirtualPromise';

describe('TestScheduler', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler();
  });

  describe('create observable', () => {
    it('should able to create hot observable', () => {
      const firstObserver = scheduler.createObserver();
      const firstSubExpected = [
        new TestMessageValue(20, Rx.Notification.createNext('a')),
        new TestMessageValue(40, Rx.Notification.createNext('b')),
        new TestMessageValue(60, Rx.Notification.createNext('c')),
        new TestMessageValue(80, Rx.Notification.createComplete()),
      ];

      const secondObserver = scheduler.createObserver();
      const secondSubExpected = [
        new TestMessageValue(40, Rx.Notification.createNext('b')),
        new TestMessageValue(60, Rx.Notification.createNext('c')),
        new TestMessageValue(80, Rx.Notification.createComplete()),
      ];

      const subject = scheduler.createHotObservable(
        next(20, 'a'),
        next(40, 'b'),
        next(60, 'c'),
        complete(80)
      );

      subject.subscribe(firstObserver);

      scheduler.advanceTo(30);

      subject.subscribe(secondObserver);

      scheduler.flush();

      expect(firstObserver.messages).to.deep.equal(firstSubExpected);
      expect(secondObserver.messages).to.deep.equal(secondSubExpected);
    });

    it('should able to create hot observable using array', () => {
      const observer = scheduler.createObserver();

      const messages = [
        next(20, 'a'),
        next(40, 'b'),
        next(60, 'c'),
        error(80, 'd')
      ];

      const expected = [
        new TestMessageValue(20, Rx.Notification.createNext('a')),
        new TestMessageValue(40, Rx.Notification.createNext('b')),
        new TestMessageValue(60, Rx.Notification.createNext('c')),
        new TestMessageValue(80, Rx.Notification.createError('d')),
      ];

      scheduler.createHotObservable(messages).subscribe(observer);

      scheduler.flush();

      expect(observer.messages).to.deep.equal(expected);
    });

    it('should able to create cold observable', () => {
      const firstObserver = scheduler.createObserver();
      const secondObserver = scheduler.createObserver();

      const firstExpected = [
        new TestMessageValue(20, Rx.Notification.createNext('a')),
        new TestMessageValue(40, Rx.Notification.createNext('b')),
        new TestMessageValue(60, Rx.Notification.createNext('c')),
        new TestMessageValue(80, Rx.Notification.createComplete()),
      ];

      const secondExpected = [
        new TestMessageValue(50, Rx.Notification.createNext('a')),
        new TestMessageValue(70, Rx.Notification.createNext('b')),
        new TestMessageValue(90, Rx.Notification.createNext('c')),
        new TestMessageValue(110, Rx.Notification.createComplete()),
      ];

      const subject = scheduler.createColdObservable(
        next(20, 'a'),
        next(40, 'b'),
        next(60, 'c'),
        complete(80)
      );

      subject.subscribe(firstObserver);

      scheduler.advanceTo(30);

      subject.subscribe(secondObserver);

      scheduler.flush();

      expect(firstObserver.messages).to.deep.equal(firstExpected);
      expect(secondObserver.messages).to.deep.equal(secondExpected);
    });

    it('should able to create cold observable using array', () => {
      const observer = scheduler.createObserver();

      const messages = [
        next(20, 'a'),
        next(40, 'b'),
        next(60, 'c'),
        error(80, 'd')
      ];

      const expected = [
        new TestMessageValue(20, Rx.Notification.createNext('a')),
        new TestMessageValue(40, Rx.Notification.createNext('b')),
        new TestMessageValue(60, Rx.Notification.createNext('c')),
        new TestMessageValue(80, Rx.Notification.createError('d')),
      ];

      scheduler.createColdObservable(messages).subscribe(observer);

      scheduler.flush();

      expect(observer.messages).to.deep.equal(expected);
    });
  });

  describe('create observer', () => {
    it('should able to create virtual observer', () => {
      const observer = scheduler.createObserver();

      expect(observer instanceof BaseVirtualObserver);
      expect((observer as any).scheduler).to.equal(scheduler);
    });
  });

  describe('create promise', () => {
    it('should able to create virtual promise', () => {
      const resolved = scheduler.createResolvedPromise(10, 1);
      const resolvedMessages = [
        next(10, 1),
        complete(10)
      ];

      const rejected = scheduler.createRejectedPromise(20, 2);
      const rejectedMessages = [
        error(20, 2)
      ];

      expect(resolved instanceof BaseVirtualPromise);
      expect(resolved.messages).to.deep.equal(resolvedMessages);

      expect(rejected instanceof BaseVirtualPromise);
      expect(rejected.messages).to.deep.equal(rejectedMessages);
    });
  });

  describe('advance to absolute time frame', () => {
    it('should able to advance to absolute time', () => {
      const observer = scheduler.createObserver();
      const toFrame = 50;

      const expected = [
        new TestMessageValue(20, Rx.Notification.createNext('a')),
        new TestMessageValue(40, Rx.Notification.createNext('b')),
      ];

      const subject = scheduler.createHotObservable(
        next(20, 'a'),
        next(40, 'b'),
        next(60, 'c'),
        complete(80)
      );

      subject.subscribe(observer);

      scheduler.advanceTo(toFrame);

      expect(observer.messages).to.deep.equal(expected);
      expect(scheduler.frame).to.equal(toFrame);
      expect(scheduler.now()).to.equal(toFrame);
    });

    it('should not do anything with zero absolute time', () => {
      const observer = scheduler.createObserver();

      const subject = scheduler.createHotObservable(
        next(20, 'a'),
        next(40, 'b'),
        next(60, 'c'),
        complete(80)
      );

      subject.subscribe(observer);

      scheduler.advanceTo(0);

      expect(observer.messages).to.empty;
    });

    it('should able to advance without any actions setup', () => {
      expect(() => scheduler.advanceTo(100)).to.not.throw();
    });

    it('should not allow backward', () => {
      scheduler.advanceTo(100);

      expect(() => scheduler.advanceTo(80)).to.throw(ArgumentOutOfRangeError);
      expect(() => scheduler.advanceTo(-1)).to.throw(ArgumentOutOfRangeError);
    });

    it('should unsubscribe the rest of the scheduled actions if an action throws an error', () => {
      const error = new Error('meh');
      let normalActionExecuted = false;

      const errorAction = new AsyncAction(scheduler, () => { throw error; });
      const normalAction = new AsyncAction(scheduler, () => { normalActionExecuted = true; });

      errorAction.schedule({}, 20);
      normalAction.schedule({}, 40);

      scheduler.actions.push(errorAction, normalAction);

      expect(() => scheduler.advanceTo(100)).to.throw(error);

      expect(errorAction.closed).to.be.true;
      expect(normalAction.closed).to.be.true;
      expect(normalActionExecuted).to.be.false;
    });
  });

  describe('advance to relative time frame', () => {
    it('should able to advance to relative time', () => {
      const observer = scheduler.createObserver();

      const expected = [
        new TestMessageValue(40, Rx.Notification.createNext('b'))
      ];

      const subject = scheduler.createHotObservable(
        next(20, 'a'),
        next(40, 'b'),
        next(60, 'c'),
        complete(80)
      );

      scheduler.advanceBy(30);

      subject.subscribe(observer);

      scheduler.advanceBy(20);

      expect(observer.messages).to.deep.equal(expected);
    });

    it('should not do anything with zero relative time', () => {
      const observer = scheduler.createObserver();

      const subject = scheduler.createHotObservable(
        next(20, 'a'),
        next(40, 'b'),
        next(60, 'c'),
        complete(80)
      );

      scheduler.advanceBy(30);

      subject.subscribe(observer);

      scheduler.advanceBy(0);

      expect(observer.messages).to.empty;
    });

    it('should able to advance without any actions setup', () => {
      expect(() => scheduler.advanceBy(100)).to.not.throw();
    });

    it('should not allow backward', () => {
      expect(() => scheduler.advanceBy(-1)).to.throw(ArgumentOutOfRangeError);
    });

    it('should unsubscribe the rest of the scheduled actions if an action throws an error', () => {
      const error = new Error('meh');
      let normalActionExecuted = false;

      const errorAction = new AsyncAction(scheduler, () => { throw error; });
      const normalAction = new AsyncAction(scheduler, () => { normalActionExecuted = true; });

      errorAction.schedule({}, 20);
      normalAction.schedule({}, 40);

      scheduler.actions.push(errorAction, normalAction);

      expect(() => scheduler.advanceBy(100)).to.throw(error);

      expect(errorAction.closed).to.be.true;
      expect(normalAction.closed).to.be.true;
      expect(normalActionExecuted).to.be.false;
    });
  });

  describe('schedule action', () => {
    const noop = () => {
      //noop
    };

    it('should able to schedule action in absolute time', () => {
      const executeAction = (x: Array<boolean>) => x.push(true);
      const expectedTime = 200;
      const expectedAction = [true, true];
      let executed: Array<boolean> = [];

      scheduler.scheduleAbsolute(executeAction, 100, executed);
      scheduler.flush();

      scheduler.scheduleAbsolute(executeAction, 200, executed);
      scheduler.flush();

      expect(scheduler.frame).to.equal(expectedTime);
      expect(scheduler.now()).to.equal(expectedTime);
      expect(executed).to.deep.equal(expectedAction);
    });

    it('should not able to schedule absolute past', () => {
      const expectedTime = 100;
      scheduler.scheduleAbsolute(noop, 100);
      scheduler.scheduleAbsolute(noop, 80);

      expect(() => scheduler.scheduleAbsolute(noop, -1)).to.throw(ArgumentOutOfRangeError);

      scheduler.flush();

      expect(() => scheduler.scheduleAbsolute(noop, 80)).to.throw(ArgumentOutOfRangeError);
      expect(scheduler.frame).to.equal(expectedTime);
      expect(scheduler.now()).to.equal(expectedTime);
    });

    it('should able to schedule action in relative time', () => {
      const executeAction = (x: Array<boolean>) => x.push(true);
      const expectedTime = 400;
      const expectedAction = [true, true, true];
      let executed: Array<boolean> = [];

      scheduler.scheduleRelative(executeAction, 100, executed);
      scheduler.scheduleRelative(executeAction, 200, executed);
      scheduler.flush();

      scheduler.scheduleRelative(executeAction, 200, executed);
      scheduler.flush();

      expect(scheduler.frame).to.equal(expectedTime);
      expect(scheduler.now()).to.equal(expectedTime);
      expect(executed).to.deep.equal(expectedAction);
    });

    it('should not able to schedule relative past', () => {
      expect(() => scheduler.scheduleRelative(noop, -1)).to.throw(ArgumentOutOfRangeError);

      scheduler.scheduleRelative(noop, 100);
      scheduler.flush();

      expect(() => scheduler.scheduleRelative(noop, -1)).to.throw(ArgumentOutOfRangeError);
    });
  });

  describe('flush scheduler', () => {
    it('should not flush while it\'s already flushing', () => {
      const observer = scheduler.createObserver();

      const expected = [
        new TestMessageValue(20, Rx.Notification.createNext('a')),
        new TestMessageValue(40, Rx.Notification.createNext('b')),
        new TestMessageValue(60, Rx.Notification.createNext('c')),
        new TestMessageValue(80, Rx.Notification.createComplete()),
      ];

      scheduler.schedule((x: TestScheduler) => x.flush(), 50, scheduler);

      scheduler.createHotObservable(
        next(20, 'a'),
        next(40, 'b'),
        next(60, 'c'),
        complete(80)
      ).subscribe(observer);

      scheduler.flush();

      expect(observer.messages).to.deep.equal(expected);
    });

    it('should able to stop fluhing', () => {
      const observer = scheduler.createObserver();

      const expected = [
        new TestMessageValue(20, Rx.Notification.createNext('a')),
        new TestMessageValue(40, Rx.Notification.createNext('b'))
      ];

      scheduler.schedule((x: TestScheduler) => x.stop(), 50, scheduler);

      scheduler.createHotObservable(
        next(20, 'a'),
        next(40, 'b'),
        next(60, 'c'),
        complete(80)
      ).subscribe(observer);

      scheduler.flush();

      expect(observer.messages).to.deep.equal(expected);
    });
  });

  describe('startScheduler', () => {
    it('should flush scheduler via default option', () => {
      const subject = scheduler.createColdObservable(
        next(50, 1),
        next(150, 2),
        next(250, 3),
        complete(300)
      );

      const expected = [
        new TestMessageValue(250, Rx.Notification.createNext(1)),
        new TestMessageValue(350, Rx.Notification.createNext(2)),
        new TestMessageValue(450, Rx.Notification.createNext(3)),
        new TestMessageValue(500, Rx.Notification.createComplete()),
      ];

      const expectedSubscriptions = [
        subscribe(200, 500)
      ];

      const observer = scheduler.startScheduler(() => subject);

      expect(observer.messages).to.deep.equal(expected);
      expect(subject.subscriptions).to.deep.equal(expectedSubscriptions);
    });

    it('should flush scheduler as specified option', () => {
      const options = {
        created: 60,
        subscribed: 100,
        unsubscribed: 200
      };

      const subject = scheduler.createColdObservable(
        next(50, 1),
        next(150, 2),
        next(250, 3),
        complete(300)
      );

      const expected = [
        new TestMessageValue(150, Rx.Notification.createNext(1)),
      ];

      const expectedSubscriptions = [
        subscribe(100, 200)
      ];

      const observer = scheduler.startScheduler(() => subject, options);

      expect(observer.messages).to.deep.equal(expected);
      expect(subject.subscriptions).to.deep.equal(expectedSubscriptions);
    });

    it('should allow zero value as options', () => {
      const options = {
        created: 0,
        subscribed: 0,
        unsubscribed: 200
      };

      const subject = scheduler.createColdObservable(
        next(50, 1),
        next(150, 2),
        next(250, 3),
        complete(300)
      );

      const expected = [
        new TestMessageValue(50, Rx.Notification.createNext(1)),
        new TestMessageValue(150, Rx.Notification.createNext(2)),
      ];

      const expectedSubscriptions = [
        subscribe(0, 200)
      ];

      const observer = scheduler.startScheduler(() => subject, options);

      expect(observer.messages).to.deep.equal(expected);
      expect(subject.subscriptions).to.deep.equal(expectedSubscriptions);
    });
  });
});