import { defineConfig, drivers } from '@adonisjs/core/hash'

const hashConfig = defineConfig({
  default: 'argon',

  list: {
    argon: drivers.argon2({
      // These are the recommended defaults from the argon2 library
      variant: 'id', // Argon2id variant
      iterations: 3,
      memory: 65536, // 64 MiB
      parallelism: 4,
      saltSize: 16,
      hashLength: 32,
    }),
  },
})

export default hashConfig

/**
 * Inferring types for the list of hashers you have configured
 * in your application.
 */
declare module '@adonisjs/core/types' {
  export interface HashersList extends InferHashers<typeof hashConfig> {}
}
