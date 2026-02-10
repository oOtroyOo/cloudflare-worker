export default class BaseHandle {

    /**
     *
     * @param {string} urlBase
     * @returns {boolean}
     */
    async test(urlBase) {
        this.lastTestUrl = urlBase
        return false
    }
    /**
     *
     * @param {Request} request
     * @param {Cloudflare.Env} env
     * @param {ExecutionContext} ctx
     * @returns {Response}
    */
    async handle(request, env, ctx) {

    }
}
