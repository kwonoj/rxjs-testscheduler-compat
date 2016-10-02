import { expect } from 'chai';
import * as schedulerCompat from '../src/index';

describe('module export', () => {
  it('should export TestScheduler', () => {
    const scheduler = schedulerCompat.TestScheduler;

    expect(scheduler).to.exist;
    expect(new scheduler()).to.exist;
  });

  it('should export helper factory method', () => {
    const {next, error, complete, subscribe} = schedulerCompat;

    expect(next).to.exist;
    expect(error).to.exist;
    expect(complete).to.exist;
    expect(subscribe).to.exist;
  });
});