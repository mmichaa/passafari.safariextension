function passafari_settings_handler(event) {
	console.log("passafari_settings_handler: " + event.key);
	if(event.key === "locale") {
		String.locale = event.newValue;
	} else {
		console.log(event);
	}
	return undefined;
}

function passafari_command_handler(event) {
	console.log("passafari_command_handler: " + event.command);
	if (event.command === "passafari_command_activate") {
		passafari_command_activate(event);
	} else if (event.command === "passafari_command_select") {
		passafari_command_select(event);
	} else if (event.command === "passafari_command_save") {
		passafari_command_save(event);
	} else {
		console.log(event);
	}
	return undefined;
};

function passafari_message_handler(event) {
	console.log("passafari_message_handler: " + event.name);
	if (event.name == "passafari_message_save") {
		passafari_message_save(event);
	} else {
		console.log(event);
	}
	return undefined;
};

safari.extension.settings.addEventListener("change", passafari_settings_handler, false);
safari.application.addEventListener("command", passafari_command_handler, false);
safari.application.addEventListener("message", passafari_message_handler, false);


// CALLED by passafari_command_handler
function passafari_command_activate(event) {
	passafari_associate();
	passafari_credentials_cache(null);

	passafari_retrieve_credentials(function(credentials) {
		if (credentials.length === 0) {
			passafari_notify_injected("passafari_message_readout");
		} else if (credentials.length === 1) {
			passafari_notify_injected("passafari_message_fillin", credentials);
		} else {
			passafari_display_credentials(credentials);
		}
	});

	return undefined;
}

// CALLED by passafari_command_handler
function passafari_command_select(event) {
	var idx = parseInt( event.target.identifier.split("_").pop() );
	var credentials = passafari_credentials_cache(null);

	if (credentials.length === 0) {
		// NOOP
	} else if (credentials.length === 1) {
		passafari_notify_injected("passafari_message_fillin", credentials);
	} else {
		passafari_notify_injected("passafari_message_fillin", [ credentials[idx] ]);
	}

	return undefined;
}

// CALLED by passafari_command_handler
function passafari_command_save(event) {
	var idx = parseInt( event.target.identifier.split("_").pop() );
	var credentials = passafari_credentials_cache(null);
	var credential = credentials[idx];

	if(credential) {
		var updateCallback = function(code) { console.log("passafari_command_save: response code '" + code + "'.") };
		var tab = undefined;
		var entryId = credential.Uuid;
		var username = credential.Login;
		var password = credential.Password;
		var url = safari.application.activeBrowserWindow.activeTab.url;

		if (password === undefined || password === "") {
			passafari_generate_password(function(passwords) {
				if(passwords[0]) {
					password = credential.Password = passwords[0].Password;
					console.log("passafari_command_save: generated password '" + password + "'.");
					passafari_notify_injected("passafari_message_fillin", [ credential ]);
				}
				keepass.updateCredentials(updateCallback, tab, entryId, username, password, url);
			});
		} else {
			keepass.updateCredentials(updateCallback, tab, entryId, username, password, url);
		}
	} else {
		console.log("passafari_command_save: no credential found in cache for index '" + idx + "'.");
	}

	return undefined;
}

// CALLED by passafari_message_handler
function passafari_message_save(event) {
	var credentials = passafari_credentials_cache(null) || [];
	var credential = event.message;

	if (credentials.length === 0) {
		if (credential && credential.Login.length > 0) {
			var toolbarItem = passafari_toolbar_item();

			safari.extension.removeMenu("passafari_add");
			var menu = safari.extension.createMenu("passafari_add");

			menu.appendMenuItem("passafari_credentials_0", credential.Login + " | " + "credentials.add".toLocaleString(), "passafari_command_save");

			passafari_credentials_cache([credential]);

			toolbarItem.menu = menu;
			toolbarItem.showMenu();
		}
	} else {
		console.log("passafari_message_save: more than one credentials found.");
		console.log(event);
	}
}

// UTILS global.js related
function passafari_toolbar_item() {
	return safari.extension.toolbarItems[0];
}

// UTILS global.js related
function passafari_notify_injected(msg_name, msg_data) {
	safari.application.activeBrowserWindow.activeTab.page.dispatchMessage(msg_name, msg_data);
	return undefined;
}

// UTILS global.js related
function passafari_credentials_cache(credentials) {
	if (credentials === undefined) {
		credentials = safari.extension.secureSettings['credentials_cache'];
	} else if (credentials === null) {
		credentials = safari.extension.secureSettings['credentials_cache'];
		delete safari.extension.secureSettings['credentials_cache'];
	} else {
		safari.extension.secureSettings['credentials_cache'] = credentials;
	}

	return credentials;
}

// UTILS global.js related
function passafari_associate(event) {
	if(keepass.isConfigured()) {
		if(keepass.isAssociated()) {
			console.log("passafari_associate: keepass is already associated.");
		} else if(keepass.testAssociation()) {
			console.log("passafari_associate: keepass is correctly associated.");
		} else {
			console.log("passafari_associate: keepass isn't correctly associated. associating ...");
			keepass.associate();
		}
	} else {
		console.log("passafari_associate: keepass isn't configured. associating ...");
		keepass.associate();
	}
	return undefined;
}

// UTILS global.js related
function passafari_retrieve_credentials(callback) {
	var tab = undefined;
	var url = safari.application.activeBrowserWindow.activeTab.url;
	var submiturl = undefined;
	var forceCallback = false;
	var triggerUnlock = true;

	if(callback && url) {
		keepass.retrieveCredentials(callback, tab, url, submiturl, forceCallback, triggerUnlock);
	}

	return undefined;
}

// UTILS global.js related
function passafari_display_credentials(credentials) {
	var toolbarItem = passafari_toolbar_item();

	safari.extension.removeMenu("passafari_credentials");
	var menu = safari.extension.createMenu("passafari_credentials");

	for(var idx = 0; idx < credentials.length; idx++) {
		var credential = credentials[idx];

		menu.appendMenuItem("passafari_credentials_" + idx, credential.Login + " | " + credential.Name, "passafari_command_select");
	}

	passafari_credentials_cache(credentials);

	toolbarItem.menu = menu;
	toolbarItem.showMenu();

	return undefined;
}

// UTILS global.js related
function passafari_generate_password(callback, forceCallback) {
	keepass.generatePassword(callback, undefined, forceCallback);
	return undefined;
}