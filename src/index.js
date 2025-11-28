/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

const re = /^(http[s]?:\/\/)?([\w-]+\.)+[\w-]+(:\d+)?/i
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'

const exclude = require('./exclude.json');


/**
 * example
 * 	{HOST}/https://api.ip.sb/geoip/
 *	{HOST}/https://github.com/clash-verge-rev/clash-verge-rev/releases/download/v2.4.3/Clash.Verge_2.4.3_x64-setup.exe
 */
/**
 *
 * @param {Request} request
 * @param {*} env
 * @param {*} ctx
 * @returns
*/
async function handle(request, env, ctx) {
	for (const key of exclude) {
		try {
			if (request.url.includes(key) || request.url.match(key)) {
				return new Response(null, { status: 404 });
			}
		} catch (error) {

		}
	}

	console.log(request.url);

	const reqUrl = new URL(request.url)
	if (request.headers) {
		console.log("原headers:")
		for (const [key, value] of request.headers.entries()) {
			console.log(`${key}: ${value}`);
		}

	}
	let pathBase = reqUrl.href.substring(reqUrl.origin.length + 1)
	if (re.test(pathBase)) {
		if (!pathBase.startsWith("http")) {
			pathBase = `https://${pathBase}`;
		}
		const toUrl = new URL(pathBase)

		const proxyRequest = new Request(toUrl, {
			method: request.method,
			body: request.body,
			referrer: request.referrer
		});
		if (request.headers.has('Referer')) {
			proxyRequest.headers.set('Referer', request.headers.get('Referer'));
		} else {
			proxyRequest.headers.set('Referer', toUrl.origin + '/');
		}
		if (request.headers.has('Origin')) {
			proxyRequest.headers.set('Origin', request.headers.get('Origin'));
		} else {
			proxyRequest.headers.set('Origin', toUrl.origin);
		}

		if (request.headers.has('Host')) {
			proxyRequest.headers.set('Host', request.headers.get('Host'));
		} else {
			proxyRequest.headers.set('Host', toUrl.host);
		}
		proxyRequest.headers.set('User-Agent', userAgent)
		proxyRequest.headers.set('accept', "*/*")
		proxyRequest.headers.set('accept-encoding', "gzip, deflate, br, zstd")
		proxyRequest.headers.set('accept-language', "zh-CN,zh;q=0.9,en;q=0.8")

		console.log("转headers:")
		for (const [key, value] of proxyRequest.headers.entries()) {
			console.log(`${key}: ${value}`);
		}

		console.log(toUrl.toString())
		try {
			return fetch(proxyRequest);
		} catch (error) {
			console.log(error);

			return new Response(error, {
				status: 400,
				headers: {
					'Content-Type': 'text/plain; charset=utf8'
				}
			});
		}


	}
	// return new Response("Hello")
	return new Response('未能匹配到转义URL', {
		status: 400,
		headers: {
			'Content-Type': 'text/plain; charset=utf8'
		}
	});

}

export default {
	fetch: handle
}
