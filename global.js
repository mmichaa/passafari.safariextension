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
		var entry_id = credential.Uuid;
		var username = credential.Login;
		var password = credential.Password;
		var url = passafari_format_url(passafari_active_tab_url());
		var submit_url = passafari_format_submit_url(credential.SubmitUrl);

		if(password === undefined || password === "") {
			var passwords = passafari_generate_password();
			if(passwords && passwords.length > 0) {
				password = credential.Password = passwords[0].Password;
				console.log("passafari_command_update: generated password '" + password + "'.");
				passafari_notify_injected("passafari_message_fillin", [ credential ]);
			}
		}
		keepass.updateCredentials(updateCallback, tab, entry_id, username, password, url, submit_url);
	} else {
		console.log("passafari_command_update: no credential found in cache for index '" + idx + "'.");
	}

	return undefined;
}

// CALLED by passafari_message_handler
function passafari_message_readout(event) {
	var credentials = passafari_credentials_cache();
	var readout = event.message;
	var readout_as_new_credential = true;

	for(var idx = 0; idx < credentials.length; idx++) {
		credentials[idx].passafari_command = "passafari_command_select";
	}

	if(readout && readout.Login.length > 0) {
		readout.passafari_command = "passafari_command_update";

		for(var idx = 0; idx < credentials.length; idx++) {
			var credential = credentials[idx];

			if(credential.Login === readout.Login) {
				if(credential.Password !== readout.Password) {
					var credential_upd = clone(credential);
					credential_upd.passafari_command = "passafari_command_update"
					credential_upd.Password = readout.Password;
					credential_upd.SubmitUrl = readout.SubmitUrl;
					credentials.push(credential_upd);
					continue;
				} else {
					readout_as_new_credential = false;
					continue;
				}
			}
		}

		if(readout_as_new_credential) {
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
	var menu_update_item_added = (credentials.length > 1) ? false : true;
	var menu_add_item_added = (credentials.length > 1) ? false : true;

	for(var idx = 0; idx < credentials.length; idx++) {
		var credential = credentials[idx];
		var menu_item = undefined;
		var menu_item_label = undefined;
		var menu_item_image = undefined;

		if(credential.passafari_command === "passafari_command_select") {
			menu_item_label = credential.Login + " (" + credential.Name + ")";
			menu_item_image = safari.extension.baseURI + "images/font-awesome-pencil-square-o.png";
		} else if(credential.passafari_command === "passafari_command_update" && credential.Uuid !== undefined) {
			menu_item_label = credential.Login + " (" + credential.Name;
			menu_item_image = safari.extension.baseURI + "images/font-awesome-floppy-o.png";

			if (credential.Password === undefined || credential.Password === "") {
				menu_item_label = menu_item_label + "; " + "credentials.password_generated".toLocaleString() + ")";
			} else {
				menu_item_label = menu_item_label + "; " + "credentials.password_entered".toLocaleString() + ")";
			}

			if (!menu_update_item_added) {
				menu.appendSeparator("passafari_credentials_update_section");
				menu_update_item_added = true;
			}
		} else if(credential.passafari_command === "passafari_command_update" && credential.Uuid === undefined) {
			menu_item_label = credential.Login;
			menu_item_image = safari.extension.baseURI + "images/font-awesome-plus-square-o.png";

			if (credential.Password === undefined || credential.Password === "") {
				menu_item_label = menu_item_label + " (" + "credentials.password_generated".toLocaleString() + ")";
			} else {
				menu_item_label = menu_item_label + " (" + "credentials.password_entered".toLocaleString() + ")";
			}

			if (!menu_add_item_added) {
				menu.appendSeparator("passafari_credentials_add_section");
				menu_add_item_added = true;
			}
		}

		menu_item = menu.appendMenuItem("passafari_credentials_" + idx, menu_item_label, credential.passafari_command);
		menu_item.image = menu_item_image;
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

function passafari_active_tab_url() {
	return safari.application.activeBrowserWindow.activeTab.url;
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

// UTILS global.js related
function passafari_format_url(url) {
	var format = safari.extension.settings.url_format;

	if(format === "protocol_host_path") {
		return passafari_url_protocol_host_path_only(url);
	} else if(format === "protocol_host") {
		return passafari_url_protocol_host_only(url);
	} else if(format === "host") {
		return passafari_url_host_only(url);
	} else {
		return url;
	}
}

// UTILS global.js related
function passafari_format_submit_url(url) {
	var format = safari.extension.settings.submit_url_format;

	if(format === "protocol_host_path") {
		return passafari_url_protocol_host_path_only(url);
	} else if(format === "protocol_host") {
		return passafari_url_protocol_host_only(url);
	} else if(format === "host") {
		return passafari_url_host_only(url);
	} else {
		return url;
	}
}

// UTILS global.js related (passafari_format_url & passafari_format_submit_url)
function passafari_url_host_only(url) {
	var link = document.createElement("a");
	link.href = url;

	return link.host;
}

// UTILS global.js related (passafari_format_url & passafari_format_submit_url)
function passafari_url_protocol_host_only(url) {
	var link = document.createElement("a");
	link.href = url;

	return link.protocol + "//" + link.host;
}

// UTILS global.js related (passafari_format_url & passafari_format_submit_url)
function passafari_url_protocol_host_path_only(url) {
	var link = document.createElement("a");
	link.href = url;

	return link.protocol + "//" + link.host + link.pathname;
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
	var url = passafari_format_url(passafari_active_tab_url());
	var submit_url = passafari_format_submit_url(passafari_active_tab_url());
	var force_callback = false;
	var trigger_unlock = true;

	if(url) {
		return keepass.retrieveCredentials(callback, tab, url, submit_url, force_callback, trigger_unlock);
	} else {
		return undefined;
	}
}

// UTILS global.js / keepass.js related
function passafari_generate_password(callback, force_callback) {
	callback = (callback === undefined) ? function(passwords) {} : callback;

	return keepass.generatePassword(callback, undefined, force_callback);
}