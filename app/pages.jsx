/* ============================================
   Yuki Pages - Today, Goals, Review, Settings
   ============================================ */

const { useState: usePg, useEffect: useEffPg, useMemo: useMemoPg, useCallback: useCbPg } = React;

// ---------- Today Page ----------
function TodayPage({ state, setState, settings, runAgent }) {
  const goal = state.goals.find(g => g.id === state.activeGoalId);
  const todayTasks = goal ? goal.tasks.filter(t => t.day === state.day) : [];
  const doneCount = todayTasks.filter(t => t.done).length;
  const totalCount = todayTasks.length;
  const pct = totalCount ? Math.round(doneCount / totalCount * 100) : 0;
  const [celebratingId, setCelebratingId] = usePg(null);
  const [goalDetailOpen, setGoalDetailOpen] = usePg(false);

  const toggleTask = (taskId) => {
    const task = goal.tasks.find(t => t.id === taskId);
    const wasDone = task && task.done;

    setState(s => {
      const goals = s.goals.map(g => {
        if (g.id !== s.activeGoalId) return g;
        const tasks = g.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
        const done = tasks.filter(t => t.done).length;
        const progress = tasks.length ? done / tasks.length : 0;
        return { ...g, tasks, progress };
      });
      const activity = [...s.activity, {
        ts: YukiEngine.nowTs(),
        agent: 'user',
        action: wasDone ? 'uncheck' : 'check',
        summary: (wasDone ? '取消' : '完成') + '「' + (task ? task.title : '') + '」',
      }].slice(-30);
      return { ...s, goals, activity };
    });

    // Celebrate on completion
    if (!wasDone) {
      setCelebratingId(taskId);
      setTimeout(() => setCelebratingId(null), 900);
    }
  };

  const askExecutor = async () => {
    await runAgent('executor', '请基于当前状态推送今日任务');
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 6) return '夜深了';
    if (h < 11) return '早安';
    if (h < 14) return '中午好';
    if (h < 18) return '下午好';
    return '晚上好';
  })();

  return (
    <div>
      <div className="page-head">
        <h1 className="page-greeting">
          {greeting}，<span className="accent">{settings.username || '用户'}</span>
        </h1>
        <p className="page-sub">
          今天是你坚持目标的第 <span className="strong">{state.day}</span> 天 ·
          已完成 <span className="strong">{Math.round((goal?.progress || 0) * 100)}%</span>
          <span style={{margin:'0 8px'}}>·</span>
          {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
      </div>

      <AgentStrip agentStates={state.agentStates} agentLast={state.agentLast}/>

      {goal && (
        <div className="goal-card" onClick={() => setGoalDetailOpen(true)}>
          <div>
            <div className="label">CURRENT GOAL · 点击查看全部任务</div>
            <div className="title">{goal.title}</div>
            <div className="meta">
              <span>· 截止 {goal.deadline}</span>
              <span>· {goal.tasks.length} 个任务</span>
              <span>· 优先级 {goal.priority}</span>
            </div>
          </div>
          <div className="progress">
            <div className="ring" style={{'--pct': Math.round((goal.progress || 0) * 100)}}>
              <span>{Math.round((goal.progress || 0) * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      <div className="sec-head">
        <h2>今日任务</h2>
        <span className="meta">{doneCount}/{totalCount} 已完成 · {pct}%</span>
      </div>

      {todayTasks.length === 0 ? (
        <div className="empty">
          <div className="icon">○</div>
          <h3>今日暂无任务</h3>
          <p>试试让执行官基于当前目标推送今日任务</p>
          <button className="btn btn-ghost" onClick={askExecutor} style={{marginTop:16}}>
            <Icon name="bolt" size={14}/> 调用执行官
          </button>
        </div>
      ) : (
        <div className="tasks">
          {todayTasks.map(t => (
            <div key={t.id} className={celebratingId === t.id ? 'celebrating-wrap' : ''}>
              <TaskItem task={t} onToggle={toggleTask} celebrating={celebratingId === t.id}/>
            </div>
          ))}
        </div>
      )}

      <ActivityLog activity={state.activity}/>

      {goalDetailOpen && goal && (
        <GoalDetailModal goal={goal} onClose={() => setGoalDetailOpen(false)} onToggleTask={toggleTask}/>
      )}
    </div>
  );
}

// ---------- Goal Detail Modal ----------
function GoalDetailModal({ goal, onClose, onToggleTask }) {
  const days = useMemoPg(() => {
    const map = new Map();
    goal.tasks.forEach(t => {
      if (!map.has(t.day)) map.set(t.day, []);
      map.get(t.day).push(t);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [goal.tasks]);

  const doneCount = goal.tasks.filter(t => t.done).length;
  const total = goal.tasks.length;
  const pct = total ? Math.round(doneCount / total * 100) : 0;

  return (
    <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="goal-detail-modal" style={{position:'relative'}}>
        <button className="gd-close" onClick={onClose} aria-label="关闭">
          <Icon name="x" size={14}/>
        </button>
        <div className="gd-head">
          <div className="label">CURRENT GOAL</div>
          <h3>{goal.title}</h3>
          <p className="desc">{goal.description || '无描述'}</p>
          <div className="meta">
            <span>截止 · {goal.deadline || '未设置'}</span>
            <span>优先级 · {goal.priority}</span>
            <span>{total} 个任务</span>
          </div>
          <div className="gd-progress-bar">
            <div className="gd-progress-fill" style={{width: pct + '%'}}/>
          </div>
          <div className="gd-progress-meta">
            <span>已完成 {doneCount} / {total}</span>
            <span>{pct}%</span>
          </div>
        </div>
        <div className="gd-tasks">
          {days.map(([day, tasks]) => (
            <div key={day} className="gd-day-group">
              <div className="gd-day-label">
                <span>Day {day}</span>
                <span className="count">{tasks.filter(t => t.done).length} / {tasks.length}</span>
              </div>
              {tasks.map(t => (
                <div key={t.id} className={'gd-task' + (t.done ? ' done' : '')} onClick={() => onToggleTask(t.id)}>
                  <div className="check"></div>
                  <div className="title">{t.title}</div>
                  <div className="est">{t.est || 60}min</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Goals Page ----------
function GoalsPage({ state, setState, settings, runAgent, showToast, newGoalSeed }) {
  const [showNew, setShowNew] = usePg(false);
  const [newGoal, setNewGoal] = usePg({ title: '', description: '', deadline: '' });
  const [busy, setBusy] = usePg(false);

  // Open modal when triggered from outside (cmd-K / cmd-N)
  useEffPg(() => {
    if (newGoalSeed) setShowNew(true);
  }, [newGoalSeed]);

  const setActive = (id) => {
    setState(s => ({ ...s, activeGoalId: id }));
  };

  const createGoal = async () => {
    if (!newGoal.title.trim()) return;
    setBusy(true);
    try {
      const result = await runAgent('planner', newGoal.title, newGoal);
      const goalId = 'goal-' + YukiEngine.uuid();
      const tasks = (result.tasks || []).map((t, i) => ({
        id: 't-' + YukiEngine.uuid(),
        title: t.title,
        goalId,
        est: t.est || 60,
        agent: 'planner',
        done: false,
        day: t.day || (i + 1),
      }));
      const goal = {
        id: goalId,
        title: newGoal.title,
        description: newGoal.description,
        deadline: newGoal.deadline,
        priority: 'high',
        createdAt: Date.now(),
        progress: 0,
        tasks,
      };
      setState(s => ({
        ...s,
        goals: [goal, ...s.goals],
        activeGoalId: goalId,
        activity: [...s.activity, {
          ts: YukiEngine.nowTs(),
          agent: 'planner',
          action: 'plan',
          summary: '为「' + newGoal.title + '」生成 ' + tasks.length + ' 项任务',
        }].slice(-30),
      }));
      setShowNew(false);
      setNewGoal({ title: '', description: '', deadline: '' });
      showToast('规划师已为你拆解 ' + tasks.length + ' 个任务');
    } catch (e) {
      showToast('规划失败：' + e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="page-head">
        <h1 className="page-greeting">目标 <span className="accent">/ Goals</span></h1>
        <p className="page-sub">所有目标 · 由规划师 Agent 拆解为任务树</p>
      </div>

      <div className="sec-head">
        <h2>进行中</h2>
        <span className="meta">{state.goals.length} 个目标</span>
      </div>

      <div className="goal-list">
        {state.goals.map(g => (
          <div key={g.id} className="goal-item" onClick={() => setActive(g.id)}>
            <div className="left">
              <h4>{g.title} {state.activeGoalId === g.id && <span className="tag" style={{background:'oklch(0.74 0.10 75 / 0.14)', color:'var(--ember-2)', marginLeft:8, padding:'2px 8px', borderRadius:4, fontSize:10, fontFamily:'var(--font-mono)'}}>ACTIVE</span>}</h4>
              <p className="desc">{g.description}</p>
              <div className="stat-row">
                <span>截止 {g.deadline}</span>
                <span>· {g.tasks.length} 个任务</span>
                <span>· 优先级 {g.priority}</span>
              </div>
            </div>
            <div className="right">
              <div className="bar"><div className="bar-fill" style={{width: Math.round((g.progress || 0) * 100) + '%'}}/></div>
              <span className="pct">{Math.round((g.progress || 0) * 100)}%</span>
            </div>
          </div>
        ))}
      </div>

      <button className="new-goal-btn" onClick={() => setShowNew(true)}>
        <Icon name="plus" size={14}/> 新建目标 · 规划师将自动拆解
      </button>

      {showNew && (
        <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) setShowNew(false); }}>
          <div className="modal">
            <h3>新建目标</h3>
            <p>填写目标，<span style={{color:'var(--ember-2)'}}>规划师 Agent</span> 会调用 LLM 拆解为可执行的任务树。</p>
            <div style={{marginBottom:14}}>
              <label>目标标题</label>
              <input type="text" placeholder="例：30 天读完《人人都是产品经理》"
                value={newGoal.title}
                onChange={e => setNewGoal(g => ({...g, title: e.target.value}))}/>
            </div>
            <div style={{marginBottom:14}}>
              <label>描述（可选）</label>
              <textarea rows={3} placeholder="简单描述背景与目的，让规划师拆得更准"
                value={newGoal.description}
                onChange={e => setNewGoal(g => ({...g, description: e.target.value}))}/>
            </div>
            <div style={{marginBottom:14}}>
              <label>截止日期（可选）</label>
              <input type="date" value={newGoal.deadline}
                onChange={e => setNewGoal(g => ({...g, deadline: e.target.value}))}/>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowNew(false)} disabled={busy}>取消</button>
              <button className="btn btn-primary" onClick={createGoal} disabled={busy || !newGoal.title.trim()}>
                {busy ? '规划师思考中...' : '让规划师拆解'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Review Page ----------
function ReviewPage({ state, setState, settings, runAgent, showToast }) {
  const [report, setReport] = usePg(null);
  const [busy, setBusy] = usePg(false);

  const generate = async () => {
    setBusy(true);
    try {
      const r = await runAgent('reviewer', '请生成本周复盘报告');
      setReport(r);
    } catch (e) {
      showToast('生成失败：' + e.message);
    } finally {
      setBusy(false);
    }
  };

  // simulate week heatmap
  const heatmap = [
    { d: '一', v: 4 }, { d: '二', v: 3 }, { d: '三', v: 1 }, { d: '四', v: 4 },
    { d: '五', v: 5 }, { d: '六', v: 2 }, { d: '日', v: 3 },
  ];

  return (
    <div>
      <div className="page-head">
        <h1 className="page-greeting">复盘 <span className="accent">/ Review</span></h1>
        <p className="page-sub">由复盘师 Agent 读取整周 Memory，输出深度洞察</p>
      </div>

      <div className="sec-head">
        <h2>本周节奏</h2>
        <span className="meta">Day {state.day - 6} → Day {state.day}</span>
      </div>

      <div className="report" style={{marginBottom:24}}>
        <h4 style={{fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--ember-2)', marginBottom:14}}>每日完成任务数</h4>
        <div className="heatmap">
          {heatmap.map((d, i) => (
            <div key={i} className="heat-cell" style={{
              background: d.v === 0 ? 'var(--paper-3)' : `oklch(0.74 0.10 75 / ${0.15 + d.v * 0.16})`,
              color: d.v >= 3 ? 'var(--ink)' : 'var(--ink-3)',
            }}>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:9, opacity:0.7}}>{d.d}</div>
                <div style={{fontWeight:500, fontSize:11, marginTop:2}}>{d.v}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!report ? (
        <div className="empty" style={{background:'var(--paper-2)', border:'1px solid var(--line)', borderRadius:'var(--r-xl)'}}>
          <div className="icon">∑</div>
          <h3>还没有本周复盘</h3>
          <p style={{marginBottom:20}}>调用复盘师 Agent，基于整周 Memory 生成洞察与下周建议</p>
          <button className="btn btn-primary" onClick={generate} disabled={busy}>
            {busy ? '复盘师正在分析整周数据...' : '生成本周复盘'}
          </button>
        </div>
      ) : (
        <div className="report">
          <div className="report-head">
            <h3>本周复盘</h3>
            <span className="when">由复盘师 Agent 生成 · {new Date().toLocaleDateString('zh-CN')}</span>
          </div>
          <div className="report-section">
            <h4>整体总结</h4>
            <p>{report.summary}</p>
          </div>
          {report.insights && report.insights.length > 0 && (
            <div className="report-section">
              <h4>关键洞察</h4>
              <ul>{report.insights.map((it, i) => <li key={i}>{it}</li>)}</ul>
            </div>
          )}
          {report.next_week && report.next_week.length > 0 && (
            <div className="report-section">
              <h4>下周建议</h4>
              <ul>{report.next_week.map((it, i) => <li key={i}>{it}</li>)}</ul>
            </div>
          )}
          <div className="report-section" style={{display:'flex', justifyContent:'flex-end'}}>
            <button className="btn btn-ghost" onClick={generate} disabled={busy}>重新生成</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Settings Page ----------
function SettingsPage({ settings, setSettings, showToast, resetData }) {
  const updateField = (k, v) => {
    setSettings(s => {
      const ns = { ...s, [k]: v };
      YukiEngine.saveSettings(ns);
      return ns;
    });
  };

  const providerInfo = {
    'demo': { label: 'Demo 模式（预设回复）', needsKey: false },
    'claude-builtin': { label: 'Claude（内置 · Haiku 4.5）', needsKey: false, note: '使用平台内置 Claude，无需 Key。Clone 后部署可能不可用。' },
    'anthropic': { label: 'Anthropic API（你的 Key）', needsKey: true, defaultModel: 'claude-haiku-4-5' },
    'openai': { label: 'OpenAI API（你的 Key）', needsKey: true, defaultModel: 'gpt-4o-mini' },
    'deepseek': { label: 'DeepSeek API（你的 Key）', needsKey: true, defaultModel: 'deepseek-chat' },
  };
  const cur = providerInfo[settings.provider] || providerInfo.demo;

  return (
    <div>
      <div className="page-head">
        <h1 className="page-greeting">设置 <span className="accent">/ Settings</span></h1>
        <p className="page-sub">配置你的偏好与 LLM 接入方式</p>
      </div>

      <div className="settings">
        <div className="set-section">
          <h3>个人</h3>
          <div className="set-row">
            <div>
              <div className="key">用户名</div>
              <div className="desc">显示在欢迎语中</div>
            </div>
            <div className="ctrl">
              <input type="text" value={settings.username || ''}
                onChange={e => updateField('username', e.target.value)}/>
            </div>
          </div>
        </div>

        <div className="set-section">
          <h3>AI Provider</h3>
          <div className="set-row">
            <div>
              <div className="key">服务提供方</div>
              <div className="desc">Demo 模式无需配置；BYOK 支持 Anthropic / OpenAI / DeepSeek</div>
            </div>
            <div className="ctrl">
              <select value={settings.provider} onChange={e => updateField('provider', e.target.value)}>
                {Object.entries(providerInfo).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          {cur.needsKey && (
            <>
              <div className="set-row">
                <div>
                  <div className="key">API Key</div>
                  <div className="desc">仅存于浏览器 LocalStorage，不会上传任何服务器</div>
                </div>
                <div className="ctrl">
                  <input type="password" placeholder="sk-..." value={settings.apiKey || ''}
                    onChange={e => updateField('apiKey', e.target.value)}/>
                </div>
              </div>
              <div className="set-row">
                <div>
                  <div className="key">模型</div>
                  <div className="desc">留空使用默认：{cur.defaultModel}</div>
                </div>
                <div className="ctrl">
                  <input type="text" placeholder={cur.defaultModel} value={settings.model || ''}
                    onChange={e => updateField('model', e.target.value)}/>
                </div>
              </div>
            </>
          )}

          {cur.note && (
            <div style={{marginTop:14, padding:'10px 14px', background:'oklch(0.74 0.10 75 / 0.10)', borderRadius:8, fontSize:12, color:'var(--ink-2)', lineHeight:1.6}}>
              ℹ {cur.note}
            </div>
          )}
        </div>

        <div className="set-section">
          <h3>数据</h3>
          <div className="set-row">
            <div>
              <div className="key">导出 Memory</div>
              <div className="desc">将所有目标、任务、活动导出为 JSON</div>
            </div>
            <div className="ctrl">
              <button className="btn btn-ghost" onClick={() => {
                const data = JSON.stringify(YukiEngine.loadState(), null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = 'yuki-memory.json'; a.click();
                URL.revokeObjectURL(url);
              }}>导出 JSON</button>
            </div>
          </div>
          <div className="set-row">
            <div>
              <div className="key">重置 Demo 数据</div>
              <div className="desc">恢复初始示例目标与任务</div>
            </div>
            <div className="ctrl">
              <button className="btn btn-ghost" onClick={() => { resetData(); showToast('已重置为 Demo 数据'); }}>重置</button>
            </div>
          </div>
        </div>

        <div className="set-section">
          <h3>关于</h3>
          <p style={{fontSize:13, color:'var(--ink-3)', lineHeight:1.7}}>
            <strong style={{color:'var(--ink)'}}>Yuki v0.1 Alpha</strong><br/>
            基于多智能体协作的个人成长助手<br/>
            2025
          </p>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TodayPage, GoalsPage, ReviewPage, SettingsPage });
