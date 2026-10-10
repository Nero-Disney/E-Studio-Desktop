# Implementation Notes

## Step 0 / 1 — Tauri Shell Baseline
- Created branch `desktop-real` from clean baseline.
- Verified TypeScript diagnostics (`tsc --noEmit`) passes with 0 errors.
- Installed Tauri 2 dependencies: `@tauri-apps/api`, `@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-fs`, `@tauri-apps/cli`.
- Initialized `src-tauri/` crate structure: `Cargo.toml`, `build.rs`, `src/main.rs`, `src/lib.rs`, `capabilities/default.json`.
- Configured `tauri.conf.json` with product `E-Studio`, ID `com.estudio.desktop`, min size 1280x800, strict IPC/asset CSP.
- Added `tauri`, `tauri:dev`, and `tauri:build` scripts in `package.json`.
- Restarted development server on port 3000; Vite dev server is running and verified live.
- Acceptance: Existing React application (`src/app/App.tsx`) UI opens unchanged with 0 compile/lint errors.

## Step 2 — Single Schema, Delete the Fake Architecture
- Enforced single template model in src/types.ts with required id, revision, created_at, updated_at.
- Added PrintJob and PrintJobStatus types for subsequent job persistence.
- Refactored src/app/App.tsx: template selection, navigation, saving, duplication, and deletion now keyed by id.
- Duplication in App.tsx creates deep item clones with unique UUID, name suffix ' - Copie', and revision = 1.
- Updated src/components/HomeDashboard.tsx to pass template.id on delete and key cards by template.id.
- Converted NewGabaritWizard.tsx state and JSX to use snake_case millimetres (width_mm, height_mm).
- Updated README.md specifications to use snake_case millimetre schema; confirmed 0 occurrences of widthMm.
- Verified removal of dead paths (src/features, src/domains, src/app/store, src/app/routes.tsx, databaseService.ts).
- Ran TypeScript check (tsc --noEmit) with 0 errors and verified Vite build succeeds.
- Acceptance: UI runs using existing components keyed by id, zero widthMm across repo, single template schema.

## Step 3 — SQLite in Rust
- Integrated rusqlite (bundled), whoami, and chrono into src-tauri/Cargo.toml.
- Implemented SQLite migrations on startup in src-tauri/src/db.rs targeting {app_data_dir}/estudio.sqlite.
- Created tables: templates, template_revisions, products (with scan/partno indexes), import_batches, print_jobs, audit, and kv.
- Authored robust Tauri commands in src-tauri/src/commands.rs returning Result<T, String> without raw WebView SQL.
- Implemented template validation in template_save (name non-empty, finite width/height between 0 and 2000 mm).
- Configured revision tracking: new templates insert revision 1, updates increment revision and record template_revisions.
- Implemented catalog_search, catalog_upsert (transactional), catalog_replace_all, print jobs, and kv preferences.
- Handled audit_append with immutable OS user from whoami runtime, ignoring untrusted WebView inputs.
- Mounted commands and initialized DbState in src-tauri/src/lib.rs; added temporary dev-only test button in HomeDashboard.
- Acceptance: tsc passes with 0 errors; Tauri IPC command contracts wired to durable SQLite tables on disk.

## Step 4 — Wire UI to SQLite, Eliminate localStorage
- Created src/services/api.ts with typed IPC bridges and browser preview memory store for zero-localStorage execution.
- Connected template CRUD in src/app/App.tsx directly to SQLite commands (template_list, template_get, template_save, template_delete).
- Replaced catalog repository localStorage persistence in src/services/catalogRepository.ts with SQLite catalog and import history.
- Migrated audit trail in src/services/auditLogService.ts and AuditTrailModal.tsx to SQLite audit table with whoami runtime OS user.
- Migrated mapping dictionary in src/utils/mappingDictionary.ts and font manager in src/utils/fontManager.ts to SQLite kv storage.
- Migrated omni-channel rules in src/components/OmniChannelStudioModal.tsx and UI settings in src/context/TooltipContext.tsx to SQLite kv.
- Removed periodic auto-save to localStorage in src/components/TemplateEditor.tsx; all mutations now sync to SQLite.
- Completely purged hardcoded "Opérateur Local" strings across App.tsx, BatchSpoolerModal.tsx, and CatalogManagementStudio.tsx.
- Zero localStorage occurrences remaining in application code; verified clean build with npx tsc --noEmit and compile_applet.
- Acceptance: Durable SQLite storage completely replaces localStorage for all templates, catalog, rules, dictionary, audit, and prefs.
