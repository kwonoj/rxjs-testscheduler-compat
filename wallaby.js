module.exports = (w) => ({
    files: [
      'src/**/*.ts'
    ],

    tests: [
      'spec/**/*.ts'
    ],

    testFramework: {
      type: 'mocha',
      path: 'mocha'
    },

    env: {
      type: 'node'
    },
    debug: true,
    workers: {initial: 2, regular: 2}
});