export default class BaseHandle {

    /**
     *
     * @param {string} urlBase
     * @returns {boolean}
     */
    test(urlBase) {
        this.lastTestUrl = urlBase
        return false
    }
    /**
     *
     * @param {Request} request
     * @param {Cloudflare.Env} env
     * @param {ExecutionContext} ctx
     * @returns {Promise<Response>}
    */
    async handle(request, env, ctx) {
        return new Response("OK", {
            status: 200,
            headers: {
                'Content-Type': 'text/plain; charset=utf8'
            }
        });
    }
}
