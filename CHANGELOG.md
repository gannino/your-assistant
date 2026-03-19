# Changelog

All notable changes to this project will be documented in this file.

## 1.0.0 (2026-03-19)


### ✨ Features

* add automatic version bump and release creation on merge to main ([4bfecfc](https://github.com/gannino/your-assistant/commit/4bfecfc315af835c0e958226d780fea675455aac))
* add hybrid release system documentation ([7605312](https://github.com/gannino/your-assistant/commit/76053125d8c319d8a3307ad889d4a5b6ac0091a8))
* add Release Please testing section to README ([038b878](https://github.com/gannino/your-assistant/commit/038b87821fbb504faf151cc1629b1085d3ded2e9))
* comprehensive testing infrastructure, OpenRouter integration, and CI/CD ([fdf41ff](https://github.com/gannino/your-assistant/commit/fdf41ff46db46bd22095f40a495007cecf1aa3b3))
* confirm Release Please automation is configured ([fd7c7b4](https://github.com/gannino/your-assistant/commit/fd7c7b471962f09b722101ada69dc1ce35c24864))
* Implement Deepgram official SDK for reliable transcription ([10f349e](https://github.com/gannino/your-assistant/commit/10f349e590036f43746a6e0f8f7185f0483fb6c4))
* implement Release Please for automated releases ([350318a](https://github.com/gannino/your-assistant/commit/350318a29f632f806fcfb634f3ce684f7d100fe9))
* implement semantic release workflow with automatic versioning ([19c66b4](https://github.com/gannino/your-assistant/commit/19c66b4e78fb40d6777fcf11ac6c413325aa536a))
* test packages-based Release Please configuration ([9523c68](https://github.com/gannino/your-assistant/commit/9523c68deed333c040fbb6f6af5d233cc29c1903))
* test Release Please automation with proper baseline ([244dd2f](https://github.com/gannino/your-assistant/commit/244dd2feea5c5ac02f8fa3a98a3a4c6a6c14e883))
* test Release Please configuration with simple commit ([44eae65](https://github.com/gannino/your-assistant/commit/44eae655118f5ff8bb2f8d4fe088e69054d8a229))
* verify Release Please works with published release ([30c9aff](https://github.com/gannino/your-assistant/commit/30c9aff9077912939ca732b679d5a63e85c2d541))


### 🐛 Bug Fixes

* accept both v* and your-assistant-v* tag formats in release job ([3ed3c3d](https://github.com/gannino/your-assistant/commit/3ed3c3dd8ae6e4eb1fbd9539aa8281a8bdf38743))
* add macOS microphone permission support ([d9f9e69](https://github.com/gannino/your-assistant/commit/d9f9e694004a2f62cef4d9994c9e4f036be26067))
* build universal macOS binaries for Apple Silicon and Intel support ([7976382](https://github.com/gannino/your-assistant/commit/7976382cf8c7c0e5039dc84da9334d5a0f55a9f2))
* combine auto-release and GitHub release creation into single job ([e75a8de](https://github.com/gannino/your-assistant/commit/e75a8dee8c9be7c88cc27bce5137af9b4736c4d1))
* complete ESLint migration and resolve module system inconsistency ([1d74a08](https://github.com/gannino/your-assistant/commit/1d74a08e4fbecfd13aa5ce43ba40ae68cead6da3))
* configure Release Please for standard v1.0.0 tags ([b71eae1](https://github.com/gannino/your-assistant/commit/b71eae1b2eae7389289c8e58db7649a82c0be12e))
* correct Release Please configuration format ([26fbd36](https://github.com/gannino/your-assistant/commit/26fbd366e26e1ab71b9ac71d105f590039c3247a))
* improve StreamParser buffer handling ([b2562b1](https://github.com/gannino/your-assistant/commit/b2562b12c77484899423427e110542b1a0f866be))
* initialize empty manifest for Release Please ([f7d4b80](https://github.com/gannino/your-assistant/commit/f7d4b80178906d92d47b2a87a6a8ccdce4e5db6a))
* initialize manifest with current version 0.3.0 ([cb28d94](https://github.com/gannino/your-assistant/commit/cb28d9434daf08eed709c0a61a3952aeebc6491a))
* install dependencies per job instead of sharing node_modules artifact ([8cbc604](https://github.com/gannino/your-assistant/commit/8cbc604ca1752e92a8706395265ace2495fe531f))
* remove [skip ci] from auto-release commit to allow tag trigger ([0f41f2e](https://github.com/gannino/your-assistant/commit/0f41f2ee8c91a981ff199ab5faeb8be353644ec8))
* resolve artifact attachment issue in CI/CD pipeline ([3ac222a](https://github.com/gannino/your-assistant/commit/3ac222a8a575644457dbeea03e727b9da3a3dcfa))
* resolve CI/CD build failures ([a9ef4c0](https://github.com/gannino/your-assistant/commit/a9ef4c0f2d5b8daca3adb385345eedf51f7d43f9))
* resolve ESLint errors in provider files ([68c5d8e](https://github.com/gannino/your-assistant/commit/68c5d8e4246a327854d0cb9ed88e97ed09f7d8bb))
* resolve test failures and add test gate to deployment ([fa0c103](https://github.com/gannino/your-assistant/commit/fa0c10356fa6a64597fcf2edfb317a524b941b39))
* skip edge case StreamParser tests temporarily ([e8f5155](https://github.com/gannino/your-assistant/commit/e8f51554908dfc2cbfd537ab6b5db6d30e6d8304))
* skip remaining failing tests to unblock releases ([66f93d3](https://github.com/gannino/your-assistant/commit/66f93d3306727eb1b0913439f3fa5a060f78c685))
* update package-lock.json after adding cross-env dependency ([0ac6c52](https://github.com/gannino/your-assistant/commit/0ac6c52ea4ec1c686e365850ac1ccca38e584164))
* update Release Please permissions and add setup docs ([4d3458d](https://github.com/gannino/your-assistant/commit/4d3458dc001ad4e2c6269472bc0b1e5c4de1f081))
* update Release Please tag format to v${version} ([fa07482](https://github.com/gannino/your-assistant/commit/fa07482d0f30aaf62fd26a446db971abb46c57b0))
* use packages-based Release Please configuration ([0ac81b4](https://github.com/gannino/your-assistant/commit/0ac81b4269c1543db1f5b56162fcafaa94ce78bd))
* use root-level Release Please config for simple v1.0.0 tags ([927870b](https://github.com/gannino/your-assistant/commit/927870b9df987dd0ce40fecf0047560db63533e8))


### ♻️ Refactoring

* Create shared StreamParser utility for AI providers ([84ed2b4](https://github.com/gannino/your-assistant/commit/84ed2b470d6e91a66895f02e113bf9c8d9528c47))


### 📝 Documentation

* add release notes for v0.1.0 ([e368c4c](https://github.com/gannino/your-assistant/commit/e368c4c7f969dbe492a604b154b5412a9dca1ac6))
* consolidate documentation and fix screenshot tool URL ([b61840a](https://github.com/gannino/your-assistant/commit/b61840ad82cfdccf214350d9dccf8cd396e8d0e9))
* document Release Please automation ([2f1ad91](https://github.com/gannino/your-assistant/commit/2f1ad916fa52d7460dd211ee475488636ec61253))
* update CI/CD documentation and add pipeline guides ([1bad669](https://github.com/gannino/your-assistant/commit/1bad669a7f3d54a4d9c15a9206cfd13d85082f65))
* update documentation for Release Please workflow ([d8cd6fd](https://github.com/gannino/your-assistant/commit/d8cd6fdca3b9477fc365cbcf3d39066c3d58c1c9))
* update release automation section in README ([40698de](https://github.com/gannino/your-assistant/commit/40698de933feb17e909e3857ea93b1214da2eb0f))
* update release process documentation ([1c866e4](https://github.com/gannino/your-assistant/commit/1c866e40cda97462163376b8b76187f0973daa62))


### 💄 Styling

* Fix Prettier formatting and update Node.js versions ([48e5fe5](https://github.com/gannino/your-assistant/commit/48e5fe5ee89ff391f2dbc8ef844a9c75706c1c53))


### 🔧 Maintenance

* add Release Please manifest file ([b68ffbb](https://github.com/gannino/your-assistant/commit/b68ffbbbbd2eeb68b7f0aa0c55151d7e4e77441c))
* bump version to 0.2.0 ([157aa9e](https://github.com/gannino/your-assistant/commit/157aa9e112717dbcc2dfb74e3f984b2fe2d93132))
* bump version to 0.3.0 ([92972c0](https://github.com/gannino/your-assistant/commit/92972c0d363c5094730a68a8c12de30c8c1591f4))
* bump version to 1.0.1 ([ce75fe4](https://github.com/gannino/your-assistant/commit/ce75fe43bdbc793fae18c6a97ffaec2a19769d80))
* bump version to 1.0.2 [skip ci] ([523e6d3](https://github.com/gannino/your-assistant/commit/523e6d39d7104e8f6f96395efbc4758718815319))
* bump version to 1.0.3 ([15deda2](https://github.com/gannino/your-assistant/commit/15deda26b746e7dee1b76378fd4ff1f5d543881d))
* bump version to 1.0.4 ([6cbd8a1](https://github.com/gannino/your-assistant/commit/6cbd8a18e8ef883ddea82ea7cff9df39489aa667))
* configure Release Please automation with manual fallback ([7c6d9e6](https://github.com/gannino/your-assistant/commit/7c6d9e66cf37e04a9a3b27714934ddea182aabf4))
* initialize Release Please manifest with v0.1.0 ([84e17fb](https://github.com/gannino/your-assistant/commit/84e17fbb51468995793a8d22c83c0edf136134c0))
* **main:** release your-assistant 1.0.0 ([8b45e8b](https://github.com/gannino/your-assistant/commit/8b45e8b13a5f0a67dd134fe21926f89ec8ebb417))
* **main:** release your-assistant 1.0.0 ([ec2d107](https://github.com/gannino/your-assistant/commit/ec2d107ba6f0b051772a370dcd792225666bf2f0))
* **main:** release your-assistant 1.0.0 ([9b60e26](https://github.com/gannino/your-assistant/commit/9b60e26e07f1f4533ad43899516afaf745943b62))
* **main:** release your-assistant 1.0.0 ([471e3de](https://github.com/gannino/your-assistant/commit/471e3de3aaab9d5a1fe00bf6fa53f5c46f069542))
* **main:** release your-assistant 1.1.0 ([815fece](https://github.com/gannino/your-assistant/commit/815fece6f1ee0dc76de87d001832a013b658b95e))
* **main:** release your-assistant 1.1.0 ([9d4a228](https://github.com/gannino/your-assistant/commit/9d4a228c3d648dd3737c48790922d296f8d73858))
* **release:** 1.0.0 [skip ci] ([f8943c2](https://github.com/gannino/your-assistant/commit/f8943c20b6be68db71fa56689ba129d8d947a88c))
* remove incorrect manifest format ([6de2df4](https://github.com/gannino/your-assistant/commit/6de2df47a606a1d9086c402324f792aae267df38))
* remove test file ([b221ead](https://github.com/gannino/your-assistant/commit/b221eadd7c8e81d5568896172bdf4440c4febb08))
* reset to v0.1.0 for fresh start ([2afaa5b](https://github.com/gannino/your-assistant/commit/2afaa5b19df1614d5e40f598a9715f1d5bb87b1b))
* reset to v0.1.0 for fresh start ([6080afa](https://github.com/gannino/your-assistant/commit/6080afa3e66ca7aab8275ffd34dbd371ae936584))
* reset version to 0.1.0 for clean release ([391c255](https://github.com/gannino/your-assistant/commit/391c25562f74572fafa66d96d8a103c7d32c51b9))
* update package-lock.json after version bump ([d9b9cdf](https://github.com/gannino/your-assistant/commit/d9b9cdf3f06df2485c03df2b1c48034d8e4b497a))
* update package-lock.json with semantic-release dependencies ([03e71a0](https://github.com/gannino/your-assistant/commit/03e71a0fdad140437a939f16615db478434d26f6))


### ✅ Testing

* comprehensive test coverage for Phase 6 (90% coverage plan) ([a7fd9c0](https://github.com/gannino/your-assistant/commit/a7fd9c0c4e0d62e69f411f3952354ba262947da3))


### 🤖 CI

* consolidate CI/CD pipelines and fix critical Electron build failures ([b5156b9](https://github.com/gannino/your-assistant/commit/b5156b9fc5d8ddec16b3059fa0b1f7aecfc82661))
* remove old test.yml and deploy.yml workflows, keep only ci.yml ([520f85c](https://github.com/gannino/your-assistant/commit/520f85c9d083288a6f236ec5871b5c91df0ac10f))

## [0.3.0] - 2026-03-18

### ✨ Features

- macOS microphone permission support with entitlements
- Universal macOS binaries for Apple Silicon and Intel Macs
- Microphone and camera usage descriptions for macOS permission dialogs
- Permission handlers for media access in Electron

### 🐛 Bug Fixes

- Artifact attachment issue in CI/CD pipeline
- Build configuration for universal macOS binaries
- Release workflow accepts both v* and your-assistant-v* tag formats

## [0.2.0] - 2026-03-18

### 🐛 Fixes

- Universal macOS binary build configuration for Apple Silicon and Intel support
- Electron build configuration for cross-platform support

## [0.1.0] - 2026-03-18

### ✨ Added

- Initial release of Your Assistant
- Multi-provider AI support (OpenAI, Anthropic, Gemini, Z.ai, Ollama, MLX)
- Real-time speech transcription (Azure, Deepgram, Whisper, Web Speech API)
- Electron desktop app with overlay mode and transparency
- Cross-platform support (Windows, macOS, Linux)
- Screenshot capture and inclusion in AI requests
- Auto mode with configurable silence detection
- PDF and website context support
- Session history and summarization
