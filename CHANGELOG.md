# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [1.2.0](https://github.com/engineervix/devjournal/compare/v1.1.0...v1.2.0) (2026-04-01)


### 🚀 Features

* add CSS styles for mdit plugin output ([65f709f](https://github.com/engineervix/devjournal/commit/65f709ff095cb4b8db5c01bb2575cf47dd45ba41))
* **cli:** add --type flag to update command ([689d3bc](https://github.com/engineervix/devjournal/commit/689d3bc4214ab71c384165170e075c0bfb3b1358))
* **cli:** use actual binary name in help and error messages ([b5af735](https://github.com/engineervix/devjournal/commit/b5af7352a3501cdc97756c1f6eb5f3442e69c2e7))
* extend markdown-it with mdit plugins ([2953fe8](https://github.com/engineervix/devjournal/commit/2953fe86cd86082bb806fa04ea66450fa9e8c49a))


### ⚙️ Build System

* enable tailwindcss/nesting in PostCSS for native CSS nesting support ([d09f58c](https://github.com/engineervix/devjournal/commit/d09f58c367c81344d2c81ee37a5d60b95ffdfa6b))

## [v1.1.0](https://github.com/engineervix/devjournal/compare/v1.0.1...v1.1.0) (2026-03-30)


### 🚀 Features

* **auth:** redirect to login with ?next= param for unauthenticated requests ([41f18e0](https://github.com/engineervix/devjournal/commit/41f18e0df2f523c09b00be9b591ed41d823565b2))
* **claude:** add /devlog custom command for saving conversation notes ([4071c96](https://github.com/engineervix/devjournal/commit/4071c9606b3a056a92fdd2588256e8757fe9c9d4))
* **cli:** prompt for server URL during login flow ([5ca7d31](https://github.com/engineervix/devjournal/commit/5ca7d318f3dd7abb6a006873f6e8b9e2a3280cee))


### 🐛 Bug Fixes

* **cli:** correct update command usage string to reflect ID-only support ([0e6248c](https://github.com/engineervix/devjournal/commit/0e6248cb11bc33ad0825e120582cbd97147f3ebf))
* **test:** pin HOST=localhost in test scripts to avoid openSUSE system HOST override ([35824cd](https://github.com/engineervix/devjournal/commit/35824cd30eab2d81713224bdd5f7cfbbfc88d9c3))


### ✅ Tests

* **auth:** add functional tests for ?next= redirect and open-redirect protection ([a84feaa](https://github.com/engineervix/devjournal/commit/a84feaa77a28ffdf1e4d1ef4ba1f344193895564))


## [v1.0.1](https://github.com/engineervix/devjournal/compare/v1.0.0...v1.0.1) (2026-03-09)


### 🐛 Bug Fixes

* **cli:** correct Tag ID type to int64 and add UsageCount ([f93733f](https://github.com/engineervix/devjournal/commit/f93733f410c5182df0d5d6fe8945d9584ba3024c))


## 1.0.0 (2026-03-07)


### 🚀 Features

* add archiver ([a86d032](https://github.com/engineervix/devjournal/commit/a86d032634a4b9a863891263353121c6808138d2))
* add CLI to communicate with API ([418d64c](https://github.com/engineervix/devjournal/commit/418d64ca995b8c9f1a3d59891a8a0d6ce3c814b6))
* Add comprehensive unit and functional tests with CI ([d76be57](https://github.com/engineervix/devjournal/commit/d76be57bec3d8af5b061e1921ae4d055fb73849a))
* add copy buttons to code blocks ([b6bf22a](https://github.com/engineervix/devjournal/commit/b6bf22aeae04af6d26186da7988c187441d602d2))
* add create_user command ([c6a245a](https://github.com/engineervix/devjournal/commit/c6a245ae4fb0d992088f608412ffd1f5cd06f995))
* add database migrations for entries, tags ([cad36d7](https://github.com/engineervix/devjournal/commit/cad36d72f58ad72f93a7c4ba44bb654e4e70e374))
* add database seeding with realistic developer content ([a089997](https://github.com/engineervix/devjournal/commit/a089997fdc69f12769023d2666b8b5f3f2ac56d4))
* add dynamic OpenGraph metadata to entry pages ([96eaf16](https://github.com/engineervix/devjournal/commit/96eaf168c413df9f178a4eb728b0986bb8c7a15f))
* add initial models ([972e0f7](https://github.com/engineervix/devjournal/commit/972e0f7c1a4b7e4fe01f2580f7e63f37b6124d38))
* add oEmbed protocol support for embedded content ([a513b92](https://github.com/engineervix/devjournal/commit/a513b92ab21464f09a9248746f0a45ec912d5f9f))
* add Personal Access Token authentication ([bf3f3bc](https://github.com/engineervix/devjournal/commit/bf3f3bcd27656d9af16d6f361be3ab7f66de089c))
* add phosphor icons ([b1da387](https://github.com/engineervix/devjournal/commit/b1da387a05d5fb9f8dc1c98578c22f3cddbf0ad7))
* add REST API for journal entries ([91e9c2a](https://github.com/engineervix/devjournal/commit/91e9c2a3c79cfa01cc7724519832a12e0489211e))
* add syntax highlighting for code blocks ([1650860](https://github.com/engineervix/devjournal/commit/165086079d01028398829a1e4bc9b19c03417d15))
* add unsaved changes protection for entry forms ([7bedb4f](https://github.com/engineervix/devjournal/commit/7bedb4f013359d5154d85c6ba202840e2e14eed3))
* **api:** add token validation endpoint GET /api/v1/me ([f03f3a2](https://github.com/engineervix/devjournal/commit/f03f3a22814cd6a17203de77d1c60f99d4ef88bb))
* **api:** allow for updating notes and listing them ([7883b04](https://github.com/engineervix/devjournal/commit/7883b043352144c14ccfe2472bcfc55b0e35bbb7))
* **auth:** implement basic email/password authentication ([1cfa7c2](https://github.com/engineervix/devjournal/commit/1cfa7c22a4c9483364c4168a4bf58a04b6a33ac9))
* **cli:** add command to reprocess existing entries ([265c429](https://github.com/engineervix/devjournal/commit/265c429964d7d9f3a2062e4b634339fd454e8972))
* create an AJAX endpoint for creating or updating entries without page reload ([29dd8ee](https://github.com/engineervix/devjournal/commit/29dd8eeeeffee634bda4bafb58dda7f7880f7519))
* define routes for entries ([8da29f5](https://github.com/engineervix/devjournal/commit/8da29f5a4b22f4ee18a0f11d3d217c90b1d89269))
* dompurify for sanitising input ([145e7c5](https://github.com/engineervix/devjournal/commit/145e7c5ec9c5b6366f3435d8b6d6a235e4950f95))
* export exntries, perf improvements, small tweaks ([49e6c7e](https://github.com/engineervix/devjournal/commit/49e6c7ee2f158178fda50dfbc0598ebd568b1c4b))
* fresh adonisJS project ([1e90cff](https://github.com/engineervix/devjournal/commit/1e90cfff6e6a2c0a36140034a088a235785ae8e6))
* fulltext search ([49fc5a7](https://github.com/engineervix/devjournal/commit/49fc5a7800ae420d32447f672a1d24d1186bc9b7))
* implement clickable entry cards with enhanced UX ([4291a4c](https://github.com/engineervix/devjournal/commit/4291a4cc0b769fd14ed68bc314721d1081d4c7f1))
* implement universal Ctrl/Cmd+S shortcut for saving entries ([356c716](https://github.com/engineervix/devjournal/commit/356c716120c9d789f787a7f0208114e0da56ca3e))
* navbar ([8acbf68](https://github.com/engineervix/devjournal/commit/8acbf6864ba9a4579b9c4b95bbe9dc0bb4c2d404))
* og:image ([63f3318](https://github.com/engineervix/devjournal/commit/63f33184bf3228c649bb4b6917ae0d0210175097))
* replace basic markdown editor with EasyMDE and add rich text paste support ([09e473e](https://github.com/engineervix/devjournal/commit/09e473e523d1eb87988878125a060a22ef15b490))
* setup controllers for entries ([5af9047](https://github.com/engineervix/devjournal/commit/5af904797164652faffc96fa0ab0617b734d2f93))
* tag cloud ([fb2521a](https://github.com/engineervix/devjournal/commit/fb2521a7c95259c5ac271a6fdb2c7bf5c5820c24))
* templates ([2711b1b](https://github.com/engineervix/devjournal/commit/2711b1b587636bf20e4d5f3d8c60c4777f83c2f8))
* update api endpoints and make cli client be able to list and update entries ([7ea1626](https://github.com/engineervix/devjournal/commit/7ea16266004f74f772ebb1c290b6762262a424b1))
* update routes ([4ed5f84](https://github.com/engineervix/devjournal/commit/4ed5f84fac4327b9925b61971cf4e9e753934f4f))


### 🐛 Bug Fixes

* allowMethodSpoofing ([bfb5b44](https://github.com/engineervix/devjournal/commit/bfb5b4475661ee66dddbf969627847e9608d848b))
* **api:** apply tag query filtering in entry service ([1b97bc1](https://github.com/engineervix/devjournal/commit/1b97bc1392d055d2f823a41db1fa0880bfb0dd74))
* **auth:** resolve login theme flash and turnstile race condition ([7f10025](https://github.com/engineervix/devjournal/commit/7f1002571ada2069fcf10a415b3e05de0e32f1b6))
* **auth:** strengthen Turnstile integration to prevent bypass ([16c3051](https://github.com/engineervix/devjournal/commit/16c30517aeecdfb70e3f0b400a654c23f3b4c7f8))
* bugfixes ([e686481](https://github.com/engineervix/devjournal/commit/e68648191e06d56cf2f1406126146512c6b599cd))
* bugfixes ([d0111e4](https://github.com/engineervix/devjournal/commit/d0111e4a2f43b2b9b3fe8d9f8777adc31f3a5475))
* bugfixes ([f1af0d2](https://github.com/engineervix/devjournal/commit/f1af0d27b5e10052f4da3bc1cb438e3091e87d0b))
* bugfixes after refactoring the controller ([573cce7](https://github.com/engineervix/devjournal/commit/573cce714a3eefaddaad4f7333e491e00a56b5ba))
* **build:** prevent lefthook installation failure in Docker builds ([baffad8](https://github.com/engineervix/devjournal/commit/baffad8a80501427c28b905007ef175e2ccc7b23))
* **ci:** add missing @rollup/rollup-linux-x64-gnu to lockfile ([95be021](https://github.com/engineervix/devjournal/commit/95be0211b7342961cce2abbcf5ef06cde926070e))
* **ci:** populate lockfile with cross-platform @swc/core native binaries ([f39bbe7](https://github.com/engineervix/devjournal/commit/f39bbe728a046d42e8f97a270ca4100be41e0054))
* clear unsaved changes indicator after keyboard save (Cmd+S) ([a48b7f3](https://github.com/engineervix/devjournal/commit/a48b7f340add72732cc7637bd7cabe4ea4a39f87))
* **cli:** remove duplicate success message in add command ([e941a21](https://github.com/engineervix/devjournal/commit/e941a2170d2ea9beb93e61a0bc2f4d152d95b05d))
* **cli:** update login to use GET /api/v1/me endpoint ([67cdace](https://github.com/engineervix/devjournal/commit/67cdace8c0ae4d86bf44abf6b6c31aaaf2983d86))
* **content-processor:** process oEmbed embeds after markdown rendering ([47f07c2](https://github.com/engineervix/devjournal/commit/47f07c2e1edef8465a403bec6246a3af9f65223b))
* correct base URL construction in opengraph component ([f99aa59](https://github.com/engineervix/devjournal/commit/f99aa595a03bd5205a5d165964ccf9be912c650d))
* correct determination of IP address ([3bdcb78](https://github.com/engineervix/devjournal/commit/3bdcb78d63f3f60c23412df9804b405bd9d1b93a))
* create DRY meta tag components and update templates ([14335b2](https://github.com/engineervix/devjournal/commit/14335b2418d8193951c4bfc026d43f49d0fca5d8))
* database migrations ([0379c05](https://github.com/engineervix/devjournal/commit/0379c05665d886ae2f739bc7c4d712e7aa3b48ec))
* **deps:** update module github.com/go-resty/resty/v2 to v2.17.2 ([7c99d16](https://github.com/engineervix/devjournal/commit/7c99d162c07e7023283a4985b33517744a750f62))
* docker dev setup, turnstile widget, theme toggle on login ([0ac666f](https://github.com/engineervix/devjournal/commit/0ac666fb86f2ecfe5b85b94796dc5950204a80b1))
* edgejs templates ([a69e094](https://github.com/engineervix/devjournal/commit/a69e0941c24a43084787eec89b84a7bd47cb797c))
* error pages ([a938010](https://github.com/engineervix/devjournal/commit/a938010865b9e8c231646ee9d77375b925a18f0e))
* error pages templates ([9560797](https://github.com/engineervix/devjournal/commit/9560797c51be6528d2cfb73c3f4ab45999257d98))
* error response on api, and handle short uuids ([e24859b](https://github.com/engineervix/devjournal/commit/e24859bacddce84e4d79608886c26246b9a862ce))
* **export:** add timestamps to export filenames and fix ZIP streaming ([4a29700](https://github.com/engineervix/devjournal/commit/4a297008921b36a2030d3269dfcc022057c8003a))
* **export:** ensure tags array is properly quoted ([08dbc47](https://github.com/engineervix/devjournal/commit/08dbc474c4bc87e7256b8d6bc67ecbc88ebde0ff))
* **export:** markdown spacing ([56e4cd8](https://github.com/engineervix/devjournal/commit/56e4cd8e3fa865fbf45243698f90f9c7ce22fdbf)), closes [#15](https://github.com/engineervix/devjournal/issues/15)
* improve middleware error handling and service functionality ([4e24439](https://github.com/engineervix/devjournal/commit/4e24439c8e5ff111e0b1272a1f968fbd537dd54f))
* light/dark mode icon ([efc7e5b](https://github.com/engineervix/devjournal/commit/efc7e5bd73fc92bb927aeaaa89493f9fcb12aa67))
* logger property ([7d3e858](https://github.com/engineervix/devjournal/commit/7d3e85855351fb602163d6ce533391161cd2c00d))
* **logger:** Correctly configure Sentry transport ([6e84354](https://github.com/engineervix/devjournal/commit/6e8435400a4cec54d5cd253d28c3838c2c25efc6))
* login screen layout ([be37304](https://github.com/engineervix/devjournal/commit/be3730498af9f976ca0bef54228b60f2905be5f8))
* **oembed:** correct DOMPurify import, hostname allowlist, and logging ([f1d07c3](https://github.com/engineervix/devjournal/commit/f1d07c34b5d6b69d6d0ace09ea169ba08ca86815))
* **oembed:** make video iframes fully responsive ([5772fdb](https://github.com/engineervix/devjournal/commit/5772fdb3666a1f060efe53e603d4549e95701c98))
* property access ([ce67059](https://github.com/engineervix/devjournal/commit/ce67059ffb1bb934a66355f144a4bdacca3a15d3))
* remove auto-closing from component with slot ([1494825](https://github.com/engineervix/devjournal/commit/1494825bcc68c5548b374946c9204bd584a49eb2))
* resolve EasyMDE template double-click issue with retry mechanism ([436d69f](https://github.com/engineervix/devjournal/commit/436d69f03f4ddfb253060c7d3b096e76ba25dc38)), closes [#09e473](https://github.com/engineervix/devjournal/issues/09e473) [#10](https://github.com/engineervix/devjournal/issues/10)
* resolve HttpContext access issue in Edge constructUrl helper ([48542f1](https://github.com/engineervix/devjournal/commit/48542f16b7018efbcf44aa662c2d8e96eff5b5dd))
* restore @japa/plugin-adonisjs which jules removed ([cb92c26](https://github.com/engineervix/devjournal/commit/cb92c26176a36eec037a27f134f851bccc37198e))
* restrict entry ID routes to UUID format only ([7cc42ad](https://github.com/engineervix/devjournal/commit/7cc42ad466d39571fd34ee424fdac6072861cdb0))
* several bugfixes and cleanup ([a56a93a](https://github.com/engineervix/devjournal/commit/a56a93a3c633d7a59912d4e634558ffbcd9bc038))
* template alignment ([dc47352](https://github.com/engineervix/devjournal/commit/dc47352d1b0df63276f38addc425698a263f9e02))
* template bugfixes ([7259fb9](https://github.com/engineervix/devjournal/commit/7259fb928f68b1fff2670eb637a67282d7ad598f))
* **theme:** include theme script in login page ([11c188d](https://github.com/engineervix/devjournal/commit/11c188d91c4c58e0973fa2f7f45978febcc4ef4a))
* unsaved changes visibility bug ([c2a010b](https://github.com/engineervix/devjournal/commit/c2a010b07b3ec027b618e8712f13e44ea7e4339d))
* use response variable in entries controller test ([2101e5b](https://github.com/engineervix/devjournal/commit/2101e5b3ed7669fa6f51cd19c3e1e999d7fbc4e8))
* use the correct docker compose config ([b1bc23c](https://github.com/engineervix/devjournal/commit/b1bc23cde79a8b99a6eca4d0e9ace43cf95dc6f7))
* uuid handling ([a3eacad](https://github.com/engineervix/devjournal/commit/a3eacad7cb5512a00beb957357f5a1bbaeaac56b))
* ux enhancements ([b0a5ace](https://github.com/engineervix/devjournal/commit/b0a5ace0383581c807bf83caf61daf09f8bfcbcf))


### 📝 Docs

* add comprehensive oEmbed integration documentation ([478fde3](https://github.com/engineervix/devjournal/commit/478fde369d6f3d4cf633c41727e7309c779b1ebe))
* add README ([251f22e](https://github.com/engineervix/devjournal/commit/251f22e8813b0d3e7174b3c2841f5116349d4999))
* make correct ([182d17e](https://github.com/engineervix/devjournal/commit/182d17ebd46fe80327eb73434369e69d8e89b3d5))
* **oembed:** trim to minimum viable documentation ([d4221af](https://github.com/engineervix/devjournal/commit/d4221afa06411e6f4688808f21b0f1131f9f5911))
* update ([31a3aa8](https://github.com/engineervix/devjournal/commit/31a3aa8c2f380ea1c25b6fd9398c75de46dafe34))
* update docs following api endpoints update ([016e406](https://github.com/engineervix/devjournal/commit/016e4068c7d88387ac602951e22505d351483db3))
* write the docs ([264db4b](https://github.com/engineervix/devjournal/commit/264db4b50efcca03b420d57ed01a65b4eaeac6ef))


### 💄 Styling

* add tailwind css config ([dc80dd1](https://github.com/engineervix/devjournal/commit/dc80dd13e14d304d738f5a66e5c6ecc5d20acc82))
* apply prettier formatting to templates and CLI docs ([1239954](https://github.com/engineervix/devjournal/commit/1239954dd3960cdc2bf1cceaa1c2c45d54e99d09))
* **entries:** increase entry body font size to prose-lg ([a2bbe1a](https://github.com/engineervix/devjournal/commit/a2bbe1ada93c5953533b5dd2b104e38a609bdff8))
* just use systemui font ([20a0889](https://github.com/engineervix/devjournal/commit/20a08892c73c1e984f7f6e4fe19602e292f6dad2))
* make it snazzy! ([e55cfd0](https://github.com/engineervix/devjournal/commit/e55cfd0bad38eef04096f07c2a1399896db64f4e))
* snazzy login screen ([0eadfae](https://github.com/engineervix/devjournal/commit/0eadfae6c913f2170ea4bcc4c46e05fd3d617580))


### ♻️ Code Refactoring

* better dates ([60c6375](https://github.com/engineervix/devjournal/commit/60c6375c7e570675499d4bd4b9f1e95bafcc81e5))
* **cli:** use stderr for errors, add help examples, and improve api hints ([6227c11](https://github.com/engineervix/devjournal/commit/6227c11fb40293895c51d2e9d156c51d2471d3c4))
* core entry logic ([dbb48f6](https://github.com/engineervix/devjournal/commit/dbb48f6b486fc588f8c3a4bd41861c5b5d393df0))
* dark mode ([8d296e3](https://github.com/engineervix/devjournal/commit/8d296e305fd6ec1c031ab4db9dadcc79e05b74f3))
* disable csp for now ([c202de8](https://github.com/engineervix/devjournal/commit/c202de829a7f361905da4948d0f545c24dd7661d))
* **editor:** streamline EasyMDE configuration ([9bf34ab](https://github.com/engineervix/devjournal/commit/9bf34abaa1b1b70cd570f995f02be786c1c0b34a))
* get ready for production ([a15698d](https://github.com/engineervix/devjournal/commit/a15698ddf2223d9efa2c9b25b785bda7ec54da73))
* include other providers ([60cdef9](https://github.com/engineervix/devjournal/commit/60cdef96c371f283e1043a853b070023ec7a4969))
* just use DATABASE_URL - simple is better than complex ([3014117](https://github.com/engineervix/devjournal/commit/301411769592078675e289c60b699342d10e3248))
* let's follow the Single Responsibility Principle ([7d4f07f](https://github.com/engineervix/devjournal/commit/7d4f07f63ec807a72d9b05a4df86a515d83e409a))
* make templates DRYer, add some bugfixes and enhancements ([8f8dc19](https://github.com/engineervix/devjournal/commit/8f8dc193d374a65d1ec8c431db7a1b89808d2722))
* modularize JavaScript into separate modules ([225fc69](https://github.com/engineervix/devjournal/commit/225fc6911eae8a6d737139b7bbf48f59cec0b027))
* reorganise and update .env.example file ([90c30a2](https://github.com/engineervix/devjournal/commit/90c30a2608a8e1aae4f41f0dec1b34dacf5536e8))
* separate entry type selector to individual templates ([2bcc840](https://github.com/engineervix/devjournal/commit/2bcc84007c65796ac2285a67b9a57ec0c03d230d))
* show time and not just date ([0ad69a5](https://github.com/engineervix/devjournal/commit/0ad69a5b1c031ad00c1d575665c1b1c5bc1d2c98))
* update backup config ([e97abed](https://github.com/engineervix/devjournal/commit/e97abeda6d80ee59dbc79d1b155626519f56a063))
* use argon2 for password hashing ([23b2641](https://github.com/engineervix/devjournal/commit/23b2641d4ced1420ece9dbf000b801dfe691d9a9))
* use whatever binary name is ([0a80070](https://github.com/engineervix/devjournal/commit/0a8007052a2d2d45665c393a22ac4eaf60e4a408))


### ✅ Tests

* achieve 95%+ coverage with comprehensive test suite ([2076bc1](https://github.com/engineervix/devjournal/commit/2076bc164f2110b7d2dca7787e34ec814bd8196e))
* add @japa/api-client ([04d13b3](https://github.com/engineervix/devjournal/commit/04d13b3b39f36f129221f0aaf20c1484a1f03f73))
* add comprehensive API tests and documentation ([75e8d92](https://github.com/engineervix/devjournal/commit/75e8d923264c8fe5f8e1e5645e8b0d1d284cecd4))
* cleaning up jules' mess and starting over ([a19bb08](https://github.com/engineervix/devjournal/commit/a19bb08c4639730fc9c38ee12bc28074019e59e9))
* **cli:** fix config tests on macOS by mocking UserConfigDir environment variables ([65dfc5e](https://github.com/engineervix/devjournal/commit/65dfc5ec11516a30bea7384fbcb9db61934d1eb1))
* fix broken tests and document lessons ([86d808c](https://github.com/engineervix/devjournal/commit/86d808c52d3b06e618112a458a44b0c6983064ac))
* jules did a terrible job of writing tests ([7a48c13](https://github.com/engineervix/devjournal/commit/7a48c135f9b58b3db86021c81d37ea2145928f2a))
* **oembed:** add positive-path and security boundary tests ([304a97a](https://github.com/engineervix/devjournal/commit/304a97afbd6d00d9f629a14b25e1f18ddc7c841d))
* proper tests, not abena jules ([dfac52a](https://github.com/engineervix/devjournal/commit/dfac52a02f1df8697223179ea5f3f9f984abd27c))
* test coverage using c8 ([023e75a](https://github.com/engineervix/devjournal/commit/023e75a714889cb9990661e8155c7b329b1d977c))
* we don't need .env.test ([f849093](https://github.com/engineervix/devjournal/commit/f849093ad661b312a0e55bccb06887ab310dd27b))
* we need env variables for tests, and a test database ([08f26df](https://github.com/engineervix/devjournal/commit/08f26df7a6d544eec32d1ace7e9faf4eb42c307a))


### ⚙️ Build System

* add proxy-addr to help determine address of proxied requests ([ccf4d90](https://github.com/engineervix/devjournal/commit/ccf4d9072d92a937c1c42e65e214785874588260))
* add tailwind config & @tailwindcss/forms, @tailwindcss/typography ([66edfc2](https://github.com/engineervix/devjournal/commit/66edfc218260baa6355d5936ff6c617290229f04))
* **deps-dev:** add postcss, autoprefixer, tailwindcss ([1bf91d7](https://github.com/engineervix/devjournal/commit/1bf91d7d6a1fe7729ca09940b4227612ec00d382))
* **deps:** add argon2 and pgvector ([54360ba](https://github.com/engineervix/devjournal/commit/54360ba1ec0f2e254eb4367cc163b5521ac298bd))
* **deps:** add html-to-text ([e1e7b1d](https://github.com/engineervix/devjournal/commit/e1e7b1d77e8d24d2171647ee7bae51d1359bd3c2))
* **deps:** add markdown-it ([e102410](https://github.com/engineervix/devjournal/commit/e10241016f3ea53ca9b2865a5a0cebba038783c8))
* **deps:** install alpinejs ([6bb4300](https://github.com/engineervix/devjournal/commit/6bb4300d2af3829ba5bd05f6601ad4ec2690db38))
* **deps:** npm i ua-parser-js ([9351f5f](https://github.com/engineervix/devjournal/commit/9351f5fae39a051766c38f2b22f8aa6c05864749))
* **deps:** update dependency @adonisjs/auth to v9.5.0 ([#35](https://github.com/engineervix/devjournal/issues/35)) ([33f7644](https://github.com/engineervix/devjournal/commit/33f7644620c3ca6d56df8aab7b4d42c840e80771))
* **deps:** update dependency @adonisjs/core to v6.19.0 ([#36](https://github.com/engineervix/devjournal/issues/36)) ([894dbaa](https://github.com/engineervix/devjournal/commit/894dbaa3a9ede37ade8e15faf9ff63e4d45c0c43))
* **deps:** update dependency @adonisjs/core to v6.21.0 ([#58](https://github.com/engineervix/devjournal/issues/58)) ([c171ea9](https://github.com/engineervix/devjournal/commit/c171ea97d04c0e1ec289d468fbe75414f4a088a5))
* **deps:** update dependency @adonisjs/eslint-config to v2.1.2 ([#7](https://github.com/engineervix/devjournal/issues/7)) ([9a0ca65](https://github.com/engineervix/devjournal/commit/9a0ca658cf80ff2cc55435e815582d31bb5ae59d))
* **deps:** update dependency @adonisjs/lucid to v21.8.2 ([#37](https://github.com/engineervix/devjournal/issues/37)) ([cea4526](https://github.com/engineervix/devjournal/commit/cea4526858a43b289bfd8bb323c51b66ccd6468e))
* **deps:** update dependency @adonisjs/tsconfig to v1.4.1 ([#19](https://github.com/engineervix/devjournal/issues/19)) ([0c47b4d](https://github.com/engineervix/devjournal/commit/0c47b4d6cbe08e4f4f719542aaec6b92452ad6c8))
* **deps:** update dependency @japa/assert to v4.2.0 ([#39](https://github.com/engineervix/devjournal/issues/39)) ([acefbee](https://github.com/engineervix/devjournal/commit/acefbee1f993425b8838da00f121897c9a2405d6))
* **deps:** update dependency @japa/runner to v4.5.0 ([#40](https://github.com/engineervix/devjournal/issues/40)) ([445b133](https://github.com/engineervix/devjournal/commit/445b133bbafa557c4fffb4f5e9dc2c304a4ac967))
* **deps:** update dependency @swc/core to v1.13.5 ([#6](https://github.com/engineervix/devjournal/issues/6)) ([6ac92f6](https://github.com/engineervix/devjournal/commit/6ac92f60aaff856f8d74e1b4417ac79dffc3bf0c))
* **deps:** update dependency @tailwindcss/forms to v0.5.11 ([#49](https://github.com/engineervix/devjournal/issues/49)) ([659802b](https://github.com/engineervix/devjournal/commit/659802be7c886a43e6fcc6636d269912a04b4c32))
* **deps:** update dependency @tailwindcss/typography to v0.5.19 ([#27](https://github.com/engineervix/devjournal/issues/27)) ([eafbf23](https://github.com/engineervix/devjournal/commit/eafbf23bc99d3fbffd34cc7bf457cc73d9cb470a))
* **deps:** update dependency @types/node to v22.18.8 ([#20](https://github.com/engineervix/devjournal/issues/20)) ([409b778](https://github.com/engineervix/devjournal/commit/409b778051dd1c527471682d78b6dace6eb61a28))
* **deps:** update dependency @types/node to v22.19.13 ([#41](https://github.com/engineervix/devjournal/issues/41)) ([b7b2ba5](https://github.com/engineervix/devjournal/commit/b7b2ba51ce16e1c554ac75d8e21a253a3910bfff))
* **deps:** update dependency alpinejs to v3.15.8 ([#43](https://github.com/engineervix/devjournal/issues/43)) ([83231c8](https://github.com/engineervix/devjournal/commit/83231c894fe62f6ca9c51e992b4fdae9590f8997))
* **deps:** update dependency autoprefixer to v10.4.27 ([#51](https://github.com/engineervix/devjournal/issues/51)) ([4a41a77](https://github.com/engineervix/devjournal/commit/4a41a77dd27152c0ad00e89f5a9fd04739816b7d))
* **deps:** update dependency commit-and-tag-version to v12.6.1 ([#44](https://github.com/engineervix/devjournal/issues/44)) ([8540861](https://github.com/engineervix/devjournal/commit/8540861410f82dece01776e934f1638a0d443b3b))
* **deps:** update dependency dompurify to v3.2.7 ([#28](https://github.com/engineervix/devjournal/issues/28)) ([3a2b44b](https://github.com/engineervix/devjournal/commit/3a2b44beff69c451c1f6367bac9c9c9c60fd7f8c))
* **deps:** update dependency edge.js to v6.5.0 ([#45](https://github.com/engineervix/devjournal/issues/45)) ([ded442f](https://github.com/engineervix/devjournal/commit/ded442f39b27f7655fbe0266a2d1507c3a78a479))
* **deps:** update dependency eslint to v9.36.0 ([#22](https://github.com/engineervix/devjournal/issues/22)) ([3c3c798](https://github.com/engineervix/devjournal/commit/3c3c798d30c40c86b51fed7756a53c3cae282c62))
* **deps:** update dependency markdown-it to v14.1.1 ([#52](https://github.com/engineervix/devjournal/issues/52)) ([33fb3f3](https://github.com/engineervix/devjournal/commit/33fb3f34201da73041946c94674a404d224e0134))
* **deps:** update dependency pg to v8.16.3 ([#25](https://github.com/engineervix/devjournal/issues/25)) ([c57cc3e](https://github.com/engineervix/devjournal/commit/c57cc3e25c48a34ad083128b28caceab854344dd))
* **deps:** update dependency pino-sentry-transport to v1.5.1 ([#29](https://github.com/engineervix/devjournal/issues/29)) ([0c46f78](https://github.com/engineervix/devjournal/commit/0c46f785606ac7066dc418f6ead4f4b03a116cd3))
* **deps:** update dependency postcss to v8.5.6 ([#21](https://github.com/engineervix/devjournal/issues/21)) ([80a4905](https://github.com/engineervix/devjournal/commit/80a4905915e734ca7eddea50a42af9eb5410cf64))
* **deps:** update dependency tailwindcss to v3.4.18 ([#30](https://github.com/engineervix/devjournal/issues/30)) ([a477be2](https://github.com/engineervix/devjournal/commit/a477be294e8bac1ad727df387f5dc1f2469162dc))
* **deps:** update dependency ts-node-maintained to v10.9.6 ([#31](https://github.com/engineervix/devjournal/issues/31)) ([ef4c4ba](https://github.com/engineervix/devjournal/commit/ef4c4ba6638433918a0ea05298d416f38e5341c2))
* **deps:** update dependency turndown to v7.2.1 ([#32](https://github.com/engineervix/devjournal/issues/32)) ([0831273](https://github.com/engineervix/devjournal/commit/0831273b3e703c8178d03bbfef3baa641e7829cb))
* **deps:** update dependency ua-parser-js to v2.0.5 ([#26](https://github.com/engineervix/devjournal/issues/26)) ([dc7d266](https://github.com/engineervix/devjournal/commit/dc7d266c179a6ed9ae2a9e587be8565800025f89))
* **deps:** update dependency ua-parser-js to v2.0.9 ([#42](https://github.com/engineervix/devjournal/issues/42)) ([c2d422e](https://github.com/engineervix/devjournal/commit/c2d422e750b66c39bd09bb74ebcc03f9fb9004fd))
* **deps:** update dependency vite to v6.3.6 ([#33](https://github.com/engineervix/devjournal/issues/33)) ([2d4a411](https://github.com/engineervix/devjournal/commit/2d4a411b3adb3dd02bc681e3b66cf20a6b46f454))
* **deps:** update sentry-javascript monorepo to v9.46.0 ([#24](https://github.com/engineervix/devjournal/issues/24)) ([e31e607](https://github.com/engineervix/devjournal/commit/e31e607ed846eca84e8f9441a9bacd9ac729c914))
* ensure test database is available for test suite ([a1c7cc6](https://github.com/engineervix/devjournal/commit/a1c7cc68835550c2c1e87665bd349a2a8e7bab95))


### 👷 CI/CD

* add ports: - 5432:5432 to map the PostgreSQL container's port 5432 to the runner's port 5432 ([620d871](https://github.com/engineervix/devjournal/commit/620d871ed69871ef532c902aeca35598af79c153))
* apparently, secret key should be at least 16 chars ([4620491](https://github.com/engineervix/devjournal/commit/462049139c6bf695e9e9c91eaac5eaaf13dad458))
* change env variables HOST and PORT ([ddbf8b2](https://github.com/engineervix/devjournal/commit/ddbf8b2cb0ec5785ae9435cb37155b0c0e1b5bf0))
* **deps:** update offen/docker-volume-backup docker tag to v2.43.4 ([#23](https://github.com/engineervix/devjournal/issues/23)) ([89a2c35](https://github.com/engineervix/devjournal/commit/89a2c3548a6d63e24686a83b73eba8c5cd8f36ed))
* **deps:** update pgvector/pgvector docker tag to v0.8.1 ([#34](https://github.com/engineervix/devjournal/issues/34)) ([fdbb2c4](https://github.com/engineervix/devjournal/commit/fdbb2c4920cf15cf70890372c20e5b13958a52b5))
* **deps:** update pgvector/pgvector docker tag to v0.8.2 ([#55](https://github.com/engineervix/devjournal/issues/55)) ([382ebda](https://github.com/engineervix/devjournal/commit/382ebda1fd2bc44f56269016be3688df2047538b))
* incorporate stylelint ([5345664](https://github.com/engineervix/devjournal/commit/5345664f6b980485611201a05d4baf400ab17386))
* postgres host ([2e16400](https://github.com/engineervix/devjournal/commit/2e1640087d6f786e4b9c319f3303b14f1c60dccf))
* use 'memory' for SESSION_DRIVER ([279b88e](https://github.com/engineervix/devjournal/commit/279b88e2975fc5bd64a91e5e988862c983636938))
