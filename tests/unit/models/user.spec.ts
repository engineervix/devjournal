import { test } from '@japa/runner'
import User from '#models/user'
import { createUser, truncateTables } from '#tests/helpers/database'
import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'

test.group('Models / User', (group) => {
  group.each.setup(async () => {
    await truncateTables()
  })

  test('User Creation: creates a new user with valid data', async ({ assert }) => {
    const userData = {
      email: 'testuser@example.com',
      password: 'password123',
      fullName: 'Test User',
    }
    const user = await User.create(userData)

    assert.instanceOf(user, User)
    assert.equal(user.email, userData.email)
    assert.equal(user.fullName, userData.fullName)
    assert.isTrue(await hash.verify(user.password, userData.password))

    const userInDb = await User.find(user.id)
    assert.isNotNull(userInDb)
    assert.equal(userInDb!.email, userData.email)
  })

  test('User Creation: fullName is optional', async ({ assert }) => {
    const userData = {
      email: 'optionalfullname@example.com',
      password: 'password123',
    }
    const user = await User.create(userData)
    assert.instanceOf(user, User)
    assert.equal(user.email, userData.email)
    assert.isUndefined(user.fullName)
    assert.isTrue(await hash.verify(user.password, userData.password))
  })

  test('Email Uniqueness: fails to create a user with an existing email', async ({ assert }) => {
    const email = 'unique@example.com'
    await createUser({ email, password: 'password123' })

    try {
      await createUser({ email, password: 'password456' })
      assert.fail('Should have failed to create user with duplicate email')
    } catch (error) {
      // Depending on how DB errors are handled, this might need adjustment
      // For PostgreSQL, unique violation error code is '23505'
      assert.include(error.message, 'violates unique constraint "users_email_unique"')
    }
  })

  // Placeholder for relationship tests if any direct ones are added to User model later
  // For example, if a user has many posts directly:
  // test('User Relationships: can load related posts', async ({ assert }) => {
  //   const user = await createUser({ email: 'userwithposts@example.com', password: 'password' });
  //   // Assume Post model and a way to create posts for the user
  //   // await createPost({ userId: user.id, title: 'My First Post' });
  //   // await createPost({ userId: user.id, title: 'My Second Post' });
  //
  //   await user.load('posts'); // Assuming 'posts' is the relationship name
  //   assert.isArray(user.posts);
  //   assert.isNotEmpty(user.posts);
  //   // assert.equal(user.posts.length, 2);
  // });
})
