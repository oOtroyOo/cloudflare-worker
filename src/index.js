/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	/**
	 *
	 * @param {Request} request
	 * @param {*} env
	 * @param {*} ctx
	 * @returns
	 */
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		let splitIndex = url.pathname.indexOf('/', 1)
		if (splitIndex < 0) {
			splitIndex = url.pathname.length
		}
		let host1 = url.pathname.substring(1, splitIndex)
		if (/^([\w\-_]+\.)+[\w\-_]+/i.test(host1)) {

			url.port = 443
			url.protocol = "https:"
			url.hostname = host1;
			url.pathname = url.pathname.substring(splitIndex)

			const proxyRequest = new Request(url, request);
			if (request.headers.has('Referer')) {
				proxyRequest.headers.set('Referer', request.headers.get('Referer'));
			} else {
				proxyRequest.headers.set('Referer', `https://${host1}/`);
			}

			console.log(url.toString())
			return fetch(proxyRequest);

		}
		return new Response("Hello")
	},
};
