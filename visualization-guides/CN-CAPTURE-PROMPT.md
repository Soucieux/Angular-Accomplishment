# Prompt for Claude Code — capture the 14 Chinese screenshots

Run Claude Code in the project root (the Playwright MCP in `.mcp.json` must be active), make sure
`ng serve` is running and you are logged into the app. Then paste everything below.

---

Use the Playwright MCP to capture 14 screenshots of the Reminder page with the app in Chinese, and
save them to `visualization-guides/cn-captures/`. Do not modify any app source, and do not commit.

**Setup**

1. Open `http://localhost:4200/reminder` in the Playwright browser at `deviceScaleFactor: 2` and a
   viewport wide enough that `.rm-card-grid` lays out in **2 columns** (the reference images are 2-up).
2. Run `localStorage.setItem('app_locale','zh')` then reload, and confirm the masthead reads 提醒.
3. Wait until `.rm-new-card-input` exists and `.skeleton-card` count is 0 — the CloudBase backend can
   take 10–20 s on first load.
4. Inject `*{animation:none !important;transition:none !important}` so nothing is captured mid-fade.
5. Take **element screenshots** (`locator.screenshot()`), not full-page crops.

**Sample data to create (delete it all at the end)**

| Title | Category | Date | Time |
|---|---|---|---|
| 交水电费 | 日常 | 2026-07-29 | 09:00 – 10:00 |
| 给植物浇水 | 个人 | none | none |
| 续借图书证 | 其他 | 2026-07-21 | none |
| 晨跑三十分钟 | 个人 | none | none (only used for the complete dialog) |

**The 14 shots** — file name, target size, and required state:

| File | Size | State to capture |
|---|---|---|
| `cn-masthead.png` | 2186×238 | `.rm-masthead`, with the 3 cards existing |
| `cn-composer-empty.png` | 2186×180 | `.rm-new-card`, empty, placeholder 提醒我关于… |
| `cn-composer-typed.png` | 2186×180 | `.rm-new-card` with 交水电费 typed and 日常 chip selected |
| `cn-date-popover.png` | 648×190 | `div.p-popover-content` right after clicking 添加日期 |
| `cn-calendar.png` | 612×630 | `.p-datepicker-panel` open (July 2026) |
| `cn-time-dropdown.png` | 656×522 | open start-time list scrolled so 08:30 is the first visible option |
| `cn-popover-filled.png` | 696×248 | popover showing 09:00 – 10:00 and 2026-07-29 |
| `cn-composer-chips.png` | 2186×180 | `.rm-new-card` with date + time chips and 添加 enabled |
| `cn-card-first.png` | 1078×298 | the created 交水电费 card |
| `cn-card-editing.png` | 1078×298 | same card with its title mid-edit as 交水电和网费 (revert to 交水电费 after) |
| `cn-grid.png` | 2186×616 | `.rm-card-grid` with all 3 cards |
| `cn-dialog-complete.png` | 760×404 | 完成 confirm dialog (tick 晨跑三十分钟's checkbox) |
| `cn-filter.png` | 2186×56 | `.rm-filter-bar` with the 日常 chip active |
| `cn-dialog-delete.png` | 760×404 | 删除 confirm dialog (bin icon on 续借图书证) |

**Selectors that work**

- composer `.rm-new-card`, input `.rm-new-card-input`, category chips `.rm-new-card .rm-category-chip`
- add-link / add-date buttons `.rm-new-card .rm-add-field-button`, submit `.rm-new-card .rm-confirm-button`
- date popover `.rm-popover-body` inside `div.p-popover-content`; date field is its `input`
- calendar day cells `.p-datepicker-panel span[data-date="2026-6-29"]` (month is 0-indexed)
- time selects `.rm-popover-body .p-select`; options `.p-select-list-container .p-select-option`
- card `.rm-card:not(.skeleton-card)`, title `.rm-card-title-input`, checkbox `.rm-checkbox`, bin `.rm-delete-button`
- filter chips `.rm-filter-bar .rm-filter-chip`; dialogs `.p-dialog`, buttons labelled 取消 / 确认

**Cleanup**

Delete all four sample reminders when finished and confirm the grid is empty. Note that completing
晨跑三十分钟 permanently increments the 已完成 counter — that is expected.

**Known issue worth checking first:** the PrimeNG datepicker still renders month and day names in
English under the zh locale, so `cn-calendar.png` will show "July 2026". Fix the datepicker locale
first if you want that shot fully Chinese.
