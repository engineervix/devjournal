import type { HttpContext } from '@adonisjs/core/http'
import Entry from '#models/entry'
import Tag from '#models/tag'
import { cuid } from '@adonisjs/core/helpers'
import vine, { errors } from '@vinejs/vine'
import { DateTime } from 'luxon'

const entryValidator = vine.compile(
  vine.object({
    entryType: vine.string().trim(),
    title: vine.string().trim().optional(),
    contentMarkdown: vine.string().trim().optional(),
    tags: vine.array(vine.string()).optional(),
  })
)

export default class EntriesController {
  /**
   * Display a list of resource
   */
  async index({ view, request }: HttpContext) {
    // Get query parameters for filtering
    const { type, period, sort } = request.qs()

    // Create query builder
    const query = Entry.query()

    // Apply type filter if provided
    if (type) {
      query.where('entryType', type)
    }

    // Apply period filter if provided
    if (period) {
      const now = DateTime.now()

      switch (period) {
        case 'today':
          query.where('createdAt', '>=', now.startOf('day').toSQL())
          break
        case 'this-week':
          query.where('createdAt', '>=', now.startOf('week').toSQL())
          break
        case 'this-month':
          query.where('createdAt', '>=', now.startOf('month').toSQL())
          break
        case 'this-year':
          query.where('createdAt', '>=', now.startOf('year').toSQL())
          break
      }
    }

    // Apply sorting
    if (sort === 'oldest') {
      query.orderBy('createdAt', 'asc')
    } else {
      query.orderBy('createdAt', 'desc')
    }

    // Load relationships
    query.preload('tags')

    // Paginate results
    const entries = await query.paginate(request.input('page', 1), 10)

    // Build query params for pagination links
    let queryParams = ''
    if (type || period || sort) {
      const params = []
      if (type) params.push(`type=${type}`)
      if (period) params.push(`period=${period}`)
      if (sort) params.push(`sort=${sort}`)
      queryParams = `&${params.join('&')}`
    }

    return view.render('pages/entries/index', { entries, queryParams })
  }

  /**
   * Display form to create a new record
   */
  async create({ view }: HttpContext) {
    return view.render('pages/entries/create')
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    try {
      const payload = await request.validateUsing(entryValidator)
      await Entry.create({
        id: cuid(),
        userId: user.id,
        ...payload,
      })
      return response.redirect().toRoute('entries.index')
    } catch (error) {
      if (error instanceof errors.E_VALIDATION_ERROR) {
        return response.status(422).send(error.messages)
      }
      throw error
    }
  }

  /**
   * Show individual record
   */
  async show({ params, view }: HttpContext) {
    const entry = await Entry.findOrFail(params.id)
    return view.render('pages/entries/show', { entry })
  }

  /**
   * Edit individual record
   */
  async edit({ params, view }: HttpContext) {
    const entry = await Entry.findOrFail(params.id)
    return view.render('pages/entries/edit', { entry })
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ params, request, response }: HttpContext) {
    const entry = await Entry.findOrFail(params.id)

    try {
      const payload = await request.validateUsing(entryValidator)
      entry.merge(payload)
      await entry.save()
      return response.redirect().toRoute('entries.show', { id: entry.id })
    } catch (error) {
      if (error instanceof errors.E_VALIDATION_ERROR) {
        return response.status(422).send(error.messages)
      }
      throw error
    }
  }

  /**
   * Delete record
   */
  async destroy({ params, response }: HttpContext) {
    const entry = await Entry.findOrFail(params.id)
    await entry.delete()
    return response.redirect().toRoute('entries.index')
  }

  /**
   * Search entries
   */
  async search({ view, request }: HttpContext) {
    const query = request.input('q', '')

    if (!query) {
      return view.render('pages/entries/search', { entries: [], query: '' })
    }

    // Get filter parameters
    const { type, period, sort } = request.qs()

    // Create query builder with full text search
    const entryQuery = Entry.query()
      .whereILike('title', `%${query}%`)
      .orWhereILike('contentPlain', `%${query}%`)

    // Apply type filter if provided
    if (type) {
      entryQuery.andWhere('entryType', type)
    }

    // Apply period filter if provided
    if (period) {
      const now = DateTime.now()

      switch (period) {
        case 'today':
          entryQuery.andWhere('createdAt', '>=', now.startOf('day').toSQL())
          break
        case 'this-week':
          entryQuery.andWhere('createdAt', '>=', now.startOf('week').toSQL())
          break
        case 'this-month':
          entryQuery.andWhere('createdAt', '>=', now.startOf('month').toSQL())
          break
        case 'this-year':
          entryQuery.andWhere('createdAt', '>=', now.startOf('year').toSQL())
          break
      }
    }

    // Apply sorting
    if (sort === 'newest') {
      entryQuery.orderBy('createdAt', 'desc')
    } else if (sort === 'oldest') {
      entryQuery.orderBy('createdAt', 'asc')
    }
    // Default sort is by relevance based on search match

    // Load relationships
    entryQuery.preload('tags')

    // Paginate results
    const entries = await entryQuery.paginate(request.input('page', 1), 10)

    // Build query params for pagination links
    let queryParams = ''
    if (type || period || sort) {
      const params = []
      if (type) params.push(`type=${type}`)
      if (period) params.push(`period=${period}`)
      if (sort) params.push(`sort=${sort}`)
      queryParams = `&${params.join('&')}`
    }

    return view.render('pages/entries/search', { entries, query, queryParams })
  }

  /**
   * Show entries by tag
   */
  async byTag({ params, request, view }: HttpContext) {
    const { slug } = params

    // Find the tag or return 404
    const tag = await Tag.findByOrFail('slug', slug)

    // Get entries with this tag
    const entries = await Entry.query()
      .whereHas('tags', (query) => {
        query.where('slug', slug)
      })
      .orderBy('createdAt', 'desc')
      .preload('tags')
      .paginate(request.input('page', 1), 10)

    // Find related tags
    const relatedTags = await Tag.query()
      .whereHas('entries', (query) => {
        query.whereHas('tags', (subQuery) => {
          subQuery.where('slug', slug)
        })
      })
      .andWhere('slug', '!=', slug)
      .orderBy('usageCount', 'desc')
      .limit(10)

    return view.render('pages/entries/by-tag', { tag, entries, relatedTags })
  }
}
