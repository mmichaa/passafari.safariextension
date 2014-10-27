function passafari_command_handler(event) {
	console.log("passafari_command_handler: " + event.command);
	if (event.command === "passafari_open") {
		passafari_open(event);
	} else if (event.command === "passafari_select_credentials") {
		passafari_select_credentials(event);
	} else {
		console.log(event);
	}
	return undefined;
};

function passafari_message_handler(event) {
	console.log("passafari_message_handler: " + event.name);
	if (event.name == "passafari_associate") {
		passafari_associate(event);
	} else {
		console.log(event);
	}
	return undefined;
};

safari.application.addEventListener("command",  passafari_command_handler,  false);
safari.application.addEventListener("message",  passafari_message_handler,  false);

function passafari_open(event) {
	passafari_associate();

	passafari_retrieve_credentials(function(credentials) {
		if (credentials.length === 0) {
		} else if (credentials.length === 1) {
			passafari_notify_injected(credentials);
		} else {
			passafari_display_credentials(credentials);
		}
	});

	return undefined;
}

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

function passafari_display_credentials(credentials) {
	var toolbarItem = safari.extension.toolbarItems[0];

	safari.extension.removeMenu("passafari_credentials");
	var menu = safari.extension.createMenu("passafari_credentials");

	for(var idx = 0; idx < credentials.length; idx++) {
		var credential = credentials[idx];

		menu.appendMenuItem("passafari_credentials_" + idx, credential.Login + " | " + credential.Name, "passafari_select_credentials");
	}

	toolbarItem.menu = menu;
	toolbarItem.showMenu();

	return undefined;
}

function passafari_select_credentials(event) {
	var idx = parseInt( event.target.identifier.split("_").pop() );

	passafari_retrieve_credentials(function(credentials) {
		if (credentials.length === 0) {
		} else if (credentials.length === 1) {
			passafari_notify_injected(credentials);
		} else {
			passafari_notify_injected([ credentials[idx] ]);
		}
	});

	return undefined;
}

function passafari_notify_injected(credentials) {
	safari.application.activeBrowserWindow.activeTab.page.dispatchMessage("passafari_credentials", credentials);
}