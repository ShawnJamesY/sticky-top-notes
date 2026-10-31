# Sticky Notes Top Bar for DSH

A [DSH](https://github.com/deepseek-ai/DeepSeek-Harness) plugin that adds a **fixed 20px sticky-note strip** above the main chat panel — a lightweight todo area for humans only; data never enters the model context.

![icon](icon.svg)

English | [简体中文](README.zh.md)

## Features

- Fixed 20px strip above the session header; never expands or covers built-in UI
- Classic sticky-note look: bright-yellow pills with dark ink; completed notes gray out with strikethrough
- One-click complete with completion timestamp; uncheck to restore
- Quick entry at the right end (Enter to add, IME-safe for CJK)
- View-all panel: timestamps, inline edit (double-click / Enter save / Esc cancel), delete, clear completed, **copy all as txt**, and a setting for how many notes (1–10) show on the top bar — instant and persistent
- Data in browser `localStorage` only

## Install

```
install_bundle  target=/absolute/path/to/this/package    # local directory
install_bundle  target=<git-url>#plugin # git source
```

Restart DSH, then refresh the Web GUI.

## Usage

| Action | How |
|---|---|
| Add a note | Type in the right-end input, press Enter |
| Complete / restore | Click the note's checkbox |
| Edit a note | View-all → double-click text (or hover → Edit) |
| Copy everything | View-all → Copy all (txt) |
| Top-bar count | View-all → "Show on top bar", enter 1–10 |

## Data

| Data | Where | Key |
|---|---|---|
| Notes | `localStorage` | `dsh-sticky-top-notes.v1` |
| Settings | `localStorage` | `dsh-sticky-top-notes.settings.v1` |

Survives restarts; not synced across browsers; cleared with site data.

## Notes

- Pure Client plugin (`index.js` is an empty `apply()`).
- Mounts `conversation.header.leading`, promoted to a full-width row via `:has()`-scoped grid overrides; degrades to inline if host class names change.
- Styles are a component-local `<style>` element; colors use DSW theme tokens except the sticky-note yellow (intentional deviation).
- Locale service with zh fallback.

## Files

```
plugin/
├── package.json  cordis.patch.yml  index.js  client.js  icon.svg
├── locale/{en,zh}.json
├── README.md  README.zh.md  LICENSE
```

## Uninstall

```
remove_bundle  target=@shawnjamesy/dsh-sticky-top-notes
```

## License

MIT
