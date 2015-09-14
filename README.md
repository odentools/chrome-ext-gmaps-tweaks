# GMaps-Tweaks for Chrome

An Chrome extension which bring fairy for Google Maps

## Features

* Attach a searched route to an event of Google Calendar
* I'm thinking now... please post an request.

## Install from Chrome Web Store

Coming soon...

## Install from Package File (.crx)

1. Download the package file (.crx) from releases page: https://github.com/odentools/odenwlan-node/releases/latest
1. Open the extension page **chrome://extensions/** in your chrome/chromium browser.
1. Drag & drop the downloaded file (e.g. chrome-ext-gmaps-tweaks-vX.Y.Z.crx) to the extensions page.
1. The GMaps-Tweaks section will be shown on the extensions page.
1. Open the **Options** page from that section, and finish the sign-in with your Google Account in shown page.
1. Your calendars will be shown on the Option page. You must choose at least one or all calendars; of course all choose is also ok.
1. All was done! Let open the Google Maps. And try get a direction for any place.

## How to develop

Required:

* Git v2.5 or compatible version
* Node v0.12 or compatible version

### 1. Clone a repository of the extension

Firstly, run the following commands in your terminal.

	$ git clone https://github.com/odentools/chrome-ext-gmaps-tweaks.git
	$ cd chrome-ext-gmaps-tweaks/
	$ npm install

In this guide, that extracted directory is called *project directory*.

### 2. Load the extension to browser

Please open extension page **chrome://extensions/** in your chrome/chromium browser. And turn on the *"Developer mode"* in extensions page.

Then, click the *"Load unpacked extension"* button, and choose the project directory.

After that, please remember the *ID* (e.g.  bdpnieppceomkofeemaobdnfihknokji) of just loaded extension.

### 3. Register to Google Developers Console

Firstly, Open the **[Google Developers Console](https://console.developers.google.com/project)** in your browser.
If you never signed up for it, you must complete the sign-up process.

Secondly, make a new project with using *"Create Project"* button.
In "Project name" field of **"New Project"** dialog, you can use any name -- e.g. my-chrome-ext-gmap.

Nextly, open **"APIs & auth" -> "APIs"** page.
You must enable the *"Google Calendar API"* in there.

Then, open **"Credentials"** page.
And please follow these steps.

1. Click *"Add credentials"* button.
1. Choose *"OAuth 2.0 client ID"*
1. In **"Create client ID"** section:
	1. Choose *"Chrome App"*.
	1. Input *"Name*" field: e.g. "chrome-ext-gmaps-tweaks"
	1. Input *"Application ID"* field: Paste the extension's ID that you obtained at step-2.
	1. Click *"Create"* button.

After that, the page shown the *"Client ID"*. You must remember that ID.

### 4. Edit manifest.json

Please open **manifest.json** of project directory in your text editor.

Then, replace a value of *"oauth2" -> "client_id"* field with the Client ID which obtained in step-2.


Example:
```json
"oauth2": {
	"client_id": "XYZ.apps.googleusercontent.com",
	"scopes": [
		"https://www.googleapis.com/auth/calendar"
	]
}
```

### 5. Complete

Please open the Options page in extensions page (**chrome://extensions/**).

Then, Open the **Options** page from GMaps-Tweaks section, and finish the sign-in with your Google Account in shown page.

Now you can develop this extension.

# License

```
The MIT License (MIT).
Copyright (c) 2015 OdenTools Project.
```

Please see [LICENSE](https://github.com/odentools/chrome-ext-gmaps-tweaks/blob/master/LICENSE) for details.
