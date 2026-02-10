if not exist ".dev.vars" (
    echo PIXIV_TOKEN= > .dev.vars
    echo HTTPS_PROXY= >> .dev.vars
    echo HTTP_PROXY= >> .dev.vars
)

npx wrangler types
start http://localhost:8787/
npx wrangler dev
