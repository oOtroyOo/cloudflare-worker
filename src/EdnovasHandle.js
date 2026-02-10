import BaseHandle from "./BaseHandle";

export default class EdnovasHandle extends BaseHandle {
    // 执行/api/v1/user/downloadConfig，不带Origin，就会返回
    allowed_domains = [
        "cdn.ednovas.tech",
        "new.ednovas.org",
        "cdn.nmsl.sb",
        "new.nmsl.sb",
        "new.ednovas.world",
        "new.ednovas.blog",
        // "se.av.com.se",
        // "se.av.bingo",
        "1.ednovas.org",
        "new.ednovas.dev",
        "cdn.ednovas.dev",
        "cdn.ednovas.world",
        "cdn.ednovas.org",
        "ednovas.world",
        "ednovas.dev",
        "cdn.ednovas.me",
        "ednovas.org",
        "ednovas.tech"
    ]


    auth_data = undefined

    /**
     *
     * @param {string} urlBase
     * @returns {boolean}
     */
    async test(urlBase) {
        return super.test(urlBase) || urlBase.toLowerCase().startsWith("ednovas/")
    }
    /**
     *
     * @param {Request} request
     * @param {Cloudflare.Env} env
     * @param {ExecutionContext} ctx
     * @returns {Response}
    */
    async handle(request, env, ctx) {

        const reqUrl = new URL(request.url)
        const email = reqUrl.searchParams.get("email")
        const password = reqUrl.searchParams.get("password")

        if (!this.auth_data) {
            try {
                console.log("try get KV Store");

                const kv_auth = await env.KV_STORE.get("ednovas_auth_data", "text")
                if (kv_auth) {
                    await this.user(kv_auth)
                }
            } catch (error) {
                console.error(error)
            }
        }

        if (!this.auth_data) {
            if (email && password) {
                await this.login(email, password, env)
            }
        }
        if (!this.auth_data) {
            return new Response(JSON.stringify({
                error: "Authentication required",
                message: "Please provide email and password parameters"
            }), {
                status: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'WWW-Authenticate': 'Bearer'
                }
            });
        }
        if (this.lastTestUrl.startsWith("ednovas/downloadConfig")) {
            const data = {
                flag: "clash"
            }
            const clientAgent = request.headers.get("User-Agent")
            if (clientAgent.toLowerCase().indexOf("clash") > -1) {
                data.flag = "clash"
            }
            const downloadUrl = `https://${this.successUrl}/api/v1/user/downloadConfig`
            console.log(downloadUrl)
            const getSubscribe = await fetch(downloadUrl, {
                method: "POST",
                body: data,
                headers: {
                    "Authorization": this.auth_data,
                    "Origin": `https://${this.successUrl}`,
                    "Content-Type": "application/json"
                },
                // timeout: 2000,

            });
            const result = await getSubscribe.text();
            return new Response(result, {
                status: getSubscribe.status,
                headers: getSubscribe.headers
            });
        }
    }

    async user(kv_auth) {
        const fetchPromises = this.allowed_domains.map(url =>
            new Promise(async (resolve, reject) => {
                try {
                    let response = await fetch(`https://${url}/api/v1/user/info`, {
                        headers: { "Authorization": kv_auth },
                        timeout: 3000
                    });
                    let result = await response.json();

                    if (result.data && result.data) {
                        console.log(`${url} user success auth_data: ${result.data.email }`);

                        resolve({ successUrl: url, auth_data: result.data })
                    }
                    else {
                        reject(`reject ${url} Login failed`)
                    }
                } catch (error) {
                    console.log(`reject ${url} ${error} `);

                    reject(error)
                }
            })
        );

        const { successUrl, user } = await this.waitAnySuccess(fetchPromises);
        this.successUrl = successUrl
        this.auth_data = kv_auth
    }

    /**
     *
     * @param {*} email
     * @param {*} password
     * @param {Cloudflare.Env} env
     */
    async login(email, password, env) {
        console.log("Login");

        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        const fetchPromises = this.allowed_domains.map(url =>
            new Promise(async (resolve, reject) => {
                try {
                    let response = await fetch(`https://${url}/api/v1/passport/auth/login`, {
                        method: "POST",
                        body: formData,
                        timeout: 3000
                    });
                    let result = await response.json();

                    if (result.data && result.data.auth_data) {
                        console.log(`${url} login success auth_data: ${result.data.auth_data}`);

                        resolve({ successUrl: url, auth_data: result.data.auth_data })
                    }
                    else {
                        reject(`reject ${url} Login failed`)
                    }
                } catch (error) {
                    console.log(`reject ${url} ${error} `);

                    reject(error)
                }
            })
        );

        const { successUrl, auth_data } = await this.waitAnySuccess(fetchPromises);

        try {
            console.log("try put KV Store");
            await env.KV_STORE.put("ednovas_auth_data", auth_data)
        } catch (error) {
            console.error(error)
        }
        this.successUrl = successUrl;
        this.auth_data = auth_data;
    }

    async waitAnySuccess(fetchPromise) {
        // 创建一个 Set 跟踪未完成的 Promise
        const pending = new Set(fetchPromise);

        while (pending.size > 0) {
            try {
                // Promise.any 会在有任意成功的 Promise 时 resolve，否则等到全部都 rejected 才抛出 AggregateError
                const result = await Promise.any([...pending]);
                return result; // 任意成功立即返回
            } catch (e) {
                // 捕获到 AggregateError，说明目前 pending 里的 Promise 全部 rejected
                // 需要检查这些 Promise 是否都已经 settled（fulfilled 或 rejected）
                const results = await Promise.allSettled([...pending]);
                // 移除已经 settled 的 Promise
                for (let i = 0; i < results.length; i++) {
                    if (results[i].status !== 'pending') {
                        pending.delete([...pending][i]);
                    }
                }
                // 如果全部 settled，说明所有都失败了
                if (pending.size === 0) {
                    return null;
                }
                // 否则循环继续，直到有成功或都 settled
            }
        }
        return null; // 防止极端情况
    }
}
