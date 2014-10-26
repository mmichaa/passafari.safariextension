function passafari_command_handler(event) {
	console.log("passafari_command_handler: " + event.command);
	if (event.command == "passafari_open") {
		passafari_open(event);
	} else if (event.command == "passafari-associate") {
		passafari_associate(event);
	}
	return undefined;
};

function passafari_message_handler(event) {
	console.log("passafari_message_handler: " + event.name);
	if (event.name == "passafari_associate") {
		passafari_associate(event);
	}
	return undefined;
};

function passafari_popover_handler(event) {
	console.log("passafari_popover_handler: " + event.target.identifier);

	return undefined;
}

function passafari_validate_handler(event) {
	console.log("passafari_validate_handler: " + event.command);
	return undefined;
}

safari.application.addEventListener("command",  passafari_command_handler,  false);
safari.application.addEventListener("message",  passafari_message_handler,  false);
safari.application.addEventListener("popover",  passafari_popover_handler,  true);
safari.application.addEventListener("validate", passafari_validate_handler, true);


function passafari_open(event) {
	passafari_associate();

	passafari_retrieve_credentials(function(credentials) {
		if (credentials.length === 0) {
		} else if (credentials.length === 1) {
			passafari_notify_injected(credentials);
		} else {
			//passafari_display_credentials(credentials);
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
	var forceCallback = function() {};
	var triggerUnlock = true;

	if(callback && url) {
		keepass.retrieveCredentials(callback, tab, url, submiturl, forceCallback, triggerUnlock);
	}

	return undefined;
}

function passafari_display_credentials(credentials) {
	var toolbar_item = safari.extension.toolbarItems[0];

	if(!toolbar_item.popover) {
		var width = 300;
		var height = 400;

		var popover = safari.extension.createPopover("credentials", safari.extension.baseURI + "popovers/credentials.html", width, height);

		toolbar_item.popover = popover;
	}

	var popover_document = toolbar_item.popover.contentWindow.document;
	var ul = popover_document.getElementById("credentials-list");
	ul.innerHTML = "";

	for(var idx = 0; idx < credentials.length; idx++) {
		var credential = credentials[idx];
		var li = popover_document.createElement("li");
		var li_text = popover_document.createTextNode(credential.Login + ' | ' + credential.Name);
		li.appendChild(li_text);
		ul.appendChild(li);
	}

	toolbar_item.showPopover();

	return undefined;
}

function passafari_notify_injected(credentials) {
	safari.application.activeBrowserWindow.activeTab.page.dispatchMessage("credentials", credentials);
}