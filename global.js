function passafari_command_handler(event) {
	console.log("passafari_command_handler: " + event.command);
	if (event.command === "passafari_open") {
		passafari_open(event);
	} else if (event.command === "passafari_select_credentials") {
		passafari_select_credentials(event);
	} else if (event.command === "passafari_select_save") {
		passafari_select_save(event);
	} else {
		console.log(event);
	}
	return undefined;
};

function passafari_message_handler(event) {
	console.log("passafari_message_handler: " + event.name);
	if (event.name == "passafari_save") {
		passafari_save(event);
	} else {
		console.log(event);
	}
	return undefined;
};

safari.application.addEventListener("command",   passafari_command_handler,  false);
safari.application.addEventListener("message",   passafari_message_handler,  false);


// CALLED by passafari_command_handler
function passafari_open(event) {
	passafari_associate();
	passafari_credentials_cache(null);

	passafari_retrieve_credentials(function(credentials) {
		if (credentials.length === 0) {
			passafari_notify_injected("passafari_retrieve");
		} else if (credentials.length === 1) {
			passafari_notify_injected("passafari_credentials", credentials);
		} else {
			passafari_display_credentials(credentials);
		}
	});

	return undefined;
}

// CALLED by passafari_command_handler
function passafari_select_credentials(event) {
	var idx = parseInt( event.target.identifier.split("_").pop() );
	var credentials = passafari_credentials_cache(null);

	if (credentials.length === 0) {
		// NOOP
	} else if (credentials.length === 1) {
		passafari_notify_injected("passafari_credentials", credentials);
	} else {
		passafari_notify_injected("passafari_credentials", [ credentials[idx] ]);
	}

	return undefined;
}

// CALLED by passafari_command_handler
function passafari_select_save(event) {
	var idx = parseInt( event.target.identifier.split("_").pop() );
	var credentials = passafari_credentials_cache(null);
	var credential = credentials[idx];

	if(credential) {
		var callback = function(code) { console.log("passafari_save: response code '" + code + "'.") };
		var tab = undefined;
		var entryId = credential.Uuid;
		var username = credential.Login;
		var password = credential.Password;
		var url = safari.application.activeBrowserWindow.activeTab.url;

		keepass.updateCredentials(callback, tab, entryId, username, password, url);
	} else {
		console.log("passafari_select_save: no credential found in cache for index '" + idx + "'.");
	}

	return undefined;
}

// CALLED by passafari_message_handler
function passafari_save(event) {
	console.log("passafari_save:");
	console.log(event);

	var credentials = passafari_credentials_cache(null) || [];
	var credential = event.message;

	if (credentials.length === 0) {
		if (credential && credential.Login.length > 0) {
			var toolbarItem = passafari_toolbar_item();

			safari.extension.removeMenu("passafari_save");
			var menu = safari.extension.createMenu("passafari_save");

			menu.appendMenuItem("passafari_credentials_0", credential.Login + " | Add", "passafari_select_save");

			passafari_credentials_cache([credential]);

			toolbarItem.menu = menu;
			toolbarItem.showMenu();
		}
	} else if (credentials.length === 1) {
		// NOOP
	} else {
		// NOOP
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

		menu.appendMenuItem("passafari_credentials_" + idx, credential.Login + " | " + credential.Name, "passafari_select_credentials");
	}

	passafari_credentials_cache(credentials);

	toolbarItem.menu = menu;
	toolbarItem.showMenu();

	return undefined;
}