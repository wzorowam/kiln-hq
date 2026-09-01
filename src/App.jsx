import { useEffect, useState } from "react";
import { SEED } from "./seed";
import { Command, Agents, AgentDetail, Skills, SkillDetail, Training, Yard, Modal, AgentForm, SkillForm, bump } from "./screens";

const STORAGE = "kiln-hq-v1";
const VIEWS = [
  ["command", "Command"],
  ["agents", "Agents"],
  ["skills", "Skills"],
  ["training", "Training"],
  ["yard", "The Yard"],
];

function load() {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) return structuredClone(SEED);
    return { ...structuredClone(SEED), ...JSON.parse(raw) };
  } catch {
    return structuredClone(SEED);
  }
}

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function App() {
  const [db, setDb] = useState(load);
  const [view, setView] = useState("command");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const { hq, ...rest } = db;
    localStorage.setItem(STORAGE, JSON.stringify(rest));
  }, [db]);

  const agents = db.agents;
  const skills = db.skills;
  const runs = db.runs;
  const skillById = Object.fromEntries(skills.map((s) => [s.id, s]));
  const agentById = Object.fromEntries(agents.map((a) => [a.id, a]));

  const live = agents.filter((a) => a.status === "live").length;
  const training = agents.filter((a) => a.status === "training").length;
  const published = skills.filter((s) => s.status === "published").length;
  const avg =
    Math.round(agents.reduce((n, a) => n + a.reliability, 0) / agents.length) ||
    0;

  function addEvent(text) {
    const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setDb((d) => ({ ...d, events: [{ t, text }, ...d.events].slice(0, 24) }));
  }

  function createAgent(form) {
    const agent = {
      id: uid("ag"),
      name: form.name,
      role: form.role,
      model: form.model || "Grok 4",
      status: "idle",
      floor: form.floor || "Kiln Hall",
      cadence: "On demand",
      reliability: 70,
      evals: 0,
      lastRun: "never",
      brief: form.brief,
      skills: [],
      temperament: form.temperament || "Unset.",
    };
    setDb((d) => ({ ...d, agents: [agent, ...d.agents] }));
    addEvent(`${agent.name} was sworn in as ${agent.role}.`);
    setModal(null);
    setView("agents");
    setSelectedAgent(agent.id);
  }

  function createSkill(form) {
    const skill = {
      id: uid("sk"),
      name: form.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      title: form.title,
      version: "0.1",
      status: "draft",
      domain: form.domain || "General",
      owner: form.owner || "HQ",
      coverage: 0,
      description: form.description,
      body: form.body,
      triggers: form.triggers,
    };
    setDb((d) => ({ ...d, skills: [skill, ...d.skills] }));
    addEvent(`Skill drafted: ${skill.title}.`);
    setModal(null);
    setView("skills");
    setSelectedSkill(skill.id);
  }

  function toggleSkill(agentId, skillId) {
    setDb((d) => ({
      ...d,
      agents: d.agents.map((a) => {
        if (a.id !== agentId) return a;
        const has = a.skills.includes(skillId);
        return {
          ...a,
          skills: has ? a.skills.filter((id) => id !== skillId) : [...a.skills, skillId],
        };
      }),
    }));
  }

  function startTraining(agentId, skillId) {
    const agent = agentById[agentId];
    const skill = skillById[skillId];
    const run = {
      id: uid("tr"),
      agentId,
      skillId,
      kind: "curriculum",
      status: "running",
      score: null,
      started: "now",
      note: `${agent.name} entered the kiln for ${skill.title}.`,
    };
    setDb((d) => ({
      ...d,
      runs: [run, ...d.runs],
      agents: d.agents.map((a) =>
        a.id === agentId ? { ...a, status: "training", lastRun: "in session" } : a
      ),
    }));
    addEvent(run.note);
    setView("training");
  }

  function settleRun(runId, pass) {
    setDb((d) => {
      const run = d.runs.find((r) => r.id === runId);
      const score = pass ? 88 + Math.floor(Math.random() * 12) : 62 + Math.floor(Math.random() * 12);
      return {
        ...d,
        runs: d.runs.map((r) =>
          r.id === runId
            ? {
                ...r,
                status: pass ? "passed" : "failed",
                score,
                note: pass
                  ? `${r.note} Settled. Score ${score}.`
                  : `${r.note} Returned to the floor. Score ${score}.`,
              }
            : r
        ),
        agents: d.agents.map((a) =>
          a.id === run.agentId
            ? {
                ...a,
                status: pass ? "live" : "review",
                reliability: Math.min(99, Math.max(60, a.reliability + (pass ? 1 : -2))),
                evals: a.evals + 1,
                lastRun: "just now",
              }
            : a
        ),
        skills: d.skills.map((s) =>
          s.id === run.skillId
            ? { ...s, coverage: Math.min(100, s.coverage + (pass ? 3 : 1)) }
            : s
        ),
      };
    });
  }

  function publishSkill(id) {
    setDb((d) => ({
      ...d,
      skills: d.skills.map((s) =>
        s.id === id
          ? {
              ...s,
              status: "published",
              version: bump(s.version),
            }
          : s
      ),
    }));
    const s = skillById[id];
    addEvent(`${s.title} published.`);
  }

  function saveSkillBody(id, body) {
    setDb((d) => ({
      ...d,
      skills: d.skills.map((s) => (s.id === id ? { ...s, body, status: s.status === "published" ? "review" : s.status } : s)),
    }));
  }

  const filteredAgents = agents.filter((a) =>
    `${a.name} ${a.role} ${a.floor}`.toLowerCase().includes(query.toLowerCase())
  );
  const filteredSkills = skills.filter((s) =>
    `${s.title} ${s.domain} ${s.name}`.toLowerCase().includes(query.toLowerCase())
  );

  const agent = agents.find((a) => a.id === selectedAgent);
  const skill = skills.find((s) => s.id === selectedSkill);

  return (
    <div className="shell">
      <aside className="rail">
        <div className="mark">
          <div className="mark-sigil" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 14h12M5 14V8l4-5 4 5v6M7.5 14v-3h3v3" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </div>
          <div>
            <h1>KILN</h1>
            <small>HQ · Training Center</small>
          </div>
        </div>
        <nav className="nav">
          {VIEWS.map(([id, label]) => (
            <button
              key={id}
              className={view === id && !selectedAgent && !selectedSkill ? "active" : view === id ? "active" : ""}
              onClick={() => {
                setView(id);
                setSelectedAgent(null);
                setSelectedSkill(null);
                setQuery("");
              }}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="rail-foot">
          <strong>{db.hq.campus}</strong>
          Fleet of {agents.length}. Skills in the library: {skills.length}.
        </div>
      </aside>

      <main className="stage">
        {selectedAgent && agent ? (
          <AgentDetail
            agent={agent}
            skills={skills}
            runs={runs.filter((r) => r.agentId === agent.id)}
            onBack={() => setSelectedAgent(null)}
            onToggle={toggleSkill}
            onTrain={startTraining}
          />
        ) : selectedSkill && skill ? (
          <SkillDetail
            skill={skill}
            agents={agents}
            onBack={() => setSelectedSkill(null)}
            onPublish={() => publishSkill(skill.id)}
            onSave={(body) => saveSkillBody(skill.id, body)}
            onAssign={(agentId) => toggleSkill(agentId, skill.id)}
          />
        ) : view === "command" ? (
          <Command
            live={live}
            training={training}
            published={published}
            avg={avg}
            runs={runs}
            events={db.events}
            agents={agents}
            skills={skills}
            skillById={skillById}
            agentById={agentById}
            onOpenAgent={setSelectedAgent}
            onNewAgent={() => setModal("agent")}
            onNewSkill={() => setModal("skill")}
          />
        ) : view === "agents" ? (
          <Agents
            agents={filteredAgents}
            skills={skillById}
            query={query}
            setQuery={setQuery}
            onOpen={setSelectedAgent}
            onNew={() => setModal("agent")}
          />
        ) : view === "skills" ? (
          <Skills
            skills={filteredSkills}
            query={query}
            setQuery={setQuery}
            onOpen={setSelectedSkill}
            onNew={() => setModal("skill")}
          />
        ) : view === "training" ? (
          <Training
            runs={runs}
            agents={agentById}
            skills={skillById}
            onSettle={settleRun}
            onOpenAgent={setSelectedAgent}
          />
        ) : (
          <Yard agents={agents} skills={skills} onOpenAgent={setSelectedAgent} onOpenSkill={setSelectedSkill} />
        )}
      </main>

      {modal === "agent" && (
        <Modal title="Swear in an agent" onClose={() => setModal(null)}>
          <AgentForm onSubmit={createAgent} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal === "skill" && (
        <Modal title="Draft a skill" onClose={() => setModal(null)}>
          <SkillForm onSubmit={createSkill} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
