/* ============================================
   Yuki Main App
   ============================================ */

const { useState: uA, useEffect: eA, useCallback: cA, useMemo: mA } = React;

function App() {
  const [state, setStateRaw] = uA(() => YukiEngine.loadState());
  const [settings, setSettingsRaw] = uA(() => YukiEngine.loadSettings());
  const [active, setActive] = uA('today');
  const [busy, setBusy] = uA(false);
  const [toast, setToast] = uA(null);
  const [memOpen, setMemOpen] = uA(false);
  const [sbOpen, setSbOpen] = uA(false);
  const [cpOpen, setCpOpen] = uA(false);
  const [newGoalSeed, setNewGoalSeed] = uA(0);

  const setState = cA((updater) => {
    setStateRaw(s => {
      const ns = typeof updater === 'function' ? updater(s) : updater;
      YukiEngine.saveState(ns);
      return ns;
    });
  }, []);

  const setSettings = cA((updater) => {
    setSettingsRaw(s => {
      const ns = typeof updater === 'function' ? updater(s) : updater;
      YukiEngine.saveSettings(ns);
      return ns;
    });
  }, []);

  const showToast = cA((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }, []);

  const resetData = cA(() => {
    const fresh = YukiEngine.seedDemoState();
    setState(fresh);
  }, [setState]);

  // —— Command palette dispatcher ——
  const handleCmd = cA(async (cmd, payload) => {
    if (cmd === 'navigate') { setActive(payload); return; }
    if (cmd === 'toggle-memory') { setMemOpen(o => !o); return; }
    if (cmd === 'reset') { resetData(); showToast('已重置为 Demo 数据'); return; }
    if (cmd === 'set-active-goal') {
      setState(s => ({ ...s, activeGoalId: payload }));
      setActive('today');
      showToast('已切换目标');
      return;
    }
    if (cmd === 'new-goal') {
      setActive('goals');
      setNewGoalSeed(s => s + 1);
      return;
    }
    if (cmd === 'agent') {
      try {
        if (payload === 'reviewer') setActive('review');
        const r = await runAgentRef.current?.(payload);
        if (payload === 'executor' && r) {
          showToast('执行官：' + (r.insight || '已分析当前进度').slice(0, 80));
        }
      } catch (e) {}
      return;
    }
    if (cmd === 'export') {
      const data = JSON.stringify(YukiEngine.loadState(), null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'yuki-memory.json'; a.click();
      URL.revokeObjectURL(url);
      showToast('数据已导出');
      return;
    }
  }, [resetData, setState, showToast]);

  const runAgentRef = React.useRef(null);

  // unified agent runner
  const runAgent = cA(async (agent, input, extra) => {
    setStateRaw(s => ({ ...s, agentStates: { ...s.agentStates, [agent]: 'thinking' } }));
    setBusy(true);
    try {
      let result;
      if (agent === 'planner') {
        result = await YukiEngine.runPlanner({ title: input, ...extra }, settings);
      } else if (agent === 'executor') {
        result = await YukiEngine.runExecutor(state, settings);
      } else if (agent === 'reviewer') {
        result = await YukiEngine.runReviewer(state, settings);
      }
      setStateRaw(s => {
        const summary = agent === 'planner' ? '已生成 ' + (result.tasks || []).length + ' 项任务'
          : agent === 'executor' ? (result.insight || '已分析当前进度').slice(0, 40)
          : '已生成本周复盘报告';
        return {
          ...s,
          agentStates: { ...s.agentStates, [agent]: 'done' },
          agentLast: { ...s.agentLast, [agent]: summary },
          activity: [...s.activity, {
            ts: YukiEngine.nowTs(), agent, action: 'run', summary,
          }].slice(-30),
        };
      });
      setTimeout(() => {
        setStateRaw(s => ({ ...s, agentStates: { ...s.agentStates, [agent]: 'idle' } }));
      }, 2000);
      return result;
    } catch (e) {
      setStateRaw(s => ({ ...s, agentStates: { ...s.agentStates, [agent]: 'error' } }));
      showToast('Agent 调用失败：' + e.message);
      throw e;
    } finally {
      setBusy(false);
    }
  }, [state, settings, showToast]);

  // Sync runAgent into ref for command palette access
  eA(() => { runAgentRef.current = runAgent; }, [runAgent]);

  // —— Keyboard shortcuts ——
  eA(() => {
    let lastG = 0;
    const onKey = (e) => {
      // ⌘K / Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); setCpOpen(o => !o); return;
      }
      if (cpOpen) return; // CP handles its own keys

      // Ignore typing in inputs
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;

      // ⌘M memory
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault(); setMemOpen(o => !o); return;
      }
      // ⌘N new goal
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault(); setActive('goals'); setNewGoalSeed(s => s + 1); return;
      }
      // ⌘E executor
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault(); runAgentRef.current?.('executor').then(r => {
          if (r) showToast('执行官：' + (r.insight || '已分析').slice(0, 80));
        }); return;
      }
      // ⌘R reviewer (capture also browser refresh? guard with shift)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault(); setActive('review'); runAgentRef.current?.('reviewer'); return;
      }

      // Gx series (G then X)
      const now = Date.now();
      if (e.key.toLowerCase() === 'g') { lastG = now; return; }
      if (now - lastG < 800) {
        if (e.key.toLowerCase() === 't') { setActive('today'); }
        else if (e.key.toLowerCase() === 'g') { setActive('goals'); }
        else if (e.key.toLowerCase() === 'r') { setActive('review'); }
        else if (e.key.toLowerCase() === 's') { setActive('settings'); }
        lastG = 0;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cpOpen, showToast]);

  // composer handler — routes through Executor by default
  const handleComposerSend = cA(async (text) => {
    setStateRaw(s => ({ ...s, activity: [...s.activity, { ts: YukiEngine.nowTs(), agent: 'user', action: 'msg', summary: text }].slice(-30) }));

    // simple intent detection
    const wantsNewGoal = /目标|计划|学习|准备|考|拆解/.test(text) && text.length > 8;
    const wantsReview = /复盘|周报|总结|回顾/.test(text);

    if (wantsNewGoal && active === 'today') {
      try {
        const r = await runAgent('planner', text, { description: '', deadline: '' });
        const goalId = 'goal-' + YukiEngine.uuid();
        const tasks = (r.tasks || []).map((t, i) => ({
          id: 't-' + YukiEngine.uuid(),
          title: t.title, goalId, est: t.est || 60, agent: 'planner', done: false, day: t.day || (i + 1),
        }));
        setState(s => ({
          ...s,
          goals: [{ id: goalId, title: text, description: '', deadline: '', priority: 'high', createdAt: Date.now(), progress: 0, tasks }, ...s.goals],
          activeGoalId: goalId,
        }));
        showToast('规划师已为「' + text.slice(0, 18) + '...」生成 ' + tasks.length + ' 项任务');
      } catch (e) {}
    } else if (wantsReview) {
      setActive('review');
      try { await runAgent('reviewer'); showToast('复盘师已生成本周报告'); } catch (e) {}
    } else {
      try {
        const r = await runAgent('executor');
        if (r && r.insight) showToast('执行官：' + r.insight.slice(0, 80));
        if (r && r.blocker) setTimeout(() => showToast('⚠ 卡点：' + r.blocker.slice(0, 80)), 2600);
      } catch (e) {}
    }
  }, [active, runAgent, setState, showToast]);

  const pageProps = { state, setState, settings, runAgent, showToast };

  return (
    <div className="app-shell">
      <Sidebar
        active={active} setActive={setActive}
        settings={settings}
        isOpen={sbOpen} onClose={() => setSbOpen(false)}
        onOpenSettings={() => { setActive('settings'); setSbOpen(false); }}
      />
      <main className="main">
        {/* Top bar with kbd hint */}
        <div className="app-topbar">
          <button className="mobile-menu" onClick={() => setSbOpen(true)} aria-label="菜单">
            <Icon name="menu" size={18}/>
          </button>
          <span className="app-topbar-crumb">
            <span className="mono" style={{color:'var(--ink-3)', fontSize: 11, letterSpacing:'0.04em'}}>YUKI</span>
            <span style={{margin:'0 6px', color:'var(--ink-4)'}}>/</span>
            <span className="mono" style={{fontSize: 11, color:'var(--ink-2)'}}>
              {active === 'today' ? 'TODAY' : active === 'goals' ? 'GOALS' : active === 'review' ? 'REVIEW' : 'SETTINGS'}
            </span>
          </span>
          <span className="app-topbar-fill"/>
          <button className="kbd-hint" onClick={() => setCpOpen(true)} title="Open command palette">
            <Icon name="sparkle" size={11}/>
            <span>命令</span>
            <kbd>⌘</kbd><kbd>K</kbd>
          </button>
          <span className="app-topbar-ind">
            <span className="dot"/>
            {settings.provider === 'demo' ? 'Demo' : settings.provider}
          </span>
        </div>

        <div className="main-inner">

          {active === 'today' && <TodayPage {...pageProps}/>}
          {active === 'goals' && <GoalsPage {...pageProps} newGoalSeed={newGoalSeed}/>}
          {active === 'review' && <ReviewPage {...pageProps}/>}
          {active === 'settings' && <SettingsPage settings={settings} setSettings={setSettings} showToast={showToast} resetData={resetData}/>}

          {(active === 'today') && (
            <Composer onSend={handleComposerSend} busy={busy}
              placeholder="告诉 Yuki 你的想法 · 例：'我想 30 天读完《人人都是产品经理》'"/>
          )}
        </div>
      </main>

      <MemoryInspector state={state} open={memOpen} onToggle={() => setMemOpen(o => !o)}/>

      <CommandPalette
        open={cpOpen}
        onClose={() => setCpOpen(false)}
        onCommand={handleCmd}
        state={state}
      />

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

window.YukiApp = App;
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
