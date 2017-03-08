[![Build Status](https://circleci.com/gh/kwonoj/rxjs-testscheduler-compat/tree/master.svg?style=shield&circle-token=:circle-token)](https://circleci.com/gh/kwonoj/rxjs-testscheduler-compat/tree/master)
[![codecov](https://codecov.io/gh/kwonoj/rxjs-testscheduler-compat/branch/master/graph/badge.svg)](https://codecov.io/gh/kwonoj/rxjs-testscheduler-compat)
[![npm (scoped)](https://img.shields.io/npm/v/@kwonoj/rxjs-testscheduler-compat.svg?maxAge=2592000)](https://www.npmjs.com/package/@kwonoj/rxjs-testscheduler-compat)

# RxJS-TestScheduler-Compat

`rxjs-testscheduler-compat` provides RxJS v4's [test scheduler interface](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/testing/testscheduler.md) to v5 version of [RxJS](https://github.com/ReactiveX/rxjs) allows to migrate existing test cases with minimum effort as well as writing new test cases for certain cases.

# Install

This has a peer dependencies of `rxjs@5.*.*`, which will have to be installed as well

```sh
npm install @kwonoj/rxjs-testscheduler-compat
```

# Usage

You can import `TestScheduler` and other helpers to create test cases.

```js
import * as Rx from 'rxjs';
import { TestScheduler, next, complete } from '@kwonoj/rxjs-testscheduler-compat';

const scheduler = new TestScheduler();
const observer = scheduler.createObserver();

const subject = scheduler.createHotObservable(
      next(20, 'a'),
      next(40, 'b'),
      next(60, 'c'),
      complete(80)
    );

subject.subscribe(observer);

scheduler.advanceTo(30);
```

As this does not patches anything in RxJS v5's test scheduler, you can use both if it's needed

```js
import * as Rx from 'rxjs';
import { TestScheduler as CompatScheduler } from '@kwonoj/rxjs-testscheduler-compat';

const v5Scheduler = new Rx.TestScheduler(...);
const v4Scheduler = new CompatScheduler();

...
```

# Migrating from RxJS v4 test scheduler

There are few changes in api surfaces to conform with v5's scheduler interface as well as enhance conviniences.

## ReactiveTest helper functions

- `ReactiveTest.onNext(value)` -> `next(value)`
- `ReactiveTest.onError(value)` -> `error(value)`
- `ReactiveTest.onCompleted(value)` -> `complete(value)`
- `ReactiveTest.subscribe(value)` -> `subscribe(value)`

Notification factory method (`next`, `error`, `complete`) returns implementaiton of [`TestMessage`](https://github.com/ReactiveX/rxjs/blob/master/src/testing/TestMessage.ts)
and `subscribe` returns [`SubscriptionLog`](https://github.com/ReactiveX/rxjs/blob/master/src/testing/SubscriptionLog.ts)

## Scheduler instance functions

- `TestScheduler::start()` -> `TestScheduler::flush()`
- does not support scheduler's instance methods for scheduling such as `scheduleFuture`, `schedulerRecursive`, `schedulePeriodic`... except `scheduleAbsolute`, `scheduleRelative`, `startScheduler`

# Building / Testing

Few npm scripts are supported for build / test code.

- `build`: Transpiles code to ES5 commonjs to `dist`.
- `build:clean`: Clean up existing build
- `test`: Run unit test. Does not require `build` before execute test.
- `test:cover`: Run code coverage against test cases
- `lint`: Run lint over all codebases
- `lint:staged`: Run lint only for staged changes. This'll be executed automatically with precommit hook.
- `commit`: Commit wizard to write commit message