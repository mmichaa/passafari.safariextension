console.log('passafari: end.js');

// HANDLER for message events
function passafari_injected_message_handler(event) {
	var name = event.name;
	var data = event.message;

	console.log("passafari_injected_message_handler: " + name);

	if(name === "passafari_message_fillin") {
		passafari_injected_message_fillin(name, data);
	} else if(name === "passafari_message_readout") {
		passafari_injected_message_readout(name, data);
	} else {
		console.log(data);
	}

	return undefined;
}

// LISTENER for message only on top window
if(window.parent === window) {
	console.log('passafari: window.top');
	safari.self.addEventListener("message", passafari_injected_message_handler, false);
}

// CALLED by passafari_injected_message_handler
function passafari_injected_message_fillin(event_name, event_data) {
	if(event_data.length === 1) {
		var credentials = event_data[0];
		var input_candidates = passafari_input_candidates(true);

		if(input_candidates.length === 1) {
			var inputs = input_candidates[0];

			if(inputs.username) { inputs.username.value = credentials.Login; }
			if(inputs.password) { inputs.password.value = credentials.Password; }
			if(inputs.password_confirmation) { inputs.password_confirmation.value = credentials.Password; }
		} else {
			console.log("passafari_injected_message_fillin: more than one inputs found.")
			console.log(inputs);
		}
	} else {
		console.log("passafari_injected_message_fillin: more than one credentials found.")
		console.log(event_data);
	}

	return undefined;
}

// CALLED by passafari_injected_message_handler
function passafari_injected_message_readout(event_name, event_data) {
	var input_candidates = passafari_input_candidates(false);

	if(input_candidates.length === 1) {
		var inputs = input_candidates[0];

		var username = inputs.username.value;
		var password = inputs.password.value;
		var submit_url = inputs.username.form.action;

		passafari_notify_global_page("passafari_message_readout", {"Login": username, "Password": password, "SubmitUrl": submit_url, "Uuid": undefined});
	} else {
		console.log("passafari_injected_message_readout: more than one inputs found.")
		console.log(inputs);

		passafari_notify_global_page("passafari_message_readout", null);
	}

	return undefined;
}

// UTILS end.js related
function passafari_notify_global_page(msg_name, msg_data) {
	safari.self.tab.dispatchMessage(msg_name, msg_data);
	return undefined;
}

// UTILS end.js related
function passafari_input_candidates(allow_password_only) {
	var candidates = [];

	for(var form_idx=0; form_idx < document.forms.length; form_idx++) {
		var form = document.forms[form_idx];

		if(form.method.toLowerCase() === "get") {
			continue;
		}

		var inputs = { "username": undefined, "password": undefined, "password_confirmation": undefined };

		for(var elem_idx=0; elem_idx < form.elements.length; elem_idx++) {
			var elem = form.elements[elem_idx];

			if(elem.disabled || elem.readOnly) {
				continue;
			}

			var elem_type = elem.type.toLowerCase();

			if(elem_type === "password") {
				if(inputs.password === undefined) { inputs.password = elem; }
				else if(inputs.password_confirmation === undefined) { inputs.password_confirmation = elem; }
			}
			else if(elem_type === "email" || elem_type === "text") {
				inputs.username = elem;
			}

			if(inputs.username && inputs.password && inputs.password_confirmation) {
				break;
			}
		}

		if(inputs.username && inputs.password) {
			candidates.push(inputs);
			continue;
		}
		else if(allow_password_only && inputs.password) {
			candidates.push(inputs);
			continue;
		}
	}

	for(var candidate_idx=0; candidate_idx < candidates.length; candidate_idx++) {
		var inputs = candidates[candidate_idx];

		if(inputs.password === document.activeElement || inputs.username === document.activeElement) {
			console.log("passafari_input_candidates: using focused fields.")
			candidates = [ inputs ];
			break;
		}
	}

	return candidates;
}