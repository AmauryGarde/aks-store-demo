'use strict'

const { test } = require('tap')
const Fastify = require('fastify')
const routes = require('../../routes/root')

const order = {
  customerId: 'petstore-demo',
  items: [{ productId: 1, quantity: 1, price: 10 }]
}

async function build (t, enabled) {
  const app = Fastify()
  const messages = []
  app.decorate('sendMessage', async message => messages.push(JSON.parse(message)))
  const previous = process.env.DEMO_CHECKOUT_REGRESSION
  process.env.DEMO_CHECKOUT_REGRESSION = String(enabled)
  try {
    await app.register(routes)
    await app.ready()
  } finally {
    if (previous === undefined) delete process.env.DEMO_CHECKOUT_REGRESSION
    else process.env.DEMO_CHECKOUT_REGRESSION = previous
  }
  t.teardown(() => app.close())
  return { app, messages }
}

test('checkout release regression and temporary mitigation', async t => {
  await t.test('normal release accepts existing carts', async t => {
    const { app, messages } = await build(t, false)
    const response = await app.inject({ method: 'POST', url: '/', payload: order })
    t.equal(response.statusCode, 201)
    t.same(messages, [order])
  })

  await t.test('demo regression fails before publishing an order while health remains green', async t => {
    const { app, messages } = await build(t, true)
    const response = await app.inject({ method: 'POST', url: '/', payload: order })
    t.equal(response.statusCode, 500)
    t.same(messages, [])
    const health = await app.inject({ url: '/health' })
    t.equal(health.statusCode, 200)
  })

  await t.test('promotion-bearing requests are unaffected by the injected regression', async t => {
    const { app, messages } = await build(t, true)
    const payload = { ...order, promotion: { code: 'DEMO10' } }
    const response = await app.inject({ method: 'POST', url: '/', payload })
    t.equal(response.statusCode, 201)
    t.same(messages, [payload])
  })
})
