console.log('passafari: end.js');

var passafari_injected_end;

function passafari_injected_message_handler(event) {
	var name = event.name;
	var data = event.message;

	console.log("passafari_injected_message_handler: " + name);

	if(name === "credentials") {
		passafari_injected_credentials_handler(name, data);
	}

	return undefined;
};

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

if(!passafari_injected_end && window.parent === window) {
	console.log('passafari: passafari_injected_end');
	safari.self.addEventListener("message", passafari_injected_message_handler, false);
	passafari_injected_end = true;
}

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

	return candidates;
}