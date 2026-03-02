import { useState, useRef, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2, Image as ImageIcon, Plus, Save,
  ChevronRight, BookOpen, Clock, Hash,
  LogOut, PlusCircle, Circle, CheckCircle2,
} from "lucide-react";
import Logo from "../components/Logo";

const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
    body { font-family: 'DM Sans', sans-serif; }
    .mono { font-family: 'DM Mono', monospace; }
    @keyframes slide-in {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .slide-in { animation: slide-in .2s ease both; }

    /* hide number input arrows */
    input[type=number]::-webkit-outer-spin-button,
    input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
    input[type=number] { -moz-appearance: textfield; }
  `}</style>
);

const OPT_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export default function TestCreator() {
  const navigate = useNavigate();
  const { testId } = useParams();

  const [title, setTitle]       = useState("");
  const [duration, setDuration] = useState(60);
  const [sections, setSections] = useState([{ id: 1, name: "Section 1", time: 30, questions: [] }]);
  const [activeSectionId, setActiveSectionId] = useState(1);
  const questionRefs = useRef({});

  const activeSection = useMemo(
    () => sections.find(s => s.id === activeSectionId),
    [sections, activeSectionId]
  );

  /* ── edit mode ── */
  useEffect(() => {
    if (!testId) return;
    const allTests = JSON.parse(localStorage.getItem("tests")) || [];
    const existing = allTests.find(t => String(t.id) === String(testId));
    if (!existing) { alert("Test not found!"); navigate("/creator-dashboard"); return; }
    setTitle(existing.title || "");
    setDuration(existing.duration || 60);
    if (existing.sections?.length > 0) {
      setSections(existing.sections);
      setActiveSectionId(existing.sections[0].id);
    } else {
      setSections([{ id: 1, name: "Section 1", time: existing.duration || 30, questions: existing.questions || [] }]);
      setActiveSectionId(1);
    }
  }, [testId]);

  /* ── section helpers ── */
  const addSection = () => {
    const id = Date.now();
    setSections(prev => [...prev, { id, name: `Section ${prev.length + 1}`, time: 30, questions: [] }]);
    setActiveSectionId(id);
  };

  const updateSection = (id, field, value) =>
    setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));

  const deleteSection = (id) => {
    if (sections.length === 1) { alert("At least one section required"); return; }
    const remaining = sections.filter(s => s.id !== id);
    setSections(remaining);
    setActiveSectionId(remaining[0].id);
  };

  /* ── question helpers ── */
  const addQuestion = () => {
    setSections(prev => prev.map(s => s.id === activeSectionId ? {
      ...s,
      questions: [...s.questions, {
        id: Date.now(), type: "mcq", text: "", image: null, marks: 1,
        options: [{ id: 1, text: "", image: null }, { id: 2, text: "", image: null }],
        answer: "",
      }],
    } : s));
  };

  const updateQuestion = (qid, field, value) =>
    setSections(prev => prev.map(s => s.id === activeSectionId ? {
      ...s,
      questions: s.questions.map(q => q.id === qid ? { ...q, [field]: value } : q),
    } : s));

  const deleteQuestion = (qid) =>
    setSections(prev => prev.map(s => s.id === activeSectionId ? {
      ...s, questions: s.questions.filter(q => q.id !== qid),
    } : s));

  const addOption = (qid) =>
    setSections(prev => prev.map(s => s.id === activeSectionId ? {
      ...s,
      questions: s.questions.map(q => q.id === qid ? {
        ...q, options: [...q.options, { id: Date.now(), text: "", image: null }],
      } : q),
    } : s));

  const removeOption = (qid, oid) =>
    setSections(prev => prev.map(s => s.id === activeSectionId ? {
      ...s,
      questions: s.questions.map(q => q.id === qid ? {
        ...q, options: q.options.filter(o => o.id !== oid),
      } : q),
    } : s));

  const updateOption = (qid, oid, field, value) =>
    setSections(prev => prev.map(s => s.id === activeSectionId ? {
      ...s,
      questions: s.questions.map(q => q.id === qid ? {
        ...q, options: q.options.map(o => o.id === oid ? { ...o, [field]: value } : o),
      } : q),
    } : s));

  const handleImage = (file) => file ? URL.createObjectURL(file) : null;

  const scrollToQuestion = (qid) =>
    questionRefs.current[qid]?.scrollIntoView({ behavior: "smooth", block: "center" });

  /* ── save ── */
  const saveTest = () => {
    if (!title.trim()) { alert("Please add a title"); return; }
    if (sections.every(s => s.questions.length === 0)) { alert("Add at least one question"); return; }

    const creator  = localStorage.getItem("creatorUser");
    const allTests = JSON.parse(localStorage.getItem("tests")) || [];
    const totalMarks = sections.reduce((a, s) => a + s.questions.reduce((b, q) => b + Number(q.marks || 0), 0), 0);

    if (testId) {
      const index = allTests.findIndex(t => t.id.trim() === testId.trim());
      if (index === -1) { alert("Test not found. Cannot update."); return; }
      allTests[index] = { ...allTests[index], title, duration: Number(duration), sections, totalMarks, updatedAt: new Date().toISOString() };
      localStorage.setItem("tests", JSON.stringify(allTests));
      alert("Test Updated!");
    } else {
      const newTest = {
        id: "TST-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        title, duration: Number(duration), sections, totalMarks,
        attempts: 0, published: true, createdBy: creator, createdAt: new Date().toISOString(),
      };
      localStorage.setItem("tests", JSON.stringify([...allTests, newTest]));
      alert("Test Created!");
    }
    navigate("/creator-dashboard");
  };

  const getSectionMarks = (s) => s.questions.reduce((a, q) => a + Number(q.marks || 0), 0);
  const totalMarks = sections.reduce((a, s) => a + getSectionMarks(s), 0);
  const totalQuestions = sections.reduce((a, s) => a + s.questions.length, 0);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}
      className="h-screen min-w-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden">
      <FontLoader />

      {/* ── TOPBAR ── */}
      <header className="h-14 shrink-0 flex items-center justify-between px-5
        bg-zinc-950 border-b border-zinc-800">

        {/* left: logo + title */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/creator-dashboard")}
            className="shrink-0">
            <Logo size="sm" />
          </button>

          <div className="w-px h-5 bg-zinc-800 hidden sm:block" />

          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Untitled Test..."
            className="bg-transparent outline-none font-semibold text-sm text-zinc-200
              placeholder:text-zinc-600 w-48 sm:w-72"
          />
        </div>

        {/* right: meta + save */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 mono text-[10px] text-zinc-500">
            <Clock size={10} />
            <input type="number" value={duration}
              onChange={e => setDuration(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 w-12
                mono text-[10px] text-zinc-300 outline-none text-center
                focus:border-indigo-500/50 transition-colors" />
            min
          </div>

          <div className="hidden sm:flex items-center gap-1.5 mono text-[10px] text-zinc-500">
            <Hash size={10} />
            {totalMarks} marks
          </div>

          <button onClick={saveTest}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
              bg-indigo-500 hover:bg-indigo-400 text-white transition-colors">
            <Save size={14} />
            {testId ? "Update" : "Save"}
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="flex flex-1 min-h-0">

        {/* ══ LEFT: sections panel ══ */}
        <aside className="w-52 shrink-0 flex flex-col border-r border-zinc-800 bg-zinc-950
          overflow-y-auto hidden md:flex"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" }}>

          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <span className="text-xs font-semibold text-zinc-400">Sections</span>
            <button onClick={addSection}
              className="w-6 h-6 rounded-md bg-zinc-800 hover:bg-indigo-500/20
                hover:text-indigo-400 flex items-center justify-center text-zinc-500
                transition-all">
              <Plus size={12} />
            </button>
          </div>

          <div className="flex-1 p-3 space-y-2">
            {sections.map(s => {
              const isActive = s.id === activeSectionId;
              return (
                <div key={s.id}
                  onClick={() => setActiveSectionId(s.id)}
                  className={`rounded-xl p-3 cursor-pointer transition-all border
                    ${isActive
                      ? "bg-indigo-500/10 border-indigo-500/30"
                      : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                    }`}
                >
                  <input
                    value={s.name}
                    onClick={e => e.stopPropagation()}
                    onChange={e => updateSection(s.id, "name", e.target.value)}
                    className={`bg-transparent w-full outline-none text-sm font-semibold mb-2
                      ${isActive ? "text-indigo-300" : "text-zinc-300"}`}
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 mono text-[10px] text-zinc-500">
                      <Clock size={9} />
                      <input type="number" value={s.time}
                        onClick={e => e.stopPropagation()}
                        onChange={e => updateSection(s.id, "time", e.target.value)}
                        className="bg-zinc-800 rounded w-10 px-1 py-0.5 text-center outline-none
                          text-zinc-400 focus:text-zinc-200 transition-colors" />
                      m
                    </div>
                    <span className="mono text-[10px] text-zinc-600 ml-auto">
                      {getSectionMarks(s)} pts
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="mono text-[9px] text-zinc-600">
                      {s.questions.length} questions
                    </span>
                    {sections.length > 1 && (
                      <button
                        onClick={e => { e.stopPropagation(); deleteSection(s.id); }}
                        className="text-zinc-600 hover:text-red-400 transition-colors">
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* totals footer */}
          <div className="border-t border-zinc-800 px-4 py-3 space-y-1">
            <div className="flex justify-between mono text-[10px] text-zinc-500">
              <span>Total Marks</span>
              <span className="text-zinc-300">{totalMarks}</span>
            </div>
            <div className="flex justify-between mono text-[10px] text-zinc-500">
              <span>Questions</span>
              <span className="text-zinc-300">{totalQuestions}</span>
            </div>
          </div>
        </aside>

        {/* ══ CENTER: questions ══ */}
        <main className="flex-1 overflow-y-auto p-5 space-y-4"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" }}>

          {/* mobile: section selector */}
          <div className="flex gap-2 overflow-x-auto pb-1 md:hidden">
            {sections.map(s => (
              <button key={s.id} onClick={() => setActiveSectionId(s.id)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                  ${s.id === activeSectionId
                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                    : "bg-zinc-900 border-zinc-800 text-zinc-500"
                  }`}>
                {s.name}
              </button>
            ))}
            <button onClick={addSection}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs border border-dashed
                border-zinc-700 text-zinc-600 hover:text-zinc-400 hover:border-zinc-600 transition-all">
              + Section
            </button>
          </div>

          {/* section heading */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-zinc-200">{activeSection?.name}</h2>
              <p className="mono text-[10px] text-zinc-600 mt-0.5">
                {activeSection?.questions.length} questions · {getSectionMarks(activeSection ?? { questions: [] })} pts
              </p>
            </div>
            <button onClick={addQuestion}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                border border-dashed border-zinc-700 text-zinc-400 hover:border-indigo-500/40
                hover:text-indigo-400 hover:bg-indigo-500/5 transition-all">
              <Plus size={14} />
              Question
            </button>
          </div>

          {/* empty state */}
          {activeSection?.questions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800
                flex items-center justify-center">
                <Hash size={20} className="text-zinc-700" />
              </div>
              <p className="text-sm text-zinc-500">No questions yet</p>
              <button onClick={addQuestion}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                  bg-indigo-500 hover:bg-indigo-400 text-white transition-colors mt-1">
                <Plus size={14} /> Add First Question
              </button>
            </div>
          )}

          {/* question cards */}
          <AnimatePresence>
            {activeSection?.questions.map((q, index) => (
              <motion.div key={q.id}
                ref={el => questionRefs.current[q.id] = el}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: .98 }}
                transition={{ duration: .18 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4
                  hover:border-zinc-700 transition-colors"
              >
                {/* card header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="mono text-[10px] text-zinc-500 uppercase tracking-widest">
                      Q{index + 1}
                    </span>
                    {/* type toggle */}
                    <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-1">
                      {["mcq", "numerical"].map(t => (
                        <button key={t} onClick={() => updateQuestion(q.id, "type", t)}
                          className={`px-2.5 py-1 rounded-md mono text-[10px] uppercase tracking-widest
                            transition-all ${q.type === t
                              ? "bg-zinc-700 text-zinc-200"
                              : "text-zinc-500 hover:text-zinc-300"
                            }`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700
                      rounded-lg px-2.5 py-1.5">
                      <input type="number" value={q.marks}
                        onChange={e => updateQuestion(q.id, "marks", e.target.value)}
                        className="bg-transparent mono text-[11px] text-zinc-300 outline-none
                          w-7 text-center" />
                      <span className="mono text-[10px] text-zinc-500">pts</span>
                    </div>
                    <button onClick={() => deleteQuestion(q.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center
                        text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* question text */}
                <textarea
                  placeholder="Type your question here..."
                  value={q.text}
                  onChange={e => updateQuestion(q.id, "text", e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3
                    text-sm text-zinc-200 placeholder:text-zinc-600 outline-none resize-none
                    focus:border-zinc-600 transition-colors leading-relaxed"
                />

                {/* image upload for question */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 mono text-[10px] text-zinc-500
                    hover:text-zinc-300 cursor-pointer transition-colors">
                    <ImageIcon size={12} />
                    {q.image ? "Change image" : "Add image"}
                    <input hidden type="file" accept="image/*"
                      onChange={e => updateQuestion(q.id, "image", handleImage(e.target.files[0]))} />
                  </label>
                  {q.image && (
                    <button onClick={() => updateQuestion(q.id, "image", null)}
                      className="mono text-[10px] text-red-500 hover:text-red-400">
                      Remove
                    </button>
                  )}
                </div>
                {q.image && (
                  <img src={q.image} alt="question"
                    className="h-32 rounded-xl object-cover border border-zinc-800" />
                )}

                {/* MCQ options */}
                {q.type === "mcq" && (
                  <div className="space-y-2.5">
                    {q.options.map((o, i) => {
                      const isCorrect = q.answer === i;
                      return (
                        <div key={o.id} className={`flex items-center gap-3 p-3 rounded-xl border
                          transition-all ${isCorrect
                            ? "bg-emerald-500/8 border-emerald-500/25"
                            : "bg-zinc-800/40 border-zinc-700/40"
                          }`}>
                          {/* correct answer radio */}
                          <button
                            onClick={() => updateQuestion(q.id, "answer", isCorrect ? "" : i)}
                            className={`w-5 h-5 rounded-full border flex items-center justify-center
                              shrink-0 transition-all ${isCorrect
                                ? "bg-emerald-500 border-emerald-500"
                                : "border-zinc-600 hover:border-zinc-400"
                              }`}>
                            {isCorrect && <div className="w-2 h-2 rounded-full bg-white" />}
                          </button>

                          {/* option label */}
                          <span className={`mono text-[11px] shrink-0 w-4
                            ${isCorrect ? "text-emerald-400" : "text-zinc-500"}`}>
                            {OPT_LABELS[i]}
                          </span>

                          {/* option text */}
                          <input
                            placeholder={`Option ${OPT_LABELS[i]}`}
                            value={o.text}
                            onChange={e => updateOption(q.id, o.id, "text", e.target.value)}
                            className="flex-1 bg-transparent text-sm text-zinc-200
                              placeholder:text-zinc-600 outline-none"
                          />

                          {/* option image */}
                          <label className="text-zinc-600 hover:text-zinc-400 cursor-pointer
                            transition-colors shrink-0">
                            <ImageIcon size={12} />
                            <input hidden type="file" accept="image/*"
                              onChange={e => updateOption(q.id, o.id, "image", handleImage(e.target.files[0]))} />
                          </label>

                          {/* remove option */}
                          {q.options.length > 2 && (
                            <button onClick={() => removeOption(q.id, o.id)}
                              className="text-zinc-700 hover:text-red-400 transition-colors shrink-0">
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      );
                    })}

                    <button onClick={() => addOption(q.id)}
                      className="flex items-center gap-1.5 mono text-[10px] text-zinc-500
                        hover:text-indigo-400 transition-colors mt-1">
                      <Plus size={11} /> Add option
                    </button>
                  </div>
                )}

                {/* numerical answer */}
                {q.type === "numerical" && (
                  <div className="flex flex-col gap-1.5 max-w-xs">
                    <label className="mono text-[10px] text-zinc-500 uppercase tracking-widest">
                      Correct Answer
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={q.answer}
                      onChange={e => updateQuestion(q.id, "answer", e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5
                        mono text-sm text-zinc-200 outline-none
                        focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/15
                        transition-all placeholder:text-zinc-700"
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* bottom add button */}
          {(activeSection?.questions.length ?? 0) > 0 && (
            <button onClick={addQuestion}
              className="w-full py-3 rounded-2xl border border-dashed border-zinc-800
                text-sm text-zinc-600 hover:border-indigo-500/30 hover:text-indigo-400
                hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-2">
              <Plus size={14} />
              Add another question
            </button>
          )}
        </main>

        {/* ══ RIGHT: question jump nav ══ */}
        <aside className="w-16 shrink-0 border-l border-zinc-800 bg-zinc-950 flex flex-col
          overflow-y-auto hidden sm:flex"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" }}>

          <div className="px-2 py-3 border-b border-zinc-800 text-center">
            <span className="mono text-[9px] text-zinc-600 uppercase tracking-widest">Nav</span>
          </div>

          <div className="flex-1 p-2 flex flex-col gap-1.5">
            {activeSection?.questions.map((q, i) => {
              const hasText    = q.text?.trim().length > 0;
              const hasAnswer  = q.answer !== "" && q.answer !== null && q.answer !== undefined;
              const isDone     = hasText && hasAnswer;
              return (
                <button key={q.id}
                  onClick={() => scrollToQuestion(q.id)}
                  title={`Question ${i + 1}`}
                  className={`w-full h-9 rounded-lg mono text-[10px] border transition-all
                    hover:scale-105 ${isDone
                      ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                      : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                    }`}>
                  {i + 1}
                </button>
              );
            })}
          </div>

          {/* legend */}
          <div className="p-2 border-t border-zinc-800 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm bg-emerald-500/30" />
              <span className="mono text-[8px] text-zinc-600">Done</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm bg-zinc-800 border border-zinc-700" />
              <span className="mono text-[8px] text-zinc-600">Pending</span>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}