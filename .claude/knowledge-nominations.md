# Knowledge Nominations

Candidate learnings from agents and sessions. The auditor reviews these
during each audit cycle and promotes valid ones to knowledge-base.md.

## Pending Nominations

- [032126] /wrap-up: Vue Test Utils computed property testing - computed properties return their actual value (not wrapped), so test expectations must match the return type (e.g., attachmentCount returns "1 PDF" not 1) | Evidence: ContentSettings.spec.js testing
- [032126] /wrap-up: Jest toContain vs toContainEqual - toContain only checks for primitive values or object references, use toContainEqual for deep equality checks on objects/arrays | Evidence: ContentSettings.spec.js test fixes
- [032126] /wrap-up: Vue component test strategy for complex views - focus on core functionality (state management, computed properties, basic methods) while avoiding complex async mocking to achieve 60%+ coverage efficiently | Evidence: ContentSettings.vue test approach (1853 lines → 60.15% coverage with 39 focused tests)
