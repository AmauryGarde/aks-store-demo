# Pet Store checkout release regression

This is an intentional, opt-in failure for the SRE demo, not a production fix.
The default application behavior is unchanged.

## Release and symptom

The demo release enables `DEMO_CHECKOUT_REGRESSION=true` on `order-service`.
Its new promotion-code path assumes every cart includes `promotion.code`.
The existing storefront and virtual customer send valid carts without that
optional field. Checkout therefore returns HTTP 500 before an order is
published to RabbitMQ, while `/health` continues returning HTTP 200.

The exception is recorded by Fastify with the route filename and stack.
Azure Monitor must inspect Fastify JSON response logs; an nginx-only
`HTTP/` access-log query does not detect this failure.

## Reproduction

Send the normal order-service request from `src/order-service/test-order-service.http`,
or place an order through the Pet Store storefront. No special malformed
payload is needed.

## Temporary mitigation versus permanent fix

After the incident owner approves, roll back the `order-service` Deployment to
the captured healthy revision. Disabling the demo flag is an alternative
temporary mitigation. Neither changes the data services.

The developer issue should distinguish temporary mitigation from a permanent
code fix: safely handle absent/invalid promotion fields, retain the existing
cart contract, and add regression tests. Do not describe the intentional
demo fault as a newly discovered vulnerability.

## Safety

Only the sandbox `pets/order-service` is a target. Never delete the namespace,
restart MongoDB/RabbitMQ, purge queues, or make production changes.
Before replay, capture and verify a healthy rollback revision. Leave the
deployment healthy at the end of a rehearsal.
