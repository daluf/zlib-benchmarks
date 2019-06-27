const request = require("request");
const url = "http://localhost:3000";
const performance = require("perf_hooks").performance;
const http = require("http");
const async = require("async");

let connections = [];
let connectionTimes = [];
const connectionAmount = 1500;
const runs = 10;

function generateString(length) {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnoprqstuvwxyz0123456789";

	let string = "";
	for (let i = 0; i < length; i++) {
		string += chars[Math.floor(Math.random() * chars.length)];
	}

	return string;
}

function createKeyValueStringifiedJSON(size) {
	const key = generateString((size / 2) - 4);
	const value = generateString((size / 2) - 3);
	const json = {
		[key]: value
	}

	return json;
}

function doRequest(url) {
	const startTime = performance.now();
	return new Promise(function (resolve, reject) {
		http.get(url, (resp) => {
			let data = "";

			resp.on("data", (chunk) => {
				data += chunk;
			});

			resp.on("end", () => {
				connectionTimes.push(performance.now() - startTime);
				finishedRequests++;
				successRequests++;
				resolve(data);
			});
		}).on("error", (err) => {
			finishedRequests++;
			failedRequests++;
			reject(err);
		});
	});
}

function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms, true);
	});
}

let finishedRequests = 0;
let successRequests = 0;
let failedRequests = 0;

async function main() {
	const startTime = Date.now();

	async.timesSeries(runs, (run, next) => {
		async.times(connectionAmount, async (item, callback) => {
			await doRequest(url).then(() => { callback(); }).catch(() => { callback(); });
		}, (err) => {
			console.log(finishedRequests);
			next();
		});
	}, () => {
		const endTime = Date.now();

		console.log("start", startTime);
		console.log("end", endTime);
		console.log("total requests", finishedRequests);
		console.log("succeeded requests", successRequests);
		console.log("failed requests", failedRequests);
		console.log("requests per second", finishedRequests / ((endTime - startTime) / 1000));
		console.log("average response time", connectionTimes.reduce((a, b) => { return a + b; }) / finishedRequests);
	});
}
main().catch((err) => {
	console.error(err);
	process.exit(1);
});
