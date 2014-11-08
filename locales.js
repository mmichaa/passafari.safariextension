String.toLocaleString({
	'en': {
		'credentials.password_generated': 'generated password',
		'credentials.password_entered': 'entered password'
	},
	'de': {
		'credentials.password_generated': 'generiertes Passwort',
		'credentials.password_entered': 'eingegebenes Passwort'
	}
});

String.defaultLocale = 'en';
String.locale = safari.extension.settings.locale;