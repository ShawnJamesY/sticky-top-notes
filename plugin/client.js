window.__ModuleLoader__.load({
  id: '@shawnjamesy/dsh-sticky-top-notes',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect } = React;

    const STORAGE_KEY = 'dsh-sticky-top-notes.v1';
    const MAX_STRIP_NOTES = 3;
    const NS = 'sticky-top-notes';

    const zh = {
      viewAll: '查看全部',
      placeholder: '输入便签，回车添加',
      empty: '暂无便签',
      title: '全部便签',
      created: '创建于',
      completed: '完成于',
      clearDone: '清空已完成',
      maxStripLabel: '顶部显示',
      maxStripUnit: '条',
      maxStripHint: '（1–10，即时生效）',
      copyAll: '复制全部 (txt)',
      copied: '已复制 ✓',
      edit: '编辑',
      editLabel: '编辑便签，回车保存',
      del: '删除',
      todoTitle: '点击完成',
      doneTitle: '点击取消完成',
      close: '关闭',
      total: (n, d) => `共 ${n} 条 · 已完成 ${d}`,
    };
    const en = {
      viewAll: 'View all',
      placeholder: 'New note, press Enter',
      empty: 'No notes yet',
      title: 'All notes',
      created: 'Created',
      completed: 'Completed',
      clearDone: 'Clear completed',
      maxStripLabel: 'Show on top bar',
      maxStripUnit: '',
      maxStripHint: '(1–10, applies instantly)',
      copyAll: 'Copy all (txt)',
      copied: 'Copied ✓',
      edit: 'Edit',
      editLabel: 'Edit note, Enter to save',
      del: 'Delete',
      todoTitle: 'Mark as done',
      doneTitle: 'Mark as not done',
      close: 'Close',
      total: (n, d) => `${n} notes · ${d} done`,
    };

    // locale service binds in apply(); zh is the fallback
    let boundT = null;
    function t(key) {
      try {
        if (boundT) {
          const v = boundT(key);
          if (typeof v === 'string' && v) return v;
        }
      } catch (e) { /* fall through */ }
      return zh[key] || key;
    }

    // note store: browser-local, never enters model context
    function loadNotes() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(arr)) return [];
        return arr.filter((n) => n && typeof n.text === 'string' && typeof n.createdAt === 'number');
      } catch (e) {
        return [];
      }
    }

    let notes = loadNotes();
    const listeners = new Set();
    function save() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); } catch (e) { /* ignore */ }
    }
    function commit() {
      save();
      // new array reference each commit: React bails out on identical references
      const snapshot = notes.slice();
      listeners.forEach((fn) => fn(snapshot));
    }
    function useNotes() {
      const [value, setValue] = useState(notes);
      useEffect(() => {
        listeners.add(setValue);
        return () => listeners.delete(setValue);
      }, []);
      return value;
    }
    function orderNotes(list) {
      const active = list.filter((n) => !n.completedAt).sort((a, b) => b.createdAt - a.createdAt);
      const done = list.filter((n) => n.completedAt).sort((a, b) => b.completedAt - a.completedAt);
      return active.concat(done);
    }
    function toggleNote(id) {
      notes = notes.map((n) => (n.id === id
        ? { ...n, completedAt: n.completedAt ? null : Date.now() }
        : n));
      commit();
    }
    function addNote(text) {
      notes = notes.concat({
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        text,
        createdAt: Date.now(),
        completedAt: null,
      });
      commit();
    }
    function removeNote(id) { notes = notes.filter((n) => n.id !== id); commit(); }
    function updateNote(id, text) {
      notes = notes.map((n) => (n.id === id ? { ...n, text } : n));
      commit();
    }
    function clearDone() { notes = notes.filter((n) => !n.completedAt); commit(); }

    // settings: how many notes show on the top bar
    const SETTINGS_KEY = 'dsh-sticky-top-notes.settings.v1';
    const MAX_STRIP_LIMIT = 10;
    function loadSettings() {
      try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        const obj = raw ? JSON.parse(raw) : {};
        const n = parseInt(obj && obj.maxStrip, 10);
        return { maxStrip: Number.isFinite(n) ? Math.min(Math.max(n, 1), MAX_STRIP_LIMIT) : MAX_STRIP_NOTES };
      } catch (e) {
        return { maxStrip: MAX_STRIP_NOTES };
      }
    }
    let settings = loadSettings();
    const settingsListeners = new Set();
    function commitSettings() {
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) { /* ignore */ }
      const snapshot = { ...settings };
      settingsListeners.forEach((fn) => fn(snapshot));
    }
    function setMaxStrip(n) {
      const value = parseInt(n, 10);
      if (!Number.isFinite(value)) return;
      settings = { ...settings, maxStrip: Math.min(Math.max(value, 1), MAX_STRIP_LIMIT) };
      commitSettings();
    }
    function useSettings() {
      const [value, setValue] = useState(settings);
      useEffect(() => {
        settingsListeners.add(setValue);
        return () => settingsListeners.delete(setValue);
      }, []);
      return value;
    }

    function fmt(ts) {
      const d = new Date(ts);
      const p = (x) => String(x).padStart(2, '0');
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
    }
    function noteTitle(note) {
      return `${t('created')} ${fmt(note.createdAt)}${note.completedAt ? ` · ${t('completed')} ${fmt(note.completedAt)}` : ''}`;
    }

    function NoteCheckbox({ note }) {
      return h('input', {
        type: 'checkbox',
        className: 'stn-cb',
        checked: !!note.completedAt,
        title: note.completedAt ? `${t('completed')} ${fmt(note.completedAt)} · ${t('doneTitle')}` : t('todoTitle'),
        onChange: () => toggleNote(note.id),
      });
    }

    function Panel({ pos, onClose }) {
      const list = useNotes();
      const settingsValue = useSettings();
      const doneCount = list.filter((n) => n.completedAt).length;
      const [editingId, setEditingId] = useState(null);
      const [editDraft, setEditDraft] = useState('');
      const [copied, setCopied] = useState(false);
      useEffect(() => {
        const onKey = (e) => {
          if (e.key !== 'Escape') return;
          if (editingId) { setEditingId(null); return; }
          onClose();
        };
        const onDown = (e) => {
          if (!e.target.closest || (!e.target.closest('.stn-panel') && !e.target.closest('.stn-iconbtn'))) onClose();
        };
        document.addEventListener('keydown', onKey);
        document.addEventListener('mousedown', onDown);
        return () => {
          document.removeEventListener('keydown', onKey);
          document.removeEventListener('mousedown', onDown);
        };
      }, [onClose, editingId]);

      const startEdit = (note) => { setEditingId(note.id); setEditDraft(note.text); };
      const commitEdit = () => {
        const text = editDraft.trim();
        if (editingId && text) updateNote(editingId, text);
        setEditingId(null);
      };

      const copyAll = () => {
        const ordered = orderNotes(list);
        const head = `${t('title')}（${t('total')(list.length, doneCount)}）`;
        const body = ordered.map((n) => {
          const mark = n.completedAt ? '[x]' : '[ ]';
          const times = n.completedAt
            ? `${t('created')} ${fmt(n.createdAt)} · ${t('completed')} ${fmt(n.completedAt)}`
            : `${t('created')} ${fmt(n.createdAt)}`;
          return `${mark} ${n.text}（${times}）`;
        }).join('\n');
        const text = `${head}\n\n${body}`;
        const done = () => { setCopied(true); setTimeout(() => setCopied(false), 1500); };
        const fallback = () => {
          try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;opacity:0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
            done();
          } catch (e) { /* ignore */ }
        };
        try {
          const p = navigator.clipboard && navigator.clipboard.writeText(text);
          if (p && typeof p.then === 'function') p.then(done, fallback); else fallback();
        } catch (e) { fallback(); }
      };

      return h('div', {
        className: 'stn-panel', role: 'dialog', 'aria-label': t('title'),
        style: { top: pos.top, right: pos.right },
      },
        h('div', { className: 'stn-phead' },
          h('b', null, t('title')),
          h('span', { className: 'stn-pstat' }, t('total')(list.length, doneCount)),
          h('button', { className: 'stn-x', onClick: onClose, 'aria-label': t('close') }, '✕')),
        h('div', { className: 'stn-plist' },
          list.length === 0
            ? h('div', { className: 'stn-pempty' }, t('empty'))
            : orderNotes(list).map((note) => h('div', {
                key: note.id,
                className: 'stn-prow' + (note.completedAt ? ' stn-pdone' : ''),
              },
                h(NoteCheckbox, { note }),
                editingId === note.id
                  ? h('input', {
                      className: 'stn-pedit',
                      value: editDraft,
                      autoFocus: true,
                      'aria-label': t('editLabel'),
                      onChange: (e) => setEditDraft(e.target.value),
                      onKeyDown: (e) => {
                        if (e.nativeEvent && e.nativeEvent.isComposing) return;
                        if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
                      },
                      onBlur: commitEdit,
                    })
                  : h('div', { className: 'stn-pgrow' },
                      h('div', { className: 'stn-ptxt', onDoubleClick: () => startEdit(note) }, note.text),
                      h('div', { className: 'stn-pmeta' }, noteTitle(note), note.completedAt ? ' ✓' : '')),
                h('button', { className: 'stn-pdel', onClick: () => startEdit(note) }, t('edit')),
                h('button', { className: 'stn-pdel', onClick: () => removeNote(note.id) }, t('del')),
              ))),
        h('div', { className: 'stn-pset' },
          h('span', { className: 'stn-psetlabel' }, t('maxStripLabel')),
          h('input', {
            className: 'stn-psetnum',
            type: 'number', min: 1, max: 10, step: 1,
            value: settingsValue.maxStrip,
            'aria-label': t('maxStripLabel'),
            onChange: (e) => setMaxStrip(e.target.value),
          }),
          h('span', { className: 'stn-psetunit' }, t('maxStripUnit')),
          h('span', { className: 'stn-psethint' }, t('maxStripHint'))),
        h('div', { className: 'stn-pfoot' },
          h('button', { className: 'stn-pcopy', onClick: copyAll, disabled: list.length === 0 },
            copied ? t('copied') : t('copyAll')),
          doneCount > 0
            ? h('button', { onClick: () => clearDone() }, t('clearDone'))
            : null));
    }

    const LIST_ICON = h('svg', {
      viewBox: '0 0 12 12', width: 9, height: 9, 'aria-hidden': true, fill: 'none',
    },
      h('path', { d: 'M1.5 2.5h9M1.5 6h9M1.5 9.5h6', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }));

    function Strip() {
      const list = useNotes();
      const settingsValue = useSettings();
      const [draft, setDraft] = useState('');
      const [panelPos, setPanelPos] = useState(null);
      const shown = orderNotes(list).slice(0, settingsValue.maxStrip);

      const submitFrom = (el) => {
        const text = (el.value || '').trim();
        if (text) { addNote(text); setDraft(''); }
      };
      const onKeyDown = (e) => {
        if (e.key !== 'Enter') return;
        if (e.nativeEvent && e.nativeEvent.isComposing) {
          // IME Enter confirms composition: submit after it commits
          const el = e.currentTarget;
          setTimeout(() => submitFrom(el), 0);
          return;
        }
        e.preventDefault();
        submitFrom(e.currentTarget);
      };
      const togglePanel = (e) => {
        if (panelPos) { setPanelPos(null); return; }
        const r = e.currentTarget.getBoundingClientRect();
        setPanelPos({ top: r.bottom + 6, right: Math.max(8, window.innerWidth - r.right) });
      };

      return h('div', { className: 'stn-strip', 'data-stn-strip': true },
        h('style', null, CSS),
        h('div', { className: 'stn-notes' },
          shown.length === 0
            ? h('span', { className: 'stn-empty' }, t('empty'))
            : shown.map((note) => h('span', {
                key: note.id,
                className: 'stn-note' + (note.completedAt ? ' stn-done' : ''),
                title: noteTitle(note),
              },
                h('span', { className: 'stn-txt' }, note.text),
                h(NoteCheckbox, { note }),
              ))),
        h('input', {
          className: 'stn-input',
          value: draft,
          placeholder: t('placeholder'),
          'aria-label': t('placeholder'),
          onChange: (e) => setDraft(e.target.value),
          onKeyDown,
        }),
        h('button', {
          className: 'stn-iconbtn',
          onClick: togglePanel,
          title: t('viewAll'),
          'aria-label': t('viewAll'),
          'aria-expanded': !!panelPos,
        }, LIST_ICON, list.length ? h('span', { className: 'stn-cnt' }, list.length) : null),
        panelPos ? h(Panel, { pos: panelPos, onClose: () => setPanelPos(null) }) : null);
    }

    // ── Styles (theme tokens only) ──
    const CSS = `
.stn-strip{box-sizing:border-box;width:100%;height:20px;display:flex;align-items:center;gap:6px;padding:0 8px;overflow:hidden;flex:none;background:transparent;border-bottom:.5px solid var(--dsw-alias-border-l1)}
.stn-notes{display:flex;align-items:center;gap:6px;flex:1;min-width:0;overflow:hidden}
/* sticky-note yellow + dark ink */
.stn-note{display:flex;align-items:center;gap:5px;height:16px;padding:0 7px;border-radius:999px;flex:none;font-size:11.5px;line-height:16px;font-weight:400;white-space:nowrap;color:#3d2e00;background:#ffd94d;border:.5px solid #d9a800}
.stn-note.stn-done{color:var(--dsw-alias-label-secondary);background:color-mix(in srgb,var(--dsw-alias-label-secondary) 10%,transparent);border-color:transparent}
.stn-note.stn-done .stn-txt{text-decoration:line-through}
.stn-txt{max-width:180px;overflow:hidden;text-overflow:ellipsis}
.stn-empty{font-size:10.5px;line-height:14px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.stn-cb{appearance:none;-webkit-appearance:none;box-sizing:border-box;width:10px;height:10px;margin:0;flex:none;cursor:pointer;border:1.2px solid #3d2e00;border-radius:3px;background:transparent;position:relative;padding:0}
.stn-cb:checked{background:#3d2e00;border-color:#3d2e00}
.stn-cb:checked::after{content:"";position:absolute;left:2px;top:0;width:3.5px;height:6px;border:solid #ffd94d;border-width:0 1.4px 1.4px 0;transform:rotate(42deg)}
.stn-note.stn-done .stn-cb,.stn-pdone .stn-cb{border-color:var(--dsw-alias-label-secondary)}
.stn-note.stn-done .stn-cb:checked,.stn-pdone .stn-cb:checked{background:var(--dsw-alias-label-secondary);border-color:var(--dsw-alias-label-secondary)}
.stn-note.stn-done .stn-cb:checked::after,.stn-pdone .stn-cb:checked::after{border-color:var(--dsw-alias-bg-base)}
.stn-input{box-sizing:border-box;height:14px;width:120px;flex:none;font-size:10.5px;line-height:13px;font-family:inherit;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base);border:.5px solid var(--dsw-alias-border-l2);border-radius:999px;padding:0 8px;outline:none}
.stn-input::placeholder{color:var(--dsw-alias-label-secondary)}
.stn-input:focus{border-color:var(--dsw-alias-state-warn-primary)}
.stn-iconbtn{box-sizing:border-box;height:14px;min-width:14px;padding:0 4px;display:flex;align-items:center;justify-content:center;gap:2px;cursor:pointer;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-base);border:.5px solid var(--dsw-alias-border-l2);border-radius:999px;font-size:9.5px;line-height:1}
.stn-iconbtn:hover{color:var(--dsw-alias-state-warn-primary);border-color:var(--dsw-alias-state-warn-primary)}
.stn-cnt{color:var(--dsw-alias-state-warn-primary);font-weight:600}
.stn-input:focus-visible,.stn-iconbtn:focus-visible,.stn-cb:focus-visible,.stn-x:focus-visible,.stn-pdel:focus-visible{outline:1.5px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.stn-panel{position:fixed;width:400px;max-width:calc(100vw - 24px);max-height:min(460px,70vh);display:flex;flex-direction:column;background:var(--dsw-alias-bg-layer-1);border:.5px solid var(--dsw-alias-border-l1);border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.45);z-index:1000;overflow:hidden;font-size:12px;color:var(--dsw-alias-label-primary)}
.stn-phead{display:flex;align-items:baseline;gap:8px;padding:10px 14px;border-bottom:.5px solid var(--dsw-alias-border-l1);flex:none}
.stn-pstat{font-size:11px;color:var(--dsw-alias-label-secondary)}
.stn-x{margin-left:auto;background:none;border:none;cursor:pointer;color:var(--dsw-alias-label-secondary);font-size:12px;padding:2px 6px;border-radius:4px;line-height:1}
.stn-x:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}
.stn-plist{overflow-y:auto;padding:4px 6px}
.stn-prow{display:flex;align-items:center;gap:10px;padding:7px 8px;border-radius:8px}
.stn-prow:hover{background:var(--dsw-alias-bg-layer-2)}
.stn-pgrow{flex:1;min-width:0}
.stn-ptxt{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--dsw-alias-state-warn-primary);font-weight:600}
.stn-pdone .stn-ptxt{color:var(--dsw-alias-label-secondary);text-decoration:line-through;font-weight:400}
.stn-pmeta{font-size:11px;color:var(--dsw-alias-label-secondary);margin-top:2px}
.stn-pdel{visibility:hidden;flex:none;background:none;border:none;cursor:pointer;font-size:11px;color:var(--dsw-alias-label-secondary);padding:2px 4px;border-radius:4px}
.stn-prow:hover .stn-pdel{visibility:visible}
.stn-pdel:hover{color:var(--dsw-alias-state-error-primary)}
.stn-pedit{flex:1;min-width:0;box-sizing:border-box;height:22px;font-size:12px;line-height:20px;font-family:inherit;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base);border:.5px solid var(--dsw-alias-state-warn-primary);border-radius:6px;padding:0 8px;outline:none}
.stn-pset{flex:none;display:flex;align-items:center;gap:6px;padding:8px 14px;border-top:.5px solid var(--dsw-alias-border-l1);font-size:11px;color:var(--dsw-alias-label-secondary)}
.stn-psetlabel{white-space:nowrap}
.stn-psetnum{box-sizing:border-box;width:44px;height:20px;font-size:11px;line-height:18px;font-family:inherit;text-align:center;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base);border:.5px solid var(--dsw-alias-border-l2);border-radius:6px;padding:0 2px;outline:none}
.stn-psetnum:focus{border-color:var(--dsw-alias-state-warn-primary)}
.stn-psethint{opacity:.7;white-space:nowrap}
.stn-pfoot{flex:none;display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 14px;border-top:.5px solid var(--dsw-alias-border-l1)}
.stn-pfoot button{background:none;border:none;cursor:pointer;font-size:11px;color:var(--dsw-alias-label-secondary);padding:2px 4px;border-radius:4px}
.stn-pfoot button:disabled{opacity:.45;cursor:default}
.stn-pfoot .stn-pcopy:hover:not(:disabled){color:var(--dsw-alias-state-success-primary)}
.stn-pfoot button:hover:not(.stn-pcopy):not(:disabled){color:var(--dsw-alias-state-error-primary)}
.stn-pempty{padding:14px;font-size:12px;color:var(--dsw-alias-label-secondary)}
/* promote the leading seat to a full-width row above the session header;
   scoped by :has() so it dies with our strip; class renames degrade to inline */
.wSkVaW_header:has([data-stn-strip]){grid-template-rows:20px auto}
.wSkVaW_header:has([data-stn-strip]) .wSkVaW_headerLeading{grid-area:1/1/2/-1}
.wSkVaW_header:has([data-stn-strip]) .wSkVaW_titleRow{grid-row:2;grid-column:2}
.wSkVaW_header:has([data-stn-strip]) .wSkVaW_tabs{grid-row:3}
`;

    return {
      inject: ['slots'],
      apply(ctx) {
        try {
          const localeSvc = ctx.get('locale');
          if (localeSvc && typeof localeSvc.register === 'function' && typeof localeSvc.bind === 'function') {
            const disposes = [
              localeSvc.register(NS, 'zh-CN', zh),
              localeSvc.register(NS, 'zh', zh),
              localeSvc.register(NS, 'en', en),
            ];
            boundT = localeSvc.bind(NS);
            ctx.effect(() => () => { disposes.forEach((d) => { try { d(); } catch (e) { /* ignore */ } }); }, 'sticky-top-notes locale');
          }
        } catch (e) {
          console.error('sticky-top-notes: locale binding failed', e);
        }

        // styles render inside Strip as a component-local <style> element

        ctx.slots.inject('conversation.header.leading', () => ctx.slots.register({
          name: 'conversation.header.leading',
        }, Strip));
      },
    };
  },
});
