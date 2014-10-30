console.log('passafari: end.js');

function passafari_injected_message_handler(event) {
	var name = event.name;
	var data = event.message;

	console.log("passafari_injected_message_handler: " + name);

	if(name === "passafari_credentials") {
		passafari_injected_credentials_handler(name, data);
	} else if(name === "passafari_retrieve") {
		passafari_injected_retrieve_handler(name, data);
	} else {
		console.log(data);
	}

	return undefined;
}

if(window.parent === window) {
	console.log('passafari: window.top');
	safari.self.addEventListener("message", passafari_injected_message_handler, false);
}

// CALLED by passafari_injected_message_handler
function passafari_injected_credentials_handler(event_name, event_data) {
	if(event_data.length === 1) {
		var credentials = event_data[0];
		var input_candidates = passafari_input_candidates();

		if(input_candidates.length === 1) {
			var inputs = input_candidates[0];

			inputs.username.value = credentials.Login;
			inputs.password.value = credentials.Password;
		} else {
			console.log("passafari_injected_credentials_handler: more than one inputs found.")
			console.log(inputs);
		}
	} else {
		console.log("passafari_injected_credentials_handler: more than one credentials found.")
		console.log(event_data);
	}

	return undefined;
}

// CALLED by passafari_injected_message_handler
function passafari_injected_retrieve_handler(event_name, event_data) {
	var input_candidates = passafari_input_candidates();

	if(input_candidates.length === 1) {
		var inputs = input_candidates[0];

		var username = inputs.username.value;
		var password = inputs.password.value;

		passafari_notify_global_page("passafari_save", {"Login": username, "Password": password});
	} else {
		console.log("passafari_injected_retrieve_handler: more than one inputs found.")
		console.log(inputs);
	}

	return undefined;
}

// UTILS end.js related
function passafari_notify_global_page(msg_name, msg_data) {
	safari.self.tab.dispatchMessage(msg_name, msg_data);
	return undefined;
}

// UTILS end.js related
function passafari_input_candidates() {
	var candidates = [];

	for(var form_idx=0; form_idx < document.forms.length; form_idx++) {
		var form = document.forms[form_idx];

		if(form.method.toLowerCase() === "get") {
			continue;
		}

		var inputs = { "username": undefined, "password": undefined };

		for(var elem_idx=0; elem_idx < form.elements.length; elem_idx++) {
			var elem = form.elements[elem_idx];

			if(elem.disabled || elem.readOnly) {
				continue;
			}

			var elem_type = elem.type.toLowerCase();

			if(elem_type === "password") {
				inputs["password"] = elem;
			}
			else if(elem_type === 'email' || elem_type === 'text') {
				inputs["username"] = elem;
			}

			if(inputs["username"] && inputs["password"]) {
				candidates.push(inputs);
				break;
			}
		}
	}

	for(var candidate_idx=0; candidate_idx < candidates.length; candidate_idx++) {
		var inputs = candidates[candidate_idx];

		if (inputs.username === document.activeElement || inputs.password === document.activeElement) {
			console.log("passafari_input_candidates: using focused fields.")
			candidates = [ inputs ];
			break;
		}
	}

	return candidates;
}