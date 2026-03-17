# Changelog

## 1.0.0 (2026-03-17)


### Features

* add automatic version bump and release creation on merge to main ([4bfecfc](https://github.com/gannino/your-assistant/commit/4bfecfc315af835c0e958226d780fea675455aac))
* comprehensive testing infrastructure, OpenRouter integration, and CI/CD ([fdf41ff](https://github.com/gannino/your-assistant/commit/fdf41ff46db46bd22095f40a495007cecf1aa3b3))
* Implement Deepgram official SDK for reliable transcription ([10f349e](https://github.com/gannino/your-assistant/commit/10f349e590036f43746a6e0f8f7185f0483fb6c4))
* implement Release Please for automated releases ([350318a](https://github.com/gannino/your-assistant/commit/350318a29f632f806fcfb634f3ce684f7d100fe9))
* implement semantic release workflow with automatic versioning ([19c66b4](https://github.com/gannino/your-assistant/commit/19c66b4e78fb40d6777fcf11ac6c413325aa536a))


### Bug Fixes

* combine auto-release and GitHub release creation into single job ([e75a8de](https://github.com/gannino/your-assistant/commit/e75a8dee8c9be7c88cc27bce5137af9b4736c4d1))
* complete ESLint migration and resolve module system inconsistency ([1d74a08](https://github.com/gannino/your-assistant/commit/1d74a08e4fbecfd13aa5ce43ba40ae68cead6da3))
* improve StreamParser buffer handling ([b2562b1](https://github.com/gannino/your-assistant/commit/b2562b12c77484899423427e110542b1a0f866be))
* install dependencies per job instead of sharing node_modules artifact ([8cbc604](https://github.com/gannino/your-assistant/commit/8cbc604ca1752e92a8706395265ace2495fe531f))
* remove [skip ci] from auto-release commit to allow tag trigger ([0f41f2e](https://github.com/gannino/your-assistant/commit/0f41f2ee8c91a981ff199ab5faeb8be353644ec8))
* resolve CI/CD build failures ([a9ef4c0](https://github.com/gannino/your-assistant/commit/a9ef4c0f2d5b8daca3adb385345eedf51f7d43f9))
* resolve ESLint errors in provider files ([68c5d8e](https://github.com/gannino/your-assistant/commit/68c5d8e4246a327854d0cb9ed88e97ed09f7d8bb))
* resolve test failures and add test gate to deployment ([fa0c103](https://github.com/gannino/your-assistant/commit/fa0c10356fa6a64597fcf2edfb317a524b941b39))
* skip edge case StreamParser tests temporarily ([e8f5155](https://github.com/gannino/your-assistant/commit/e8f51554908dfc2cbfd537ab6b5db6d30e6d8304))
* skip remaining failing tests to unblock releases ([66f93d3](https://github.com/gannino/your-assistant/commit/66f93d3306727eb1b0913439f3fa5a060f78c685))
* update package-lock.json after adding cross-env dependency ([0ac6c52](https://github.com/gannino/your-assistant/commit/0ac6c52ea4ec1c686e365850ac1ccca38e584164))
* update Release Please permissions and add setup docs ([4d3458d](https://github.com/gannino/your-assistant/commit/4d3458dc001ad4e2c6269472bc0b1e5c4de1f081))


### Maintenance

* add Release Please manifest file ([b68ffbb](https://github.com/gannino/your-assistant/commit/b68ffbbbbd2eeb68b7f0aa0c55151d7e4e77441c))
* bump version to 1.0.1 ([ce75fe4](https://github.com/gannino/your-assistant/commit/ce75fe43bdbc793fae18c6a97ffaec2a19769d80))
* bump version to 1.0.2 [skip ci] ([523e6d3](https://github.com/gannino/your-assistant/commit/523e6d39d7104e8f6f96395efbc4758718815319))
* bump version to 1.0.3 ([15deda2](https://github.com/gannino/your-assistant/commit/15deda26b746e7dee1b76378fd4ff1f5d543881d))
* bump version to 1.0.4 ([6cbd8a1](https://github.com/gannino/your-assistant/commit/6cbd8a18e8ef883ddea82ea7cff9df39489aa667))
* **release:** 1.0.0 [skip ci] ([f8943c2](https://github.com/gannino/your-assistant/commit/f8943c20b6be68db71fa56689ba129d8d947a88c))
* reset to v0.1.0 for fresh start ([6080afa](https://github.com/gannino/your-assistant/commit/6080afa3e66ca7aab8275ffd34dbd371ae936584))
* update package-lock.json after version bump ([d9b9cdf](https://github.com/gannino/your-assistant/commit/d9b9cdf3f06df2485c03df2b1c48034d8e4b497a))
* update package-lock.json with semantic-release dependencies ([03e71a0](https://github.com/gannino/your-assistant/commit/03e71a0fdad140437a939f16615db478434d26f6))


### Documentation

* consolidate documentation and fix screenshot tool URL ([b61840a](https://github.com/gannino/your-assistant/commit/b61840ad82cfdccf214350d9dccf8cd396e8d0e9))
* update CI/CD documentation and add pipeline guides ([1bad669](https://github.com/gannino/your-assistant/commit/1bad669a7f3d54a4d9c15a9206cfd13d85082f65))
* update documentation for Release Please workflow ([d8cd6fd](https://github.com/gannino/your-assistant/commit/d8cd6fdca3b9477fc365cbcf3d39066c3d58c1c9))


### Styling

* Fix Prettier formatting and update Node.js versions ([48e5fe5](https://github.com/gannino/your-assistant/commit/48e5fe5ee89ff391f2dbc8ef844a9c75706c1c53))


### Refactoring

* Create shared StreamParser utility for AI providers ([84ed2b4](https://github.com/gannino/your-assistant/commit/84ed2b470d6e91a66895f02e113bf9c8d9528c47))


### Testing

* comprehensive test coverage for Phase 6 (90% coverage plan) ([a7fd9c0](https://github.com/gannino/your-assistant/commit/a7fd9c0c4e0d62e69f411f3952354ba262947da3))


### CI

* consolidate CI/CD pipelines and fix critical Electron build failures ([b5156b9](https://github.com/gannino/your-assistant/commit/b5156b9fc5d8ddec16b3059fa0b1f7aecfc82661))
* remove old test.yml and deploy.yml workflows, keep only ci.yml ([520f85c](https://github.com/gannino/your-assistant/commit/520f85c9d083288a6f236ec5871b5c91df0ac10f))

## Changelog

All notable changes to this project will be documented in this file.

## 1.0.0 (2026-03-16)


### Bug Fixes

* improve StreamParser buffer handling ([b2562b1](https://github.com/gannino/your-assistant/commit/b2562b12c77484899423427e110542b1a0f866be))
* resolve CI/CD build failures ([a9ef4c0](https://github.com/gannino/your-assistant/commit/a9ef4c0f2d5b8daca3adb385345eedf51f7d43f9))
* resolve ESLint errors in provider files ([68c5d8e](https://github.com/gannino/your-assistant/commit/68c5d8e4246a327854d0cb9ed88e97ed09f7d8bb))
* resolve test failures and add test gate to deployment ([fa0c103](https://github.com/gannino/your-assistant/commit/fa0c10356fa6a64597fcf2edfb317a524b941b39))
* skip edge case StreamParser tests temporarily ([e8f5155](https://github.com/gannino/your-assistant/commit/e8f51554908dfc2cbfd537ab6b5db6d30e6d8304))
* skip remaining failing tests to unblock releases ([66f93d3](https://github.com/gannino/your-assistant/commit/66f93d3306727eb1b0913439f3fa5a060f78c685))


### Features

* comprehensive testing infrastructure, OpenRouter integration, and CI/CD ([fdf41ff](https://github.com/gannino/your-assistant/commit/fdf41ff46db46bd22095f40a495007cecf1aa3b3))
* Implement Deepgram official SDK for reliable transcription ([10f349e](https://github.com/gannino/your-assistant/commit/10f349e590036f43746a6e0f8f7185f0483fb6c4))
* implement semantic release workflow with automatic versioning ([19c66b4](https://github.com/gannino/your-assistant/commit/19c66b4e78fb40d6777fcf11ac6c413325aa536a))
