import db from '@adonisjs/lucid/services/db'
import User from '#models/user' // Adjust import path as needed
// ... import other models

export async function truncateTables() {
  await db.rawQuery('TRUNCATE users, entries, tags, entry_tags RESTART IDENTITY CASCADE')
}

export async function createUser(userData?: Partial<User>) {
  // Logic to create and persist a user
  // Ensure to handle password hashing if creating directly without factories
  if (userData?.password) {
    // Hash password if plain text is provided
    // This is a placeholder. Actual hashing should be done using Hash service
    // For example: user.password = await hash.make(userData.password)
  }
  // This is a placeholder. Actual user creation logic will be more complex.
  const user = new User()
  Object.assign(user, userData)
  await user.save()
  return user
}

export async function createEntry(
  userId: number,
  entryData: Partial<Entry>,
  tagNames?: string[]
): Promise<Entry> {
  const entry = new Entry()
  entry.fill({ userId, ...entryData })
  await entry.save()

  if (tagNames && tagNames.length > 0) {
    const tags = []
    for (const name of tagNames) {
      let tag = await Tag.findBy('name', name)
      if (!tag) {
        tag = await Tag.create({ name })
      }
      // Increment usage count - this might be better handled by a service or event listener in a real app
      // For testing, direct manipulation is okay, or we can test the side effect if it's implemented
      // tag.usageCount += 1;
      // await tag.save();
      tags.push(tag.id)
    }
    await entry.related('tags').attach(tags)
  }
  return entry
}
// Add functions for creating other models if needed
