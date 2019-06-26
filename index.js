const async = require("async");
const zlib = require("zlib");
const performance = require("perf_hooks").performance;
const percentile = require("percentile");

function generateString(length) {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnoprqstuvwxyz0123456789";

	let string = "";
	for (let i = 0; i < length; i++) {
		string += chars[Math.floor(Math.random() * chars.length)];
	}

	return string;
}

const times = {};

function runTestASync(size, cb) {
	if (!times[size]) {
		times[size] = {};
		times[size].stringify = [];
		times[size].deflate_async = [];
		times[size].inflate_async = [];
		times[size].deflate_sync = [];
		times[size].inflate_sync = [];
	}

	const key = generateString((size / 2) - 4);
	const value = generateString((size / 2) - 3);
	const json = {
		[key]: value
	}

	const t_stringify = performance.now();
	const stringified = JSON.stringify(json);
	const t_stringify_end = performance.now();

	times[size].stringify.push(t_stringify_end - t_stringify);

	const t_deflate_async = performance.now();
	zlib.deflate(stringified, (err, buff) => {
		if (err) {
			cb(err);
			return;
		}
		const t_deflate_async_end = performance.now();

		times[size].deflate_async.push(t_deflate_async_end - t_deflate_async);
		
		const t_inflate_async = performance.now();
		zlib.inflate(buff, (err, res) => {
			if (err) {
				cb(err);
				return;
			}
			const t_inflate_async_end = performance.now();

			times[size].inflate_async.push(t_inflate_async_end - t_inflate_async);

			cb();
		});
	});
}

function runTestSync(size, cb) {
	const key = generateString((size / 2) - 4);
	const value = generateString((size / 2) - 3);
	const json = {
		[key]: value
	}
	
	const stringified = JSON.stringify(json);

	try {
		const t_deflate_sync = performance.now();
		const deflated = zlib.deflateSync(stringified);
		const t_deflate_sync_end = performance.now();

		times[size].deflate_sync.push(t_deflate_sync_end - t_deflate_sync);
		
		const t_inflate_sync = performance.now();
		const inflated = zlib.inflateSync(deflated);
		const t_inflate_sync_end = performance.now();

		times[size].inflate_sync.push(t_inflate_sync_end - t_inflate_sync);

		cb();
	} catch (err) {
		cb(err);
	} 
}

const runs = 10000;
runTests(runs);
// [500, 1000, 2000, 4000, 8000, 16000, 32000, 64000]
async function runTests(runs) {
	const sizes = [500, 1000, 2000, 4000, 8000, 16000, 32000, 64000];

	console.time("10k runs async");
	async.eachLimit(sizes, 1, (item, next) => {
		const parallel_limit = process.env.UV_THREADPOOL_SIZE || 4;

		async.timesLimit(runs, parallel_limit, (run, runCb) => {
			runTestASync(item, (err) => {
				if (err) {
					runCb(err);
					return;
				}

				runCb();
			});
		}, (err) => {
			if (err) {
				next(err);
				return;
			}

			next();
		});
	}, (err) => {
		if (err) {
			console.error(err);
			return;
		}
		console.timeEnd("10k runs async");
		
		console.time("10k runs sync");
		async.timesLimit(runs, 1, (run, next) => {
			async.eachLimit(sizes, 1, (item, cb) => {
				runTestSync(item, (err) => {
					if (err) {
						cb(err);
						return;
					}

					cb();
				})
			}, (err) => {
				if (err) {
					next(err);
					return;
				}

				next();
			});
		}, (err) => {
			if (err) {
				console.error(err);
				return;
			}
			console.timeEnd("10k runs sync");

			console.log("done running all tests");
	
			for (let i = 0; i < sizes.length; i++) {
				console.log("==============================");
				console.log("current size:", sizes[i]);
				console.log("stringify:", percentile(99, times[sizes[i]].stringify) + "ms");
				console.log("deflate async:", percentile(99, times[sizes[i]].deflate_async) + "ms");
				console.log("inflate async:", percentile(99, times[sizes[i]].inflate_async) + "ms");
				console.log("deflate sync:", percentile(99, times[sizes[i]].deflate_sync) + "ms");
				console.log("inflate sync:", percentile(99, times[sizes[i]].inflate_sync) + "ms");
			}
		});
	});
}