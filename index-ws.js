const async = require("async");
const zlib = require("zlib");
const performance = require("perf_hooks").performance;
const express = require("express");
const morgan = require("morgan");
const app = express();
const server = require("http").createServer(app);
const port = 3000;

// app.use(morgan("dev"));
app.use(express.json());

app.post('/', (req, res) => {
	res.status(200).send(JSON.stringify(req.body));
});

app.post('/json', (req, res) => {
	try {
		const data = JSON.stringify(req.body);

		const deflated = zlib.deflateSync(data);
		const inflated = zlib.inflateSync(deflated);

		res.send(inflated);
		// deflate content
		/* zlib.deflate(data, (err, deflated) => {
			if (err) {
				console.error(err);
				return;
			}

			// inflate content
			zlib.inflate(deflated, (err, inflated) => {
				if (err) {
					console.error(err);
					return;
				}

				res.send(inflated);
			});
		}); */
	} catch (err) {
		res.status(500).send(err);
	}
});

server.listen(port, () => console.log(`Example app listening on port ${port}!`));
/* setInterval(() => {
	server.getConnections((err, count) => {
		if (err) {
			console.error(err);
			return;
		}

		console.log("connections:", count);
	});
}, 1000); */
