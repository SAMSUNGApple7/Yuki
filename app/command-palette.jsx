/* ============================================================================
   Yuki Command Palette  ·  ⌘K
   ----------------------------------------------------------------------------
   设计参考：Linear / Raycast / VSCode Command Palette
   特性：
     · ⌘K 打开、ESC 关闭、↑↓ 选择、Enter 执行
     · 模糊搜索 (按 token 命中)
     · 分组：导航 / Agent / 目标 / 系统
     · 显示当前活跃目标，可快速切换
     · 每项显示快捷键
   ============================================================================ */

const { useState: ucpS, useEffect: ucpE, useMemo: ucpM, useRef: ucpR } = React;

function CommandPalette({ open, onClose, onCommand, state }) {
  const [q, setQ] = ucpS('');
  const [cur, setCur] = ucpS(0);
  const inputRef = ucpR(null);
  const listRef = ucpR(null);

  const ICON = {
    '导航': '↗', 'Agent': '◆', '目标': '◎', '系统': '⌥', '切换活跃目标': '○',
  };

  // —— Build command list ——
  const commands = ucpM(() => {
    const items = [
      // 导航
      { id: 'nav-today',    group: '导航', label: '前往 · 今日',    hint: 'G T', action: () => onCommand('navigate', 'today') },
      { id: 'nav-goals',    group: '导航', label: '前往 · 目标',    hint: 'G G', action: () => onCommand('navigate', 'goals') },
      { id: 'nav-review',   group: '导航', label: '前往 · 复盘',    hint: 'G R', action: () => onCommand('navigate', 'review') },
      { id: 'nav-settings', group: '导航', label: '前往 · 设置',    hint: 'G S', action: () => onCommand('navigate', 'settings') },

      // Agent
      { id: 'agent-planner',  group: 'Agent', label: '调用 · 规划师 (重新拆解当前目标)', hint: '',     action: () => onCommand('new-goal') },
      { id: 'agent-executor', group: 'Agent', label: '调用 · 执行官 (推送今日任务)',     hint: '⌘ E',  action: () => onCommand('agent', 'executor') },
      { id: 'agent-reviewer', group: 'Agent', label: '调用 · 复盘师 (生成本周报告)',     hint: '⇧⌘R',  action: () => onCommand('agent', 'reviewer') },

      // 目标
      { id: 'goal-new', group: '目标', label: '新建目标', hint: '⌘ N', action: () => onCommand('new-goal') },

      // 系统
      { id: 'sys-memory', group: '系统', label: '切换 Memory Inspector', hint: '⌘ M', action: () => onCommand('toggle-memory') },
      { id: 'sys-export', group: '系统', label: '导出 Memory 为 JSON',   hint: '',    action: () => onCommand('export') },
      { id: 'sys-reset',  group: '系统', label: '重置为 Demo 数据',      hint: '',    action: () => onCommand('reset') },
    ];

    // 动态：当前所有目标作为可切换项
    (state.goals || []).forEach(g => {
      items.push({
        id: 'switch-' + g.id,
        group: '切换活跃目标',
        label: (state.activeGoalId === g.id ? '● ' : '○ ') + g.title,
        hint: state.activeGoalId === g.id ? 'ACTIVE' : '',
        action: () => onCommand('set-active-goal', g.id),
      });
    });

    return items;
  }, [state, onCommand]);

  // —— Fuzzy search ——
  const filtered = ucpM(() => {
    const query = q.trim().toLowerCase();
    if (!query) return commands;
    return commands.filter(c => {
      const hay = (c.group + ' ' + c.label).toLowerCase();
      return query.split(/\s+/).every(tok => hay.includes(tok));
    });
  }, [commands, q]);

  // Reset selection when filter changes
  ucpE(() => { setCur(0); }, [q, open]);

  // Auto-focus input when opened
  ucpE(() => {
    if (open) {
      setQ('');
      setCur(0);
      setTimeout(() => inputRef.current && inputRef.current.focus(), 30);
    }
  }, [open]);

  // Scroll selected into view
  ucpE(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector('[data-cp-item="' + cur + '"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }, [cur, filtered.length]);

  // Keyboard handling
  ucpE(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCur(i => Math.min(filtered.length - 1, i + 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCur(i => Math.max(0, i - 1));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const item = filtered[cur];
        if (item) {
          item.action();
          onClose();
        }
        return;
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, filtered, cur, onClose]);

  if (!open) return null;

  // Group by .group field
  const groups = [];
  const seen = new Set();
  filtered.forEach((c, idx) => {
    let g = groups.find(g => g.name === c.group);
    if (!g) { g = { name: c.group, items: [] }; groups.push(g); }
    g.items.push({ ...c, _absIndex: idx });
  });

  return (
    <div className="cp-bg" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cp" role="dialog" aria-label="命令面板">
        <div className="cp-input-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="键入命令、目标名或动作…"
            autoFocus
          />
          <span style={{fontFamily:'var(--font-mono)', fontSize:10, color:'var(--ink-3)', letterSpacing:'0.04em'}}>
            <kbd>↑↓</kbd> 移动 <kbd>↵</kbd> 执行 <kbd>esc</kbd> 关闭
          </span>
        </div>

        <div className="cp-results" ref={listRef}>
          {filtered.length === 0 && (
            <div className="cp-empty">没有匹配的命令 · 试试输入"复盘"、"目标"</div>
          )}

          {groups.map(g => (
            <div key={g.name} className="cp-group">
              <div className="cp-group-label">{g.name}</div>
              {g.items.map(item => (
                <button
                  key={item.id}
                  data-cp-item={item._absIndex}
                  className={'cp-item' + (item._absIndex === cur ? ' active' : '')}
                  onMouseEnter={() => setCur(item._absIndex)}
                  onClick={() => { item.action(); onClose(); }}
                >
                  <span className="cp-ico">{ICON[item.group] || '·'}</span>
                  <span className="cp-label">{item.label}</span>
                  {item.hint && <span className="cp-hint">{item.hint}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="cp-footer">
          <span>YUKI · COMMAND PALETTE · {filtered.length} 项</span>
          <span style={{marginLeft:'auto'}}>{state.goals?.length || 0} 个目标 · Day {state.day}</span>
        </div>
      </div>
    </div>
  );
}

// Expose globally for main.jsx
window.CommandPalette = CommandPalette;
