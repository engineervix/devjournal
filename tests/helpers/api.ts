import { ApiClient } from '@japa/api-client'
import User from '#models/user' // Adjust import path

export function getAuthenticatedClient(user: User): ApiClient {
  const client = new ApiClient('http://localhost:3333') // Or your app URL
  client.loginAs(user)
  return client
}
