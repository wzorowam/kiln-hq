import { useEffect, useState } from "react";

export function Command({ live, training, published, avg, runs, events, agents, skillById, agentById, onOpenAgent, onNewAgent, onNewSkill }) {
  return (
    <>
      <header className="top">
        <div>
          <div className="kicker">Floor 11 · New York</div>
          <h2>The house is awake.</h2>
          <p className="lede">One room for the fleet and the library. Assign a skill, send an agent into the kiln, publish when it holds.</p>
        </div>
        <div className="actions">
          <button className="btn" onClick={onNewSkill}>Draft skill</button>
          <button className="btn primary" onClick={onNewAgent}>Swear in agent</button>
        </div>
      </header>
      <section className="stats">
        <div className="stat"><div className="n">{live}</div><div className="l">Live on the floor</div></div>
        <div className="stat"><div className="n">{training}</div><div className="l">In the kiln</div></div>
        <div className="stat"><div className="n">{published}</div><div className="l">Published skills</div></div>
        <div className="stat"><div className="n">{avg}</div><div className="l">Mean reliability</div></div>
      </section>
      <section className="grid-2">
        <div className="card">
          <h3>Active heat</h3>
          {runs.slice(0, 6).map((r) => (
            <div className="row" key={r.id}>
              <div>
                <button className="btn ghost" onClick={() => onOpenAgent(r.agentId)}>{agentById[r.agentId]?.name}</button>
                <div className="meta">{skillById[r.skillId]?.title} · {r.kind}</div>
              </div>
              <span className={`badge ${r.status}`}>{r.status}{r.score != null ? ` ${r.score}` : ""}</span>
            </div>
          ))}
        </div>
        <div className="card timeline">
          <h3>Yard log</h3>
          {events.slice(0, 7).map((e, i) => (
            <div className="row" key={i}><b>{e.t}</b><span>{e.text}</span></div>
          ))}
        </div>
      </section>
      <section className="card" style={{ marginTop: 16 }}>
        <h3>Who holds what</h3>
        {agents.map((a) => (
          <div className="row" key={a.id}>
            <button className="btn ghost" onClick={() => onOpenAgent(a.id)}>{a.name}<span className="muted"> — {a.role}</span></button>
            <div className="chips">
              {a.skills.map((id) => <span className="chip" key={id}>{skillById[id]?.title}</span>)}
              {!a.skills.length && <span className="muted">unassigned</span>}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}

export function Agents({ agents, skills, query, setQuery, onOpen, onNew }) {
  return (
    <>
      <header className="top">
        <div>
          <div className="kicker">Roster</div>
          <h2>Agents</h2>
          <p className="lede">Each agent is a seat on the floor with a brief, a temperament, and a kit of skills.</p>
        </div>
        <button className="btn primary" onClick={onNew}>Swear in agent</button>
      </header>
      <div className="search"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the roster…" /></div>
      <div className="cards">
        {agents.map((a) => (
          <button className="agent" key={a.id} onClick={() => onOpen(a.id)}>
            <header><h3>{a.name}</h3><span className={`badge ${a.status}`}>{a.status}</span></header>
            <div className="meta">{a.role} · {a.floor}</div>
            <p className="muted">{a.brief}</p>
            <div className="chips">{a.skills.slice(0, 3).map((id) => <span className="chip" key={id}>{skills[id]?.title}</span>)}</div>
          </button>
        ))}
      </div>
    </>
  );
}

export function AgentDetail({ agent, skills, runs, onBack, onToggle, onTrain }) {
  return (
    <>
      <header className="top">
        <div>
          <div className="kicker"><button className="btn ghost" onClick={onBack}>← Roster</button></div>
          <div className="split"><h2>{agent.name}</h2><span className={`badge ${agent.status}`}>{agent.status}</span></div>
          <p className="lede">{agent.role} · {agent.model} · {agent.floor}</p>
        </div>
      </header>
      <div className="detail">
        <div>
          <div className="card prose">
            <h3>Brief</h3>
            <p>{agent.brief}</p>
            <p className="muted">{agent.temperament}</p>
            <div className="stats" style={{ margin: "16px 0 0", gridTemplateColumns: "repeat(3,1fr)" }}>
              <div><div className="n">{agent.reliability}</div><div className="l">Reliability</div></div>
              <div><div className="n">{agent.evals}</div><div className="l">Evals</div></div>
              <div><div className="n" style={{ fontSize: 22 }}>{agent.lastRun}</div><div className="l">Last heat</div></div>
            </div>
          </div>
          <div className="card" style={{ marginTop: 16 }}>
            <h3>Recent heats</h3>
            {runs.length === 0 && <p className="muted">No runs yet.</p>}
            {runs.map((r) => (
              <div className="row" key={r.id}>
                <span>{skills.find((s) => s.id === r.skillId)?.title}</span>
                <span className={`badge ${r.status}`}>{r.status}{r.score != null ? ` ${r.score}` : ""}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3>Kit</h3>
          <p className="muted" style={{ marginBottom: 12 }}>Pin a skill to this agent, or send them into the kiln with it.</p>
          {skills.map((s) => {
            const on = agent.skills.includes(s.id);
            return (
              <div className="row" key={s.id}>
                <div><div>{s.title}</div><div className="meta">{s.domain} · v{s.version}</div></div>
                <div className="actions">
                  <button className="btn" onClick={() => onToggle(agent.id, s.id)}>{on ? "Unpin" : "Pin"}</button>
                  <button className="btn primary" onClick={() => onTrain(agent.id, s.id)}>Train</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function Skills({ skills, query, setQuery, onOpen, onNew }) {
  return (
    <>
      <header className="top">
        <div>
          <div className="kicker">Library</div>
          <h2>Skills</h2>
          <p className="lede">A skill is a standing instruction — name, trigger, and the house way of doing the work.</p>
        </div>
        <button className="btn primary" onClick={onNew}>Draft skill</button>
      </header>
      <div className="search"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the library…" /></div>
      <div className="cards">
        {skills.map((s) => (
          <button className="skill" key={s.id} onClick={() => onOpen(s.id)}>
            <header><h3>{s.title}</h3><span className={`badge ${s.status}`}>{s.status}</span></header>
            <div className="meta">{s.domain} · v{s.version} · {s.name}</div>
            <p className="muted">{s.description}</p>
            <div><div className="meta">Coverage {s.coverage}%</div><div className="bar"><span style={{ width: `${s.coverage}%` }} /></div></div>
          </button>
        ))}
      </div>
    </>
  );
}

export function SkillDetail({ skill, agents, onBack, onPublish, onSave, onAssign }) {
  const [body, setBody] = useState(skill.body);
  useEffect(() => setBody(skill.body), [skill.id, skill.body]);
  return (
    <>
      <header className="top">
        <div>
          <div className="kicker"><button className="btn ghost" onClick={onBack}>← Library</button></div>
          <div className="split"><h2>{skill.title}</h2><span className={`badge ${skill.status}`}>{skill.status}</span></div>
          <p className="lede">{skill.domain} · v{skill.version} · {skill.name}</p>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => onSave(body)}>Save draft</button>
          <button className="btn primary" onClick={onPublish}>Publish</button>
        </div>
      </header>
      <div className="detail">
        <div className="card">
          <h3>Standing instruction</h3>
          <p className="muted" style={{ marginBottom: 10 }}>{skill.description}</p>
          <p className="meta" style={{ marginBottom: 10 }}>Triggers: {skill.triggers}</p>
          <textarea className="skill-body" value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <div className="card">
          <h3>Who carries it</h3>
          {agents.map((a) => {
            const on = a.skills.includes(skill.id);
            return (
              <div className="row" key={a.id}>
                <div>{a.name}<div className="meta">{a.role}</div></div>
                <button className="btn" onClick={() => onAssign(a.id)}>{on ? "Unpin" : "Pin to kit"}</button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function Training({ runs, agents, skills, onSettle, onOpenAgent }) {
  return (
    <>
      <header className="top">
        <div>
          <div className="kicker">Kiln Hall</div>
          <h2>Training</h2>
          <p className="lede">Curriculum, drills, evals. Pass them through or send them back to the floor.</p>
        </div>
      </header>
      <div className="card">
        {runs.map((r) => (
          <div className="row" key={r.id}>
            <div>
              <button className="btn ghost" onClick={() => onOpenAgent(r.agentId)}>{agents[r.agentId]?.name}</button>
              <div className="meta">{skills[r.skillId]?.title} · {r.kind} · {r.started}</div>
              <div className="muted">{r.note}</div>
            </div>
            <div className="actions">
              <span className={`badge ${r.status}`}>{r.status}{r.score != null ? ` ${r.score}` : ""}</span>
              {(r.status === "running" || r.status === "review") && (
                <>
                  <button className="btn" onClick={() => onSettle(r.id, false)}>Return</button>
                  <button className="btn primary" onClick={() => onSettle(r.id, true)}>Pass</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function Yard({ agents, skills, onOpenAgent, onOpenSkill }) {
  const domains = [...new Set(skills.map((s) => s.domain))];
  const floors = ["Atlas Wing", "Kiln Hall", "Front Desk", "Forge Bay", "Archive", "North Dock"];
  return (
    <>
      <header className="top">
        <div>
          <div className="kicker">Campus map</div>
          <h2>The Yard</h2>
          <p className="lede">Wings of the house. Open a seat or a skill from the floor plan.</p>
        </div>
      </header>
      <div className="grid-2">
        <div className="card">
          <h3>Wings</h3>
          {floors.map((floor) => (
            <div className="row" key={floor}>
              <strong>{floor}</strong>
              <div className="chips">
                {agents.filter((a) => a.floor === floor).map((a) => (
                  <button className="chip" key={a.id} onClick={() => onOpenAgent(a.id)}>{a.name}</button>
                ))}
                {!agents.some((a) => a.floor === floor) && <span className="muted">empty</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <h3>Domains</h3>
          {domains.map((d) => (
            <div className="row" key={d}>
              <strong>{d}</strong>
              <div className="chips">
                {skills.filter((s) => s.domain === d).map((s) => (
                  <button className="chip" key={s.id} onClick={() => onOpenSkill(s.id)}>{s.title}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function AgentForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({ name: "", role: "", model: "Grok 4", floor: "Kiln Hall", brief: "", temperament: "" });
  return (
    <form className="form" onSubmit={(e) => { e.preventDefault(); if (!form.name || !form.role) return; onSubmit(form); }}>
      <div className="field"><label>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
      <div className="field"><label>Seat / role</label><input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required /></div>
      <div className="field">
        <label>Floor</label>
        <select value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })}>
          {["Atlas Wing", "Kiln Hall", "Front Desk", "Forge Bay", "Archive", "North Dock"].map((f) => <option key={f}>{f}</option>)}
        </select>
      </div>
      <div className="field"><label>Brief</label><textarea rows={4} value={form.brief} onChange={(e) => setForm({ ...form, brief: e.target.value })} /></div>
      <div className="actions">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn primary" type="submit">Swear in</button>
      </div>
    </form>
  );
}

export function SkillForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({ name: "", title: "", domain: "General", description: "", body: "", triggers: "", owner: "HQ" });
  return (
    <form className="form" onSubmit={(e) => { e.preventDefault(); if (!form.title) return; onSubmit({ ...form, name: form.name || form.title }); }}>
      <div className="field"><label>Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
      <div className="field">
        <label>Domain</label>
        <select value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })}>
          {["Research", "Operations", "Service", "Engineering", "Compliance", "General"].map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>
      <div className="field"><label>What it is for</label><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div className="field"><label>Standing instruction</label><textarea rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
      <div className="field"><label>Triggers</label><input value={form.triggers} onChange={(e) => setForm({ ...form, triggers: e.target.value })} /></div>
      <div className="actions">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn primary" type="submit">File draft</button>
      </div>
    </form>
  );
}

export function bump(v) {
  const parts = String(v).split(".").map(Number);
  parts[parts.length - 1] += 1;
  return parts.join(".");
}
