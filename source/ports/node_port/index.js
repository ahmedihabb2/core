/*
 *	MetaCall NodeJS Port by Parra Studios
 *	A complete infrastructure for supporting multiple language bindings in MetaCall.
 *
 *	Copyright (C) 2016 - 2022 Vicente Eduardo Ferrer Garcia <vic798@gmail.com>
 *
 *	Licensed under the Apache License, Version 2.0 (the "License");
 *	you may not use this file except in compliance with the License.
 *	You may obtain a copy of the License at
 *
 *		http://www.apache.org/licenses/LICENSE-2.0
 *
 *	Unless required by applicable law or agreed to in writing, software
 *	distributed under the License is distributed on an "AS IS" BASIS,
 *	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *	See the License for the specific language governing permissions and
 *	limitations under the License.
 *
 */

'use strict';

const mod = require('module');
const path = require('path');
const { URL } = require('url'); /* TODO: RPC Loader */

const addon = (() => {
	try {
		/* This forces metacall port to be run always by metacall cli */
		return process._linkedBinding('node_loader_port_module');
	} catch (e) {
		console.error('MetaCall failed to load, probably you are importing this file from NodeJS directly.');
		console.error('You should use MetaCall CLI instead. Install it from: https://github.com/metacall/install');
		throw e;

		/* TODO: Until we find a better way to do this, we should disable it */
		/*
		const write = (data, cb) => {
			if (!process.stdout.write(data)) {
				process.stdout.once('drain', cb);
			} else {
				process.nextTick(cb);
			}
		};

		// Notify synchronously that we are launching MetaCall
		write('NodeJS detected, launching MetaCall...\n', () => {
			try {
				const { spawnSync } = require('child_process');
				const args = [...process.argv];

				args.shift();

				const result = spawnSync('metacall', args, {});

				if (result.error && result.error.code === 'ENOENT') {
					write('MetaCall not found. Please install MetaCall from: https://github.com/metacall/install and run it again.\n', () => {
						process.exit(1);
					});
				}

				process.exit(result.status !== null ? result.status : 1);
			} catch (e) {
				const message = 'MetaCall failed to load, probably you are importing this file from NodeJS directly.\n'
					+ e.message + '\n'
					+ 'Install MetaCall from: https://github.com/metacall/install and run it again.\n';

				write(message, () => {
					throw e;
				});
			}
		});
		*/
	}
})();

const metacall = (name, ...args) => {
	if (Object.prototype.toString.call(name) !== '[object String]') {
		throw Error('Function name should be of string type.');
	}

	return addon.metacall(name, ...args);
};

const metacall_await = (name, ...args) => {
	if (Object.prototype.toString.call(name) !== '[object String]') {
		throw Error('Function name should be of string type.');
	}

	return addon.metacall_await(name, ...args);
};

const metacall_load_from_file = (tag, paths) => {
	if (Object.prototype.toString.call(tag) !== '[object String]') {
		throw Error('Tag should be a string indicating the id of the loader to be used [py, rb, cs, js, node, mock...].');
	}

	if (!(paths instanceof Array)) {
		throw Error('Paths should be an array with file names and paths to be loaded by the loader.');
	}

	return addon.metacall_load_from_file(tag, paths);
};

const metacall_load_from_file_export = (tag, paths) => {
	if (Object.prototype.toString.call(tag) !== '[object String]') {
		throw Error('Tag should be a string indicating the id of the loader to be used [py, rb, cs, js, node, mock...].');
	}

	if (!(paths instanceof Array)) {
		throw Error('Paths should be an array with file names and paths to be loaded by the loader.');
	}

	return addon.metacall_load_from_file_export(tag, paths);
};

const metacall_load_from_memory = (tag, code) => {
	if (Object.prototype.toString.call(tag) !== '[object String]') {
		throw Error('Tag should be a string indicating the id of the loader to be used [py, rb, cs, js, node, mock...].');
	}

	if (Object.prototype.toString.call(code) !== '[object String]') {
		throw Error('Code should be a string with the inline code to be loaded.');
	}

	return addon.metacall_load_from_memory(tag, code);
};

const metacall_load_from_memory_export = (tag, code) => {
	if (Object.prototype.toString.call(tag) !== '[object String]') {
		throw Error('Tag should be a string indicating the id of the loader to be used [py, rb, cs, js, node, mock...].');
	}

	if (Object.prototype.toString.call(code) !== '[object String]') {
		throw Error('Code should be a string with the inline code to be loaded.');
	}

	return addon.metacall_load_from_memory_export(tag, code);
};

const metacall_load_from_configuration = (path) => {
	if (Object.prototype.toString.call(path) !== '[object String]') {
		throw Error('Path should be a string indicating the path where the metacall.json is located.');
	}

	return addon.metacall_load_from_configuration(path);
};

const metacall_load_from_configuration_export = (path) => {
	if (Object.prototype.toString.call(path) !== '[object String]') {
		throw Error('Path should be a string indicating the path where the metacall.json is located.');
	}

	return addon.metacall_load_from_configuration_export(path);
};

const metacall_inspect = () => {
	const json_data = addon.metacall_inspect();

	if (json_data !== undefined) {
		const json = JSON.parse(json_data);

		delete json['__metacall_host__'];

		return json;
	}

	return {};
};

const metacall_handle = (tag, name) => {
	// TODO: This can be implemented with metacall_handle C API, meanwhile we use this trick
	const inspect = metacall_inspect();

	if (inspect === {} || inspect === undefined) {
		return null;
	}

	const ctx = inspect[tag];

	if (ctx === undefined) {
		return null;
	}

	return ctx.find(script => script.name === name);
};

const metacall_require = (tag, name) => {
	return addon.metacall_load_from_file_export(tag, [ name ]);
};

/* Module exports */
const module_exports = {
	metacall,
	metacall_await,
	metacall_inspect,
	metacall_load_from_file,
	metacall_load_from_file_export,
	metacall_load_from_memory,
	metacall_load_from_memory_export,
	metacall_load_from_configuration,
	metacall_load_from_configuration_export,
	metacall_handle,

	/* TODO: Remove this from user or provide better ways of configuring logs */
	metacall_logs: () => {
		addon.metacall_logs();
	},
};

/* Monkey patch require for simplifying load */
const node_require = mod.prototype.require;

/* File Extension -> Tag */
const file_extensions_to_tag = {
	/* Mock Loader */
	mock: 'mock',
	/* Python Loader */
	py: 'py',
	/* Ruby Loader */
	rb: 'rb',
	/* C# Loader */
	cs: 'cs',
	vb: 'cs',
	/* Cobol Loader */
	cob: 'cob',
	cbl: 'cob',
	cpy: 'cob',
	/* NodeJS Loader */
	js: 'node',
	node: 'node', /* TODO: Load by package on node is not implemented or it is unnecesary */
	/* WebAssembly Loader */
	wat: 'wasm',
	/* TypeScript Loader */
	ts: 'ts',
	jsx: 'ts',
	tsx: 'ts',
	/* Rust Loader */
	rs: 'rs',

	/* Note: By default js extension uses NodeJS loader instead of JavaScript V8 */
	/* Probably in the future we can differenciate between them, but it is not trivial */
};

/* Package Extension -> Tag */
const package_extensions_to_tag = {
	/* C# Loader */
	dll: 'cs',
	/* WebAssembly Loader */
	wasm: 'wasm',
	/* Rust Loader */
	rlib: 'rs',
};

/* Set containing all tags */
const available_tags = new Set([...Object.values(file_extensions_to_tag), ...Object.values(package_extensions_to_tag)]);

/* Override require */
mod.prototype.require = function (name) {

	// TODO:
	// /* Check if the module is an URL */
	// try {
	// 	const { origin, pathname } = new URL(name);

	// 	return metacall_load_from_memory('rpc', origin + pathname); // TODO: Load from memory with RPC loader and get the exports from the handle
	// } catch (e) {
	// 	/* Continue loading */
	// }

	/* Try to load by extension: require('./script.py') */
	const extension = path.extname(name);

	if (extension !== '') {
		/* If there is extension, load the module depending on the tag */
		const ext = extension.substring(1)
		const file_tag = file_extensions_to_tag[ext];

		if (file_tag && file_tag !== 'node') {
			/* Load with MetaCall if we found a file tag and it is not NodeJS */
			return metacall_require(file_tag, name);
		}

		const package_tag = package_extensions_to_tag[ext];

		if (package_tag && package_tag !== 'node') {
			/* Load with MetaCall if we found a package tag and it is not NodeJS */
			/* TODO: return metacall_require_package(package_tag, name); */
			throw new Error(`Cannot load ${name} because MetaCall NodeJS Port has not implemented load from package function`);
		}
	}

	/* Try to load by tag prefix: require('py:ctypes') */
	const require_substrings = name.split(':');

	if (require_substrings.length >= 2) {
		const prefix_tag = require_substrings[0];

		if (available_tags.has(prefix_tag) && prefix_tag !== 'node') {
			/* Load with MetaCall if we found a file tag and it is not NodeJS */
			return metacall_require(prefix_tag, require_substrings[1]);
		}
	}

	/* Try NodeJS */
	return node_require.apply(this, [ name ]);
};

/* Debug logs */
if (process.env['NODE_ENV'] === 'debug' && addon !== undefined) {
	addon.metacall_logs();
}

/* Export the API */
module.exports = module_exports;
