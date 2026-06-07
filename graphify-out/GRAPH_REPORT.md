# Graph Report - .  (2026-06-07)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 284 nodes · 471 edges · 17 communities (14 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e11aeb05`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 13|Community 13]]

## God Nodes (most connected - your core abstractions)
1. `logger` - 16 edges
2. `getSettingsStore()` - 15 edges
3. `compilerOptions` - 14 edges
4. `compilerOptions` - 13 edges
5. `build` - 10 edges
6. `IPC` - 10 edges
7. `scripts` - 8 edges
8. `nsis` - 8 edges
9. `useSettingsStore` - 7 edges
10. `WritingStyle` - 7 edges

## Surprising Connections (you probably didn't know these)
- `stopRecording()` --calls--> `sendToOverlay()`  [EXTRACTED]
  src/main/hotkeys.ts → src/main/ipc/window.ipc.ts
- `getGroqService()` --calls--> `getSettingsStore()`  [EXTRACTED]
  src/main/ipc/audio.ipc.ts → src/main/store.ts
- `getAIEditor()` --calls--> `getSettingsStore()`  [EXTRACTED]
  src/main/ipc/audio.ipc.ts → src/main/store.ts
- `saveApiKeyToStore()` --calls--> `getSettingsStore()`  [EXTRACTED]
  src/main/services/ApiKeyService.ts → src/main/store.ts
- `startRecording()` --calls--> `sendToOverlay()`  [EXTRACTED]
  src/main/hotkeys.ts → src/main/ipc/window.ipc.ts

## Import Cycles
- None detected.

## Communities (17 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.10
Nodes (21): getAIEditor(), getGroqService(), registerAudioIPC(), resetGroqServices(), getDb(), pruneOldHistory(), registerHistoryIPC(), registerSettingsIPC() (+13 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (21): DashboardApp(), NAV_ITEMS, Page, Sidebar(), SidebarProps, formatRelativeTime(), HistoryCard(), HomePage() (+13 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (34): author, build, appId, copyright, directories, files, npmRebuild, nsis (+26 more)

### Community 3 - "Community 3"
Cohesion: 0.10
Nodes (11): voxScribeAPI, Window, COMMAND_PROMPTS, STYLE_PROMPTS, sleep(), IAIEditor, ICommandProcessor, ITranscriptionProvider (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.13
Nodes (18): getDashboardWindow(), registerWindowIPC(), sendToOverlay(), setWindowRefs(), showCommandPalette(), showOverlay(), getIsRecording(), handleKeyDown() (+10 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (20): devDependencies, electron, electron-builder, @electron/rebuild, @electron-toolkit/utils, eslint, @eslint/js, react (+12 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, baseUrl, esModuleInterop, jsx, lib, module, moduleResolution (+10 more)

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (17): compilerOptions, baseUrl, esModuleInterop, lib, module, moduleResolution, outDir, paths (+9 more)

### Community 9 - "Community 9"
Cohesion: 0.21
Nodes (3): STATE_CONFIG, RecordingState, useRecordingStore

### Community 10 - "Community 10"
Cohesion: 0.20
Nodes (10): dependencies, dotenv, electron-store, electron-updater, groq-sdk, @nut-tree-fork/nut-js, sql.js, uiohook-napi (+2 more)

## Knowledge Gaps
- **105 isolated node(s):** `name`, `version`, `description`, `main`, `author` (+100 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Community 5` to `Community 2`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `logger` connect `Community 0` to `Community 3`, `Community 4`, `Community 6`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _105 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09898989898989899 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09388335704125178 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.058823529411764705 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.0960591133004926 - nodes in this community are weakly interconnected._