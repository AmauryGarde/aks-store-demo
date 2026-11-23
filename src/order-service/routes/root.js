'use strict'

module.exports = async function (fastify, opts) {
  const demoCheckoutRegression = process.env.DEMO_CHECKOUT_REGRESSION === 'true'

  fastify.post('/', async function (request, reply) {
    const msg = request.body
    if (demoCheckoutRegression) {
      // Deliberately faulty release: existing carts do not include promotion.
      const promotionCode = msg.promotion.code.trim()
      request.log.info({ promotionCode }, 'Applying checkout promotion')
    }
    await fastify.sendMessage(Buffer.from(JSON.stringify(msg)))
    reply.code(201)
  })

  fastify.get('/health', async function (request, reply) {
    const appVersion = process.env.APP_VERSION || '0.1.0'
    return { status: 'ok', version: appVersion }
  })

  fastify.get('/hugs', async function (request, reply) {
    return { hugs: fastify.someSupport() }
  })
}
