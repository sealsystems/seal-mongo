## 3.0.2 (2020-08-11)

### Chores


set tlsAllowInvalidCertificates according to NODE_TLS_REJECT_UNAUTHORIZED ([ed2cad7](https://github.com/sealsystems/node-mongo/commit/ed2cad7))

## 3.0.1 (2020-08-07)

### Bug Fixes


do not validate certs if self signed certs are used ([e5209d5](https://github.com/sealsystems/node-mongo/commit/e5209d5))

## 3.0.0 (2020-08-06)

### Chores


bump [@sealsystems](https://github.com/sealsystems)/log from 2.2.1 to 2.2.2 ([#108](https://github.com/sealsystems/node-mongo/issues/108)) ([65cb642](https://github.com/sealsystems/node-mongo/commit/65cb642))

bump [@sealsystems](https://github.com/sealsystems)/tlscert from 2.3.7 to 2.3.8 ([#110](https://github.com/sealsystems/node-mongo/issues/110)) ([780d9f3](https://github.com/sealsystems/node-mongo/commit/780d9f3))

### Features


Use nodejs driver 3.6.0 ([f248bb5](https://github.com/sealsystems/node-mongo/commit/f248bb5))



### BREAKING CHANGES

Because of the new driver and the use of new unified topology the thrown connect errors changed from `MongoNetworkError` to `MongoServerSelectionError`.
Maybe additional work needs to be done in the `node-assert-mongo-error` repository to check for that errors.

## 2.4.8 (2020-03-11)

### Chores


#### bump [@sealsystems](https://github.com/sealsystems)/log from 2.2.0 to 2.2.1 ([#82](https://github.com/sealsystems/node-mongo/issues/82)) ([0e16b11](https://github.com/sealsystems/node-mongo/commit/0e16b11))

#### bump [@sealsystems](https://github.com/sealsystems)/tlscert from 2.3.0 to 2.3.1 ([#81](https://github.com/sealsystems/node-mongo/issues/81)) ([8cc4431](https://github.com/sealsystems/node-mongo/commit/8cc4431))

#### bump [@sealsystems](https://github.com/sealsystems)/tlscert from 2.3.1 to 2.3.7 ([#83](https://github.com/sealsystems/node-mongo/issues/83)) ([b564970](https://github.com/sealsystems/node-mongo/commit/b564970))



---

## 2.4.7 (2020-03-08)

### Chores


#### Release on nomjs.org ([3da8e62](https://github.com/sealsystems/node-mongo/commit/3da8e62))



---

## 2.4.6 (2020-03-08)

### Chores


#### Publish on npmjs ([8b4de78](https://github.com/sealsystems/node-mongo/commit/8b4de78))

#### Release on npmjs.org ([6e4ddc8](https://github.com/sealsystems/node-mongo/commit/6e4ddc8))

#### Release package on npmjs.org ([4d688ad](https://github.com/sealsystems/node-mongo/commit/4d688ad))



---

## 2.4.6 (2020-03-08)

### Chores


#### Publish on npmjs ([8b4de78](https://github.com/sealsystems/node-mongo/commit/8b4de78))

#### Release on npmjs.org ([6e4ddc8](https://github.com/sealsystems/node-mongo/commit/6e4ddc8))

#### Release package on npmjs.org ([4d688ad](https://github.com/sealsystems/node-mongo/commit/4d688ad))



---

## 2.4.5 (2020-03-08)

### Chores


#### Publish on npmjs ([17d423e](https://github.com/sealsystems/node-mongo/commit/17d423e))



---

## 2.4.4 (2020-03-08)

### Chores


#### Add workflow to publish on npmjs.org ([88d3eca](https://github.com/sealsystems/node-mongo/commit/88d3eca))



---

## 2.4.3 (2020-03-07)

### Chores


#### Remove CircleCI and AppVeyor configuration ([3453ac7](https://github.com/sealsystems/node-mongo/commit/3453ac7))



---

## 2.4.2 (2020-03-07)

### Chores


#### Update GitHub Actions config ([1f7556f](https://github.com/sealsystems/node-mongo/commit/1f7556f))



---

## 2.4.1 (2020-02-12)

### Bug Fixes


#### noCursorTimeout and collectionSize removed from mongoConnect.options, [PLS-558](https://jira.sealsystems.de/jira/browse/PLS-558) ([50f6cc3](https://github.com/sealsystems/node-mongo/commit/50f6cc3))

### Chores


#### bump async-retry from 1.2.3 to 1.3.1 ([2e76cd3](https://github.com/sealsystems/node-mongo/commit/2e76cd3))

Bumps async-retry from 1.2.3 to 1.3.1.

Signed-off-by: dependabot-preview[bot] <support@dependabot.com>


---

## 2.4.0 (2019-11-19)

### Features


#### Added option to disable cursor timeouts ([8d25e35](https://github.com/sealsystems/node-mongo/commit/8d25e35))



---

## 2.3.0 (2019-10-18)

### Features


#### PLS-431, [PLS-431](https://jira.sealsystems.de/jira/browse/PLS-431) ([a1574f3](https://github.com/sealsystems/node-mongo/commit/a1574f3))

- Updated dependencies
 - Used `seal-node:oss-module-update`


---

## 2.2.8 (2019-10-15)

### Chores


#### bump [@sealsystems](https://github.com/sealsystems)/tlscert from 2.2.1 to 2.3.0 ([55bf849](https://github.com/sealsystems/node-mongo/commit/55bf849))

Bumps [@sealsystems/tlscert](https://github.com/sealsystems/node-tlscert) from 2.2.1 to 2.3.0.
- [Release notes](https://github.com/sealsystems/node-tlscert/releases)
- [Changelog](https://github.com/sealsystems/node-tlscert/blob/master/CHANGELOG.md)
- [Commits](https://github.com/sealsystems/node-tlscert/compare/2.2.1...2.3.0)

Signed-off-by: dependabot-preview[bot] <support@dependabot.com>


---

## 2.2.7 (2019-10-09)

### Chores


#### bump [@sealsystems](https://github.com/sealsystems)/tlscert from 2.2.0 to 2.2.1 ([54d4482](https://github.com/sealsystems/node-mongo/commit/54d4482))

Bumps [@sealsystems/tlscert](https://github.com/sealsystems/node-tlscert) from 2.2.0 to 2.2.1.
- [Release notes](https://github.com/sealsystems/node-tlscert/releases)
- [Changelog](https://github.com/sealsystems/node-tlscert/blob/master/CHANGELOG.md)
- [Commits](https://github.com/sealsystems/node-tlscert/compare/2.2.0...2.2.1)

Signed-off-by: dependabot-preview[bot] <support@dependabot.com>


---

## 2.2.6 (2019-09-25)

### Chores


#### bump [@sealsystems](https://github.com/sealsystems)/tlscert from 2.1.2 to 2.2.0 ([8761fb1](https://github.com/sealsystems/node-mongo/commit/8761fb1))

Bumps [@sealsystems/tlscert](https://github.com/sealsystems/node-tlscert) from 2.1.2 to 2.2.0.
- [Release notes](https://github.com/sealsystems/node-tlscert/releases)
- [Changelog](https://github.com/sealsystems/node-tlscert/blob/master/CHANGELOG.md)
- [Commits](https://github.com/sealsystems/node-tlscert/compare/2.1.2...2.2.0)

Signed-off-by: dependabot-preview[bot] <support@dependabot.com>


---

## 2.2.5 (2019-09-10)

### Chores


#### Use public NPM registry for references in package-lock.json ([94aeac3](https://github.com/sealsystems/node-mongo/commit/94aeac3))



---

## 2.2.4 (2019-09-10)

### Chores


#### linted ([21abeb8](https://github.com/sealsystems/node-mongo/commit/21abeb8))

#### removed warnings from mongo lib and fixed definition of sleep ([ecafb1d](https://github.com/sealsystems/node-mongo/commit/ecafb1d))



---

## 2.2.3 (2019-09-09)

### Chores


#### rename .eslintrc (deprecated) -> .eslintrc.json ([2a2883d](https://github.com/sealsystems/node-mongo/commit/2a2883d))

#### update mongodb requirement from 3.1.10 to 3.3.2 ([8359329](https://github.com/sealsystems/node-mongo/commit/8359329))



---

## 2.2.2 (2018-12-03)

### Bug Fixes


#### Trigger build ([1341ab4](https://github.com/sealsystems/node-mongo/commit/1341ab4))



---

## 2.2.1 (2018-11-13)



---

## 2.2.0 (2018-09-09)

### Features


#### Use semantic-release ([bcb0289](https://github.com/sealsystems/node-mongo/commit/bcb0289))



---
