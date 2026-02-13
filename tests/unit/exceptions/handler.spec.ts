import { test } from '@japa/runner'
import HttpExceptionHandler from '#exceptions/handler'
import { HttpContextFactory } from '@adonisjs/core/factories/http'
import { StatusPageRange, StatusPageRenderer } from '@adonisjs/core/types/http'
import { errors } from '@adonisjs/core'

test.group('HttpExceptionHandler Unit', () => {
  test('statusPages.404 renders not-found view', async ({ assert }) => {
    const handler = new HttpExceptionHandler()
    // Access protected property
    const statusPages = (handler as any).statusPages as Record<StatusPageRange, StatusPageRenderer>

    assert.isDefined(statusPages['404'])

    const ctx = new HttpContextFactory().create()
    let viewName = ''
    let viewData = {}

    // Mock view.render
    ctx.view.render = async (view, data) => {
      viewName = view
      viewData = data || {}
      return 'html'
    }

    const error = new errors.E_ROUTE_NOT_FOUND(['GET', '/not-found'])
    await statusPages['404'](error, ctx)

    assert.equal(viewName, 'pages/errors/not-found')
    assert.equal((viewData as any).error, error)
  })

  test('statusPages.500..599 renders server-error view', async ({ assert }) => {
    const handler = new HttpExceptionHandler()
    const statusPages = (handler as any).statusPages as Record<StatusPageRange, StatusPageRenderer>

    assert.isDefined(statusPages['500..599'])

    const ctx = new HttpContextFactory().create()
    let viewName = ''
    let viewData = {}

    ctx.view.render = async (view, data) => {
      viewName = view
      viewData = data || {}
      return 'html'
    }

    const error = new errors.E_HTTP_EXCEPTION('Server Error', { status: 500 })
    await statusPages['500..599'](error, ctx)

    assert.equal(viewName, 'pages/errors/server-error')
    assert.equal((viewData as any).error, error)
  })
})
