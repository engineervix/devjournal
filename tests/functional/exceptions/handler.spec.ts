import { test } from '@japa/runner'

test.group('Exception Handler', () => {
  test('returns JSON 404 for API routes', async ({ client }) => {
    const response = await client.get('/api/v1/non-existent-route')

    response.assertStatus(404)
    response.assertHeader('content-type', 'application/json; charset=utf-8')
    response.assertBodyContains({
      success: false,
    })
  })

  test('returns HTML 404 for non-API routes', async ({ client, assert }) => {
    const response = await client.get('/non-existent-route')

    response.assertStatus(404)
    response.assertHeader('content-type', 'text/html; charset=utf-8')
    assert.include(response.text(), '<!DOCTYPE html>')
  })

  // To test 500, we would need to mock a controller or route that throws
  // Or we can mock the behavior of `handle` in a unit test?
  // Functional test requires a route that fails.
  // We can add a temporary route in the test?
})
