// HANDLER for change events
function passafari_settings_handler(event) {
	console.log("passafari_settings_handler: " + event.key);
	if(event.key === "locale") {
		String.locale = event.newValue;
	} else {
		console.log(event);
	}
	return undefined;
}

// HANDLER for command events
function passafari_command_handler(event) {
	console.log("passafari_command_handler: " + event.command);
	if(event.command === "passafari_command_activate") {
		passafari_command_activate(event);
	} else if(event.command === "passafari_command_select") {
		passafari_command_select(event);
	} else if(event.command === "passafari_command_update") {
		passafari_command_update(event);
	} else {
		console.log(event);
	}
	return undefined;
};

// HANDLER for message events
function passafari_message_handler(event) {
	console.log("passafari_message_handler: " + event.name);
	if(event.name === "passafari_message_readout") {
		passafari_message_readout(event);
	} else {
		console.log(event);
	}
	return undefined;
};

// LISTENER for change, command and message
safari.extension.settings.addEventListener("change", passafari_settings_handler, false);
safari.application.addEventListener("command", passafari_command_handler, false);
safari.application.addEventListener("message", passafari_message_handler, false);


// CALLED by passafari_command_handler
function passafari_command_activate(event) {
	passafari_associate();
	passafari_credentials_cache(null);

	var credentials = passafari_retrieve_credentials();

	if(credentials === undefined) {
		console.log("passafari_command_activate: undefined result from retrieving credentials.");
	} else {
		passafari_credentials_cache(credentials);
		passafari_notify_injected("passafari_message_readout");
	}

	return undefined;
}

// CALLED by passafari_command_handler
function passafari_command_select(event) {
	var idx = parseInt( event.target.identifier.split("_").pop() );
	var credentials = passafari_credentials_cache(null);

	if(credentials.length === 0) {
		console.log("passafari_command_select: no credentials available to select from.");
		console.log(event);
	} else {
		passafari_notify_injected("passafari_message_fillin", [ credentials[idx] ]);
	}

	return undefined;
}

// CALLED by passafari_command_handler
function passafari_command_update(event) {
	var idx = parseInt( event.target.identifier.split("_").pop() );
	var credentials = passafari_credentials_cache(null);
	var credential = credentials[idx];

	if(credential) {
		var updateCallback = function(code) { console.log("passafari_command_update: response code '" + code + "'.") };
		var tab = undefined;
		var entryId = credential.Uuid;
		var username = credential.Login;
		var password = credential.Password;
		var url = safari.application.activeBrowserWindow.activeTab.url;

		if(password === undefined || password === "") {
			var passwords = passafari_generate_password();
			if(passwords && passwords.length > 0) {
				password = credential.Password = passwords[0].Password;
				console.log("passafari_command_update: generated password '" + password + "'.");
				passafari_notify_injected("passafari_message_fillin", [ credential ]);
			}
		}
		keepass.updateCredentials(updateCallback, tab, entryId, username, password, url);
	} else {
		console.log("passafari_command_update: no credential found in cache for index '" + idx + "'.");
	}

	return undefined;
}

// CALLED by passafari_message_handler
function passafari_message_readout(event) {
	var credentials = passafari_credentials_cache();
	var readout = event.message;

	for(var idx = 0; idx < credentials.length; idx++) {
		credentials[idx].passafari_command = "passafari_command_select";
	}

	if(readout && readout.Login.length > 0) {
		readout.passafari_command = "passafari_command_update";

		for(var idx = 0; idx < credentials.length; idx++) {
			if(credentials[idx].Login === readout.Login) {
				if(credentials[idx].Password === readout.Password) {
					readout = undefined;
					break;
				} else {
					readout.Uuid = credentials[idx].Uuid;
					break;
				}
			}
		}

		if (readout !== undefined) {
			credentials.push(readout);
		}
	}

	if(credentials.length === 1 && credentials[0].passafari_command === "passafari_command_select") {
		passafari_notify_injected("passafari_message_fillin", credentials);
	} else {
		passafari_display_credentials(credentials);
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

		if(credential.passafari_command === "passafari_command_select") {
			menu.appendMenuItem("passafari_credentials_" + idx, credential.Login + " | " + credential.Name, credential.passafari_command); // OR "credentials.fillin".toLocaleString()
		} else if(credential.passafari_command === "passafari_command_update" && credential.Uuid !== undefined) {
			menu.appendMenuItem("passafari_credentials_" + idx, credential.Login + " | " + "credentials.update".toLocaleString(), credential.passafari_command);
		} else if(credential.passafari_command === "passafari_command_update" && credential.Uuid === undefined) {
			menu.appendMenuItem("passafari_credentials_" + idx, credential.Login + " | " + "credentials.add".toLocaleString(), credential.passafari_command);
		}
	}

	passafari_credentials_cache(credentials);

	toolbarItem.menu = menu;
	toolbarItem.showMenu();

	return undefined;
}

// UTILS global.js related
function passafari_notify_injected(msg_name, msg_data) {
	safari.application.activeBrowserWindow.activeTab.page.dispatchMessage(msg_name, msg_data);
	return undefined;
}

// UTILS global.js related
function passafari_toolbar_item() {
	return safari.extension.toolbarItems[0];
}

// UTILS global.js related
function passafari_credentials_cache(credentials) {
	if(credentials === undefined) {
		credentials = safari.extension.secureSettings['credentials_cache'];
	} else if(credentials === null) {
		credentials = safari.extension.secureSettings['credentials_cache'];
		delete safari.extension.secureSettings['credentials_cache'];
	} else {
		safari.extension.secureSettings['credentials_cache'] = credentials;
	}

	return credentials;
}

// UTILS global.js / keepass.js related
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

// UTILS global.js / keepass.jsrelated
function passafari_retrieve_credentials(callback) {
	callback = (callback === undefined) ? function(credentials) {} : callback;
	var tab = undefined;
	var url = safari.application.activeBrowserWindow.activeTab.url;
	var submiturl = undefined;
	var forceCallback = false;
	var triggerUnlock = true;

	if(url) {
		return keepass.retrieveCredentials(callback, tab, url, submiturl, forceCallback, triggerUnlock);
	} else {
		return undefined;
	}
}

// UTILS global.js / keepass.js related
function passafari_generate_password(callback, forceCallback) {
	callback = (callback === undefined) ? function(passwords) {} : callback;

	return keepass.generatePassword(callback, undefined, forceCallback);
}