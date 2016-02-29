# passafari.safariextension

Extensions to allow Safari to auto form-fill passwords via KeePassHTTP.

TODO write some useful stuff.

## Installation

1. Download `passafari` repo
2. Sign up to be a Safari Dev
2. Obtain a cert: https://developer.apple.com/membercenter/index.action
3. Activate Develop menu in Safari (Safari > Preferences > Advanced)
4. Select menu item: Develop > Show Extension Builder
5. Add extension and choose the directory where you've extracted `passafari` repo
6. Click `install` to install the extension 

## Usage

TODO write some useful stuff.

### Symbolic Meaning

- **Fill-In**: ![font-awesome-pencil-square-o](https://raw.githubusercontent.com/mmichaa/passafari.safariextension/master/images/font-awesome-pencil-square-o.png)
- **Update**: ![font-awesome-floppy-o](https://raw.githubusercontent.com/mmichaa/passafari.safariextension/master/images/font-awesome-floppy-o.png)
- **Add**: ![font-awesome-plus-square-o](https://raw.githubusercontent.com/mmichaa/passafari.safariextension/master/images/font-awesome-plus-square-o.png)

## Settings

- **Hostname & Port**: TODO write some useful stuff.
- **URL-Format**: TODO write some useful stuff.
- **Submit-URL-Format**: TODO write some useful stuff.
- **Language**: TODO write some useful stuff.

## Features

- [X] Associate with KeePassHTTP
- [X] Retrieve credentials
  - [X] Support for single match
  - [X] Support for multiple matches
- [X] Add new credentials
  - [X] Use password generator on empty password
  - [X] Support where none matches
  - [X] Support where one or more matches
- [X] Update existing credentials
  - [X] Use password generator on empty password
  - [X] Support where one matches
  - [X] Support where more matches
- [X] Settings for hostname and port
- [X] Setting for language
  - [X] I18n support
  - [X] Translate into german
- [X] Fill-in password
  - [X] Forms with one password field only
  - [X] Forms with two password fields only
- [X] Setting for host-only URL on add/update
- [X] Setting for protocol-host-path-only Submit-URL on add/update
- [ ] Setting for auto-submit after fill-in
  - [ ] Auto submit form after fill-in
- [ ] Setting for auto fill-in
  - [ ] Auto fill-in credentialson page visit

## Credits

- Thanks to [SlowAES](https://code.google.com/p/slowaes/) for aes.js, cryptoHelpers.js and jsHash.js
- Thanks to [pfn/passifox](https://github.com/pfn/passifox/) for keepass.js
- Thanks to [webtoolkit.info](http://www.webtoolkit.info/javascript-utf8.html) for utf8.js
- Thanks to [eligrey/l10n.js](https://github.com/eligrey/l10n.js) for l10n.js
- Thanks to [stackoverflow.com](http://stackoverflow.com/a/728694/888294) for clone.js
- Thanks to [FortAwesome/Font-Awesome](https://github.com/FortAwesome/Font-Awesome) for some icons
- Thanks to [mstarke/MacPass](https://github.com/mstarke/MacPass) for MacPass.app

## Contributing

1. Fork it
2. Create your feature branch _(git checkout -b my-new-feature)_
3. Commit your changes _(git commit -am 'Add some feature')_
4. Push to the branch _(git push origin my-new-feature)_
5. Create new Pull Request
