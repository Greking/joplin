require('source-map-support').install();
require('babel-plugin-transform-runtime');

import fs from 'fs-extra';
import { fileExtension, basename, dirname } from 'lib/path-utils.js';
import wrap_ from 'word-wrap';
import { _, setLocale, languageCode } from 'lib/locale.js';

const rootDir = dirname(dirname(__dirname));
const MAX_WIDTH = 78;
const INDENT = '    ';

function wrap(text, indent) {
	return wrap_(text, {
		width: MAX_WIDTH - indent.length,
		indent: indent,
	});
}

function renderOptions(options) {
	let output = [];
	const optionColWidth = getOptionColWidth(options);

	for (let i = 0; i < options.length; i++) {
		let option = options[i];
		const flag = option[0];
		const indent = INDENT + INDENT + ' '.repeat(optionColWidth + 2);
		
		let r = wrap(option[1], indent);
		r = r.substr(flag.length + (INDENT + INDENT).length);
		r = INDENT + INDENT + flag + r;
		output.push(r);
	}

	return output.join("\n");
}

function renderCommand(cmd) {
	let output = [];
	output.push(INDENT + cmd.usage());
	output.push('');
	output.push(wrap(cmd.description(), INDENT + INDENT));

	const optionString = renderOptions(cmd.options());

	if (optionString) {
		output.push('');
		output.push(optionString);
	}
	return output.join("\n");
}

function getCommands() {
	let output = [];
	fs.readdirSync(__dirname).forEach((path) => {
		if (path.indexOf('command-') !== 0) return;
		const ext = fileExtension(path)
		if (ext != 'js') return;

		let CommandClass = require('./' + path);
		let cmd = new CommandClass();
		if (!cmd.enabled()) return;
		output.push(cmd);
	});
	return output;
}

function getOptionColWidth(options) {
	let output = 0;
	for (let j = 0; j < options.length; j++) {
		const option = options[j];
		if (option[0].length > output) output = option[0].length;
	}
	return output;
}

function getHeader() {
	let output = [];

	output.push(_('NAME'));
	output.push('');
	output.push(wrap(_('joplin - a note taking and todo app with synchronisation capabilities'), INDENT));

	output.push('');

	output.push(_('DESCRIPTION'));
	output.push('');

	let description = [];
	description.push(_('Joplin is a note taking and todo application, which can handle a large number of notes organised into notebooks.'));
	description.push(_('The notes are searchable, can be copied, tagged and modified with your own text editor.'));
	description.push("\n\n");
	description.push(_('The notes can be synchronised with various target including the file system (for example with a network directory) or with Microsoft OneDrive.'));
	description.push("\n\n");
	description.push(_('Notes exported from Evenotes via .enex files can be imported into Joplin, including the formatted content, resources (images, attachments, etc.) and complete metadata (geolocation, updated time, created time, etc.).'));

	output.push(wrap(description.join(''), INDENT));

	return output.join("\n");
}

function getFooter() {
	let output = [];

	output.push(_('WEBSITE'));
	output.push('');
	output.push(INDENT + 'https://joplin.cozic.net');

	output.push('');

	output.push(_('LICENSE'));
	output.push('');
	let filePath = rootDir + '/LICENSE_' + languageCode();
	if (!fs.existsSync(filePath)) filePath = rootDir + '/LICENSE';
	const licenseText = fs.readFileSync(filePath, 'utf8');
	output.push(wrap(licenseText, INDENT));

	return output.join("\n");
}

async function main() {
	// setLocale('fr_FR');

	const commands = getCommands();
	let commandBlocks = [];

	for (let i = 0; i < commands.length; i++) {
		let cmd = commands[i];
		commandBlocks.push(renderCommand(cmd));
	}

	const headerText = getHeader();
	const commandsText = commandBlocks.join("\n\n");
	const footerText = getFooter();

	console.info(headerText + "\n\n" + _('USAGE') + "\n\n" + commandsText + "\n\n" + footerText);
}

main().catch((error) => {
	console.error(error);
});