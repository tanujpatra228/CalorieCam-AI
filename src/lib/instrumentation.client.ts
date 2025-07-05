import * as Sentry from '@sentry/nextjs'

Sentry.init({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
	tracesSampleRate: 1.0,
	_experiments: {
		enableLogs: true,
	},
	integrations: [
		Sentry.consoleLoggingIntegration({ levels: ['log', 'error', 'warn'] })
	],
}) 