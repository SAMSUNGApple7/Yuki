/* ============================================
   Yuki Components - Sidebar, Agent Strip, Tasks
   ============================================ */

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ---------- Icons ----------
const Icon = ({ name, size = 18 }) => {
  const paths = {
    home: <><path d="M3 12l9-9 9 9"/><path d="M5 10v10h14V10"/></>,
    target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
    chart: <><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-7"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    bolt: <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/>,
    check: <path d="M5 12l4 4L19 7"/>,
    arrow: <><path d="M5 12h14"/><path d="M13 5l7 7-7 7"/></>,
    plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    menu: <><path d="M3 6h18M3 12h18M3 18h18"/></>,
    x: <><path d="M18 6L6 18"/><path d="M6 6l12 12"/></>,
    sparkle: <><path d="M12 2l1.8 5.4L19 9.2l-5.2 1.8L12 16.4 10.2 11 5 9.2l5.2-1.8z"/><path d="M19 17l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/></>,
    db: <><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></>,
    flame: <path d="M12 2s4 4 4 9a4 4 0 0 1-8 0c0-2 1-3 1-3s-1 5-3 5-2-3-2-5c0-5 8-6 8-6z"/>,
    book: <><path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z"/><path d="M4 17a3 3 0 0 1 3-3h11"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
};

// ---------- Sidebar ----------
function Sidebar({ active, setActive, settings, isOpen, onClose, onOpenSettings }) {
  return (
    <aside className={'sidebar' + (isOpen ? ' open' : '')}>
      <div className="sb-brand">
        <span className="mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M3.34 7l17.32 10M3.34 17l17.32-10M9.5 4.5L12 2l2.5 2.5M9.5 19.5L12 22l2.5-2.5M4.7 5L3.34 7l2.16.8M20.66 17l-2.16-.8.8 2.8M19.3 5L20.66 7l-2.16.8M3.34 17l2.16-.8-.8 2.8"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/>
          </svg>
        </span>
        <span>Yuki</span>
        <span className="sub">v0.1</span>
      </div>

      <div className="sb-section-label">主要</div>
      <nav className="sb-nav">
        <button className={'sb-item' + (active === 'today' ? ' active' : '')} onClick={() => { setActive('today'); onClose && onClose(); }}>
          <Icon name="home" size={16}/> 今日 <span className="badge">3/4</span>
        </button>
        <button className={'sb-item' + (active === 'goals' ? ' active' : '')} onClick={() => { setActive('goals'); onClose && onClose(); }}>
          <Icon name="target" size={16}/> 目标
        </button>
        <button className={'sb-item' + (active === 'review' ? ' active' : '')} onClick={() => { setActive('review'); onClose && onClose(); }}>
          <Icon name="chart" size={16}/> 复盘
        </button>
      </nav>

      <div className="sb-section-label">系统</div>
      <nav className="sb-nav">
        <button className={'sb-item' + (active === 'settings' ? ' active' : '')} onClick={() => { setActive('settings'); onClose && onClose(); }}>
          <Icon name="settings" size={16}/> 设置
        </button>
        <a className="sb-item" href="index.html">
          <Icon name="arrow" size={16}/> 返回首页
        </a>
      </nav>

      <div className="sb-foot">
        <div className="sb-avatar">{(settings.username || 'U').slice(0, 1)}</div>
        <div className="who">
          <strong>{settings.username || '用户'}</strong>
          <span>{settings.provider === 'demo' ? 'Demo 模式' : settings.provider}</span>
        </div>
        <button className="sb-cog" onClick={onOpenSettings} aria-label="设置">
          <Icon name="settings" size={14}/>
        </button>
      </div>
    </aside>
  );
}

// ---------- Agent Strip ----------
function AgentStrip({ agentStates, agentLast }) {
  const agents = [
    { id: 'planner', name: '规划师', en: 'Planner', icon: 'target' },
    { id: 'executor', name: '执行官', en: 'Executor', icon: 'bolt' },
    { id: 'reviewer', name: '复盘师', en: 'Reviewer', icon: 'chart' },
  ];
  const stateLabel = { idle: '待命', thinking: '思考中', done: '已完成', error: '失败' };
  return (
    <div className="agent-strip">
      {agents.map(a => (
        <div key={a.id} className="ag" data-agent={a.id} data-state={agentStates[a.id] || 'idle'}>
          <div className="icon"><Icon name={a.icon} size={18}/></div>
          <div className="meta">
            <div className="row1">
              <span className="name">{a.name}</span>
              <span style={{fontFamily:'var(--font-mono)', fontSize:10, color:'var(--ink-3)', marginLeft:6}}>{a.en}</span>
              <span className="pill">{stateLabel[agentStates[a.id]] || '待命'}</span>
            </div>
            <div className="last">{agentLast[a.id] || '等待任务...'}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Task Item ----------
function TaskItem({ task, onToggle, celebrating }) {
  return (
    <div className={'task' + (task.done ? ' done' : '') + (celebrating ? ' celebrating' : '')}>
      <button className="check" onClick={() => onToggle(task.id)} aria-label="完成">
        <Icon name="check" size={12}/>
      </button>
      <div className="body">
        <div className="row1">
          <span className="title">{task.title}</span>
          {task.goalTitle && <span className="tag">{task.goalTitle}</span>}
          {task.est && <span className="tag tag-time">⏱ {task.est}min</span>}
          {task.agent && (
            <span className="tag tag-agent">
              {task.agent === 'planner' ? '规划师推荐' : task.agent === 'executor' ? '执行官分配' : '复盘师建议'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Composer ----------
function Composer({ onSend, busy, placeholder }) {
  const [v, setV] = useState('');
  const ref = useRef(null);
  const submit = () => {
    const t = v.trim();
    if (!t || busy) return;
    onSend(t);
    setV('');
  };
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = Math.min(160, ref.current.scrollHeight) + 'px';
    }
  }, [v]);
  return (
    <div className="composer-wrap">
      <div className="composer">
        <textarea
          ref={ref}
          value={v}
          onChange={e => setV(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder={placeholder || '告诉 Yuki 你的想法...'}
          disabled={busy}
          rows={1}
        />
        <div className="actions">
          <button className="send" onClick={submit} disabled={busy || !v.trim()} aria-label="发送">
            {busy
              ? <Icon name="sparkle" size={14}/>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>
            }
          </button>
        </div>
      </div>
      <div className="composer-hint" style={{textAlign:'center', marginTop:8, fontFamily:'var(--font-mono)', fontSize:10, color:'var(--ink-3)'}}>
        Enter 发送 · Shift+Enter 换行 · 你的输入将由三个 Agent 协同处理
      </div>
    </div>
  );
}

// ---------- Memory Inspector ----------
function MemoryInspector({ state, open, onToggle }) {
  const snapshot = useMemo(() => YukiEngine.memorySnapshot(state), [state]);
  const formatted = useMemo(() => {
    const json = JSON.stringify(snapshot, null, 2);
    return json
      .replace(/"([^"]+)":/g, '<span class="k">"$1"</span>:')
      .replace(/: ("[^"]*")/g, ': <span class="s">$1</span>')
      .replace(/: (true|false|null|\d+\.?\d*)/g, ': <span class="n">$1</span>');
  }, [snapshot]);
  return (
    <>
      <button className="mem-toggle" onClick={onToggle} aria-label="Memory">
        <Icon name="db" size={18}/>
      </button>
      {open && (
        <div className="mem-panel">
          <div className="mem-head">
            <span className="label">SHARED_MEMORY.JSON</span>
            <button className="sb-cog" onClick={onToggle} aria-label="关闭"><Icon name="x" size={14}/></button>
          </div>
          <div className="mem-body" dangerouslySetInnerHTML={{ __html: formatted }} />
        </div>
      )}
    </>
  );
}

// ---------- Activity Log ----------
function ActivityLog({ activity }) {
  const labels = { user: '你', planner: '规划师', executor: '执行官', reviewer: '复盘师' };
  return (
    <div className="activity">
      <h4>共享 Memory · 活动流</h4>
      <div className="activity-list">
        {activity.slice().reverse().map((a, i) => (
          <div key={i} className="activity-item" data-agent={a.agent}>
            <span className="ts mono">{a.ts}</span>
            <span className="who">{labels[a.agent] || a.agent}</span>
            <span className="what">{a.summary}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { Icon, Sidebar, AgentStrip, TaskItem, Composer, MemoryInspector, ActivityLog });
