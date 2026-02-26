import { useState, useRef, useMemo,useEffect } from "react";
import { useNavigate,useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Trash2, Image as ImageIcon } from "lucide-react";

/* ==================================================
   FINAL UPDATED ADVANCED TEST CREATOR
   Added features:
   ✅ Section timer
   ✅ Section max marks (auto calculated)
   ✅ Marks per question
   ✅ Unlimited options
   ✅ Image for question + option
   ✅ Numerical questions
   ✅ Left section panel
   ✅ Right question navigation panel
   ✅ Auto totals
   ✅ Fully responsive
================================================== */

export default function TestCreator() {
  /* ==================================================
     GLOBAL STATE
  ================================================== */
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(60);
  const navigate = useNavigate();
  const { testId } = useParams();

  const [sections, setSections] = useState([
    {
      id: 1,
      name: "Section 1",
      time: 30,
      questions: [],
    },
  ]);

  const [activeSectionId, setActiveSectionId] = useState(1);
  const questionRefs = useRef({});

  const activeSection = useMemo(
    () => sections.find((s) => s.id === activeSectionId),
    [sections, activeSectionId]
  );

  /* ==================================================
     test updation if testId is present (edit mode)
  ================================================== */
  useEffect(() => {
    if (!testId) return;

    const allTests = JSON.parse(localStorage.getItem("tests")) || [];

    const existing = allTests.find(
      (t) => String(t.id) === String(testId)
    );

    if (!existing) {
      alert("Test not found!");
      navigate("/creator-dashboard");
      return;
    }

    setTitle(existing.title || "");
    setDuration(existing.duration || 60);

    if (existing.sections && existing.sections.length > 0) {
      setSections(existing.sections);
      setActiveSectionId(existing.sections[0].id);
    } else {
      // fallback for old structure
      setSections([
        {
          id: 1,
          name: "Section 1",
          time: existing.duration || 30,
          questions: existing.questions || [],
        },
      ]);
      setActiveSectionId(1);
    }
  }, [testId]);

  /* ==================================================
     SECTION HELPERS
  ================================================== */
  const addSection = () => {
    const id = Date.now();
    setSections((prev) => [
      ...prev,
      {
        id,
        name: `Section ${prev.length + 1}`,
        time: 30,
        questions: [],
      },
    ]);
    setActiveSectionId(id);
  };

  const updateSection = (id, field, value) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  /* ==================================================
     QUESTION HELPERS
  ================================================== */
  const addQuestion = () => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === activeSectionId
          ? {
              ...s,
              questions: [
                ...s.questions,
                {
                  id: Date.now(),
                  type: "mcq",
                  text: "",
                  image: null,
                  marks: 1,
                  options: [
                    { id: 1, text: "", image: null },
                    { id: 2, text: "", image: null },
                  ],
                  answer: "",
                },
              ],
            }
          : s
      )
    );
  };

  const updateQuestion = (qid, field, value) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === activeSectionId
          ? {
              ...s,
              questions: s.questions.map((q) =>
                q.id === qid ? { ...q, [field]: value } : q
              ),
            }
          : s
      )
    );
  };

  const deleteQuestion = (qid) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === activeSectionId
          ? { ...s, questions: s.questions.filter((q) => q.id !== qid) }
          : s
      )
    );
  };

  const addOption = (qid) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === activeSectionId
          ? {
              ...s,
              questions: s.questions.map((q) =>
                q.id === qid
                  ? {
                      ...q,
                      options: [
                        ...q.options,
                        { id: Date.now(), text: "", image: null },
                      ],
                    }
                  : q
              ),
            }
          : s
      )
    );
  };

  const updateOption = (qid, oid, field, value) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === activeSectionId
          ? {
              ...s,
              questions: s.questions.map((q) =>
                q.id === qid
                  ? {
                      ...q,
                      options: q.options.map((o) =>
                        o.id === oid ? { ...o, [field]: value } : o
                      ),
                    }
                  : q
              ),
            }
          : s
      )
    );
  };

  /* ==================================================
     UTILS
  ================================================== */
  const handleImage = (file) => file && URL.createObjectURL(file);

  const scrollToQuestion = (qid) => {
    questionRefs.current[qid]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

// const saveTest = () => {
  
//   if (!title || !duration || sections.every((s) => s.questions.length === 0)) {
//     alert("Please complete all fields");
//     return;
//   }

//   const creator = localStorage.getItem("creatorUser");

//   if (!creator) {
//     alert("Not authorized");
//     return;
//   }

//   const allTests = JSON.parse(localStorage.getItem("tests")) || [];
//   const totalMarks = sections.reduce(
//       (acc, sec) =>
//         acc +
//         sec.questions.reduce(
//           (qAcc, q) => qAcc + Number(q.marks || 0),
//           0
//         ),
//       0
//     );

//   const newTest = {
//     id: "TST-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
//     title,
//     duration: Number(duration),
//     sections,
//     totalMarks,
//     attempts: 0,
//     published: true,
//     createdBy: creator,   // VERY IMPORTANT
//     createdAt: new Date().toISOString(),
//   };

//   const updatedTests = [...allTests, newTest];

//   localStorage.setItem("tests", JSON.stringify(updatedTests));

//   alert("Test Created Successfully!");

//   navigate("/creator-dashboard"); // redirect after save
// };

const saveTest = () => {
  if (!title || sections.every((s) => s.questions.length === 0)) {
    alert("Add at least one question");
    return;
  }

  const creator = localStorage.getItem("creatorUser");
  const allTests = JSON.parse(localStorage.getItem("tests")) || [];

  const totalMarks = sections.reduce(
    (acc, sec) =>
      acc +
      sec.questions.reduce(
        (qAcc, q) => qAcc + Number(q.marks || 0),
        0
      ),
    0
  );

  if (testId) {
    // 🔥 FIND INDEX INSTEAD OF MAP
    const index = allTests.findIndex(
      (t) => t.id.trim() === testId.trim()
    );

    if (index === -1) {
      alert("Original test not found. Cannot update.");
      return;
    }

    // 🔥 UPDATE DIRECTLY BY INDEX
    allTests[index] = {
      ...allTests[index], // preserve original id + metadata
      title,
      duration: Number(duration),
      sections,
      totalMarks,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem("tests", JSON.stringify(allTests));

    alert("Test Updated Successfully!");
  } else {
    // CREATE MODE
    const newTest = {
      id:
        "TST-" +
        Math.random().toString(36).substring(2, 8).toUpperCase(),
      title,
      duration: Number(duration),
      sections,
      totalMarks,
      attempts: 0,
      published: true,
      createdBy: creator,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "tests",
      JSON.stringify([...allTests, newTest])
    );

    alert("Test Created Successfully!");
  }

  navigate("/creator-dashboard");
};
  /* ==================================================
     TOTAL MARKS CALCULATION
  ================================================== */
  const getSectionMarks = (sec) =>
    sec.questions.reduce((a, q) => a + Number(q.marks || 0), 0);

  const totalMarks = sections.reduce((a, s) => a + getSectionMarks(s), 0);

  /* ==================================================
     UI
  ================================================== */
  return (
    <div className="h-screen w-screen flex bg-slate-950 text-white overflow-hidden">
      {/* ================================================== LEFT SIDEBAR */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col gap-3 overflow-y-auto">
        <h2 className="font-semibold text-lg">Sections</h2>

        {sections.map((s) => (
          <div
            key={s.id}
            onClick={() => setActiveSectionId(s.id)}
            className={`p-3 rounded-xl space-y-2 cursor-pointer ${
              s.id === activeSectionId ? "bg-indigo-600" : "bg-slate-800"
            }`}
          >
            <input
              value={s.name}
              onChange={(e) => updateSection(s.id, "name", e.target.value)}
              className="bg-transparent w-full outline-none font-semibold"
            />

            <div className="flex gap-2 text-xs">
              <input
                type="number"
                value={s.time}
                onChange={(e) => updateSection(s.id, "time", e.target.value)}
                className="bg-slate-700 p-1 rounded w-16"
              />
              <span>min</span>

              <span className="ml-auto">Marks: {getSectionMarks(s)}</span>
            </div>
          </div>
        ))}

        <button onClick={addSection} className="bg-green-600 rounded-xl py-2">
          + Add Section
        </button>

        <div className="text-xs text-slate-400 mt-4">Total Marks: {totalMarks}</div>
      </aside>

      {/* ================================================== CENTER */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Create Test</h1>

        <div className="grid md:grid-cols-2 gap-4">
          <input
            placeholder="Test Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="p-3 rounded-xl bg-slate-800"
          />

          <input
            type="number"
            placeholder="Total Duration (minutes)"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="p-3 rounded-xl bg-slate-800"
          />
        </div>

        {/* QUESTIONS */}
        {activeSection?.questions.map((q, index) => (
          <motion.div
            key={q.id}
            ref={(el) => (questionRefs.current[q.id] = el)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 p-5 rounded-2xl shadow-lg space-y-4"
          >
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">Question {index + 1}</h2>

              <div className="flex gap-3 items-center">
                <input
                  type="number"
                  value={q.marks}
                  onChange={(e) => updateQuestion(q.id, "marks", e.target.value)}
                  className="bg-slate-800 w-16 p-1 rounded text-xs"
                />
                <span className="text-xs">marks</span>

                <button onClick={() => deleteQuestion(q.id)} className="text-red-400">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* TYPE */}
            <select
              value={q.type}
              onChange={(e) => updateQuestion(q.id, "type", e.target.value)}
              className="bg-slate-800 p-2 rounded-lg"
            >
              <option value="mcq">MCQ</option>
              <option value="numerical">Numerical</option>
            </select>

            {/* QUESTION TEXT */}
            <textarea
              placeholder="Enter question text"
              value={q.text}
              onChange={(e) => updateQuestion(q.id, "text", e.target.value)}
              className="w-full p-3 bg-slate-800 rounded-xl"
            />

            {/* IMAGE */}
            <label className="cursor-pointer flex gap-2 items-center text-sm">
              <ImageIcon size={16} /> Add Image
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(e) => updateQuestion(q.id, "image", handleImage(e.target.files[0]))}
              />
            </label>

            {q.image && <img src={q.image} className="w-40 rounded" />}

            {/* MCQ */}
            {q.type === "mcq" && (
              <div className="space-y-2">
                {q.options.map((o, i) => (
                  <div key={o.id} className="flex gap-2 items-center">
                    <input
                      type="radio"
                      name={`ans-${q.id}`}
                      onChange={() => updateQuestion(q.id, "answer", i)}
                    />

                    <input
                      placeholder={`Option ${i + 1}`}
                      value={o.text}
                      onChange={(e) => updateOption(q.id, o.id, "text", e.target.value)}
                      className="flex-1 p-2 bg-slate-800 rounded"
                    />

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => updateOption(q.id, o.id, "image", handleImage(e.target.files[0]))}
                    />
                  </div>
                ))}

                <button onClick={() => addOption(q.id)} className="text-green-400 text-sm">
                  + Add Option
                </button>
              </div>
            )}

            {/* NUMERICAL */}
            {q.type === "numerical" && (
              <input
                placeholder="Correct Answer"
                value={q.answer}
                onChange={(e) => updateQuestion(q.id, "answer", e.target.value)}
                className="p-2 bg-slate-800 rounded"
              />
            )}
          </motion.div>
        ))}

        <div className="flex gap-4">
          <button onClick={addQuestion} className="bg-green-600 px-6 py-3 rounded-xl">
            + Add Question
          </button>

          <button onClick={saveTest} className="bg-blue-600 px-6 py-3 rounded-xl">
            Save Test
          </button>
        </div>
      </main>

      {/* ================================================== RIGHT NAV */}
      <aside className="w-20 bg-slate-900 border-l border-slate-800 p-3 overflow-y-auto">
        <h3 className="text-xs text-center mb-2">Jump</h3>

        <div className="grid grid-cols-2 gap-2">
          {activeSection?.questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => scrollToQuestion(q.id)}
              className="bg-slate-800 hover:bg-indigo-600 rounded text-xs py-2"
            >
              {i + 1}
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
