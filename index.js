const async = require("async");
const zlib = require("zlib");

function generateString(length) {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnoprqstuvwxyz0123456789";

	let string = "";
	for (let i = 0; i < length; i++) {
		string += chars[Math.floor(Math.random() * chars.length)];
	}

	return string;
}

function runTest(size, run, cb) {
	const printLogs = run === runs - 1;
	
	printLogs ? console.log("=======================================") : ""
	printLogs ? console.log("running last test with size", size) : "";

	const key = generateString((size / 2) - 4);
	const value = generateString((size / 2) - 3);
	const json = {
		[key]: value
	}
	
	printLogs ? console.time("stringify") : "";
	const stringified = JSON.stringify(json);
	printLogs ? console.timeEnd("stringify") : "";

	printLogs ? console.time("deflate async") : "";
	zlib.deflate(stringified, (err, buff) => {
		if (err) {
			cb(err);
			return;
		}
		printLogs ? console.timeEnd("deflate async") : "";

		printLogs ? console.time("inflate async") : "";
		zlib.inflate(buff, (err, res) => {
			if (err) {
				cb(err);
				return;
			}
			printLogs ? console.timeEnd("inflate async") : "";

			try {
				printLogs ? console.time("deflate sync") : "";
				const deflated = zlib.deflateSync(stringified);
				printLogs ? console.timeEnd("deflate sync", deflated) : "";

				printLogs ? console.time("inflate sync") : "";
				const inflated = zlib.inflateSync(deflated);
				printLogs ? console.timeEnd("inflate sync") : "";

				cb();
			} catch (err) {
				cb(err);
			}
		});
	});
}

const runs = 1000;
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