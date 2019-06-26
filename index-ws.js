const async = require("async");
const zlib = require("zlib");
const performance = require("perf_hooks").performance;
const percentile = require("percentile");
const express = require("express");
const morgan = require("morgan");
const app = express();
const port = 3000;

app.use(morgan("dev"));

app.get('/', (req, res) => res.send('Hello World!'));
app.get('/json', (req, res) => res.json(times));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

function generateString(length) {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnoprqstuvwxyz0123456789";

	let string = "";
	for (let i = 0; i < length; i++) {
		string += chars[Math.floor(Math.random() * chars.length)];
	}

	return string;
}

const times = {};
function runTest(size, run, cb) {
	if (run === 0) {
		times[size] = {};
		times[size].stringify = [];
		times[size].deflate_async = [];
		times[size].inflate_async = [];
		times[size].deflate_sync = [];
		times[size].inflate_sync = [];
	}
	const printLogs = run === runs - 1;

	printLogs ? console.log("=======================================") : ""
	printLogs ? console.log("running last test with size", size) : "";

	const key = generateString((size / 2) - 4);
	const value = generateString((size / 2) - 3);
	const json = {
		[key]: value
	}
	
	const t_stringify = performance.now();
	const stringified = JSON.stringify(json);
	const t_stringify_end = performance.now();

	times[size].stringify.push(t_stringify_end - t_stringify);
	printLogs ? console.log("99th percentile stringify:", Math.round(percentile(99, times[size].stringify) * 1000) / 1000 + "ms") : "";


	try {
		const t_deflate_sync = performance.now();
		const deflated = zlib.deflateSync(stringified);
		const t_deflate_sync_end = performance.now();

		times[size].deflate_sync.push(t_deflate_sync_end - t_deflate_sync);
		printLogs ? console.log("99th percentile deflate_sync:", Math.round(percentile(99, times[size].deflate_sync) * 1000) / 1000 + "ms") : "";
		
		const t_inflate_sync = performance.now();
		const inflated = zlib.inflateSync(deflated);
		const t_inflate_sync_end = performance.now();

		times[size].inflate_sync.push(t_inflate_sync_end - t_inflate_sync);
		printLogs ? console.log("99th percentile inflate_sync:", Math.round(percentile(99, times[size].inflate_sync) * 1000) / 1000 + "ms") : "";

		cb();
	} catch (err) {
		cb(err);
	}
}

const runs = 10000;
runTests(runs);
// [500, 1000, 2000, 4000, 8000, 16000, 32000, 64000]
async function runTests(runs) {
	async.timesLimit(runs, 1, (run, next) => {
		async.eachLimit([500, 1000, 2000, 4000, 8000, 16000, 32000, 64000], 1, (n, cb) => {
			runTest(n, run, (err) => {
				if (err) {
					cb(err);
					return;
				}
	
				cb();
			});
		}, (err) => {
			if (err) {
				next(err);
				return;
			}
	
			next(null);
		});
	}, (err, msg) => {
		if (err) {
			console.error(err);
			return;
		}

		console.log("done running all tests");
	});
}