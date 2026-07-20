// Karma configuration for the unit test suite.
// Supplying a karmaConfig stops the Angular builder from injecting its own
// frameworks/plugins defaults, so those are declared explicitly here.
module.exports = function (config) {
	config.set({
		basePath: '',
		frameworks: ['jasmine'],
		plugins: [
			require('karma-jasmine'),
			require('karma-chrome-launcher'),
			require('karma-jasmine-html-reporter'),
			require('karma-coverage')
		],
		client: {
			jasmine: {},
			clearContext: false
		},
		jasmineHtmlReporter: {
			suppressAll: true
		},
		coverageReporter: {
			dir: require('path').join(__dirname, './coverage/my-own-website'),
			subdir: '.',
			reporters: [{ type: 'html' }, { type: 'text-summary' }]
		},
		reporters: ['progress', 'kjhtml'],
		browsers: ['Chrome'],
		restartOnFileChange: true,

		/* The initial test bundle is ~4 MB, and the suite is often run alongside `ng serve`.
		   Karma's 30s defaults expire during page load on a busy machine, which surfaces as
		   "Disconnected, because no message in 30000 ms" with zero tests executed. */
		captureTimeout: 180000,
		browserNoActivityTimeout: 180000,
		browserDisconnectTimeout: 30000,
		browserDisconnectTolerance: 2
	});
};
