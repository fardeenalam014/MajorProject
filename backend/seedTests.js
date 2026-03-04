/**
 * seedTests.js
 * Run with: node seedTests.js <creatorUserId>
 * Example:  node seedTests.js 507f1f77bcf86cd799439011
 *
 * Place this file in your backend root (same level as server.js)
 */
require("node:dns/promises").setDefaultResultOrder("ipv4first");
require("node:dns/promises").setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
require("dotenv").config();
const mongoose = require("mongoose");
const Test     = require("./models/Test"); // adjust path if needed

const CREATOR_ID = process.argv[2];
if (!CREATOR_ID) {
  console.error("❌  Usage: node seedTests.js <creatorUserId>");
  process.exit(1);
}

/* ── helpers ── */
const mcq = (text, options, correct, marks = 1, negativeMark = 0) => ({
  type: "mcq",
  text,
  image: null,
  options: options.map(o => ({ text: o, image: null })),
  correct,
  marks,
  negativeMark,
});

const num = (text, correct, marks = 2, negativeMark = 0) => ({
  type: "numerical",
  text,
  image: null,
  options: [],
  correct: String(correct),
  marks,
  negativeMark,
});

/* ══════════════════════════════════════════════════
   10 TEST DEFINITIONS
══════════════════════════════════════════════════ */
const tests = [

  /* 1 ── General Knowledge */
  {
    title:       "General Knowledge — Basic",
    description: "A quick general knowledge quiz covering geography, science, and history.",
    duration:    30,
    published:   true,
    settings: { passPercentage: 40, maxAttempts: 2 },
    sections: [{
      title: "General Knowledge",
      duration: 0,
      questions: [
        mcq("What is the capital of France?",
          ["Berlin","Madrid","Paris","Rome"], "Paris"),
        mcq("Which planet is known as the Red Planet?",
          ["Venus","Mars","Jupiter","Saturn"], "Mars"),
        mcq("Who wrote 'Romeo and Juliet'?",
          ["Charles Dickens","William Shakespeare","Mark Twain","Leo Tolstoy"],
          "William Shakespeare"),
        mcq("What is the chemical symbol for Gold?",
          ["Ag","Fe","Au","Pb"], "Au"),
        mcq("How many continents are there on Earth?",
          ["5","6","7","8"], "7"),
        num("How many sides does a hexagon have?", 6),
        mcq("Which ocean is the largest?",
          ["Atlantic","Indian","Arctic","Pacific"], "Pacific"),
        mcq("What is the hardest natural substance on Earth?",
          ["Gold","Iron","Diamond","Platinum"], "Diamond"),
        mcq("In which year did World War II end?",
          ["1943","1944","1945","1946"], "1945"),
        num("What is the square root of 144?", 12),
      ],
    }],
  },

  /* 2 ── Mathematics */
  {
    title:       "Mathematics — Algebra & Arithmetic",
    description: "Tests basic algebra, arithmetic, and problem-solving skills.",
    duration:    45,
    published:   true,
    settings: { passPercentage: 50, maxAttempts: 1, shuffleQuestions: true },
    sections: [
      {
        title: "Arithmetic",
        duration: 900,
        questions: [
          num("What is 15 × 13?", 195, 2),
          num("What is 256 ÷ 16?", 16, 2),
          num("What is 17² (17 squared)?", 289, 2),
          mcq("Which of the following is a prime number?",
            ["9","15","17","21"], "17", 1, 0.25),
          num("What is 12.5% of 200?", 25, 2),
        ],
      },
      {
        title: "Algebra",
        duration: 1800,
        questions: [
          mcq("Solve: 2x + 5 = 13. What is x?",
            ["3","4","5","6"], "4", 2, 0.5),
          mcq("What is the value of x² − 5x + 6 when x = 3?",
            ["0","1","2","3"], "0", 2, 0.5),
          num("If 3x − 7 = 14, what is x?", 7, 2),
          mcq("Which expression is equivalent to (a + b)²?",
            ["a² + b²","a² + 2ab + b²","a² − 2ab + b²","2a + 2b"],
            "a² + 2ab + b²", 2, 0.5),
          num("Simplify: 4(3x − 2) = 28. What is x?", 3, 2),
        ],
      },
    ],
  },

  /* 3 ── Science: Physics */
  {
    title:       "Physics — Fundamentals",
    description: "Covers motion, force, energy and basic electromagnetism.",
    duration:    40,
    published:   true,
    settings: { passPercentage: 40, shuffleOptions: true },
    sections: [{
      title: "Physics",
      duration: 0,
      questions: [
        mcq("What is the SI unit of force?",
          ["Joule","Watt","Newton","Pascal"], "Newton", 1, 0.25),
        mcq("Which law states F = ma?",
          ["Newton's First Law","Newton's Second Law","Newton's Third Law","Ohm's Law"],
          "Newton's Second Law", 1, 0.25),
        num("An object travels 100 m in 5 seconds. What is its speed in m/s?", 20, 2),
        mcq("What type of energy does a moving object possess?",
          ["Potential energy","Thermal energy","Kinetic energy","Chemical energy"],
          "Kinetic energy", 1, 0.25),
        mcq("What is the speed of light in vacuum (approx)?",
          ["3×10⁶ m/s","3×10⁸ m/s","3×10¹⁰ m/s","3×10⁴ m/s"],
          "3×10⁸ m/s", 2, 0.5),
        mcq("What is the unit of electric resistance?",
          ["Ampere","Volt","Ohm","Watt"], "Ohm", 1, 0.25),
        num("If voltage is 12V and resistance is 4Ω, what is the current in Amperes (Ohm's Law)?", 3, 2),
        mcq("Which particle has a negative charge?",
          ["Proton","Neutron","Electron","Positron"], "Electron", 1, 0.25),
        mcq("What is the unit of power?",
          ["Joule","Newton","Watt","Hertz"], "Watt", 1, 0.25),
        mcq("Gravitational acceleration on Earth is approximately?",
          ["8.9 m/s²","9.8 m/s²","10.8 m/s²","11 m/s²"], "9.8 m/s²", 1, 0.25),
      ],
    }],
  },

  /* 4 ── Science: Chemistry */
  {
    title:       "Chemistry — Periodic Table & Reactions",
    description: "Basic chemistry: elements, compounds, and chemical reactions.",
    duration:    35,
    published:   true,
    settings: { passPercentage: 40 },
    sections: [{
      title: "Chemistry",
      duration: 0,
      questions: [
        mcq("What is the atomic number of Carbon?",
          ["4","6","8","12"], "6", 1, 0.25),
        mcq("Which gas is produced when acid reacts with a metal?",
          ["Oxygen","Carbon dioxide","Hydrogen","Nitrogen"], "Hydrogen", 1, 0.25),
        mcq("What is the chemical formula of water?",
          ["H₂O₂","HO","H₂O","H₃O"], "H₂O", 1),
        mcq("Which element has the symbol 'Na'?",
          ["Nitrogen","Neon","Sodium","Nickel"], "Sodium", 1, 0.25),
        mcq("pH of a neutral solution is?",
          ["0","7","14","1"], "7", 1, 0.25),
        mcq("What type of bond involves sharing of electrons?",
          ["Ionic bond","Metallic bond","Covalent bond","Hydrogen bond"],
          "Covalent bond", 2, 0.5),
        num("How many elements are in the modern periodic table?", 118, 2),
        mcq("Which is the lightest element?",
          ["Helium","Hydrogen","Lithium","Carbon"], "Hydrogen", 1, 0.25),
        mcq("What is the valency of Oxygen?",
          ["1","2","3","4"], "2", 1, 0.25),
        mcq("Rusting of iron is an example of?",
          ["Physical change","Reduction","Oxidation","Sublimation"],
          "Oxidation", 1, 0.25),
      ],
    }],
  },

  /* 5 ── English Grammar */
  {
    title:       "English Grammar — Intermediate",
    description: "Tests tenses, parts of speech, and sentence correction.",
    duration:    25,
    published:   true,
    settings: { passPercentage: 50, shuffleQuestions: true },
    sections: [{
      title: "Grammar",
      duration: 0,
      questions: [
        mcq("Choose the correct sentence:",
          [
            "She don't like coffee.",
            "She doesn't likes coffee.",
            "She doesn't like coffee.",
            "She not like coffee.",
          ],
          "She doesn't like coffee.", 1, 0.25),
        mcq("What is the plural of 'child'?",
          ["Childs","Childes","Children","Childrens"], "Children", 1),
        mcq("Which of these is a conjunction?",
          ["Quickly","Beautiful","But","Softly"], "But", 1),
        mcq("Identify the adverb: 'She sings beautifully.'",
          ["She","sings","beautifully","."], "beautifully", 1),
        mcq("'The cat sat on the mat.' — 'on' is a?",
          ["Verb","Adjective","Preposition","Adverb"], "Preposition", 1),
        mcq("Which tense is: 'I have finished my homework.'?",
          ["Simple past","Present perfect","Past perfect","Future perfect"],
          "Present perfect", 2, 0.5),
        mcq("The synonym of 'happy' is:",
          ["Sad","Joyful","Angry","Tired"], "Joyful", 1),
        mcq("What is the antonym of 'ancient'?",
          ["Old","Vintage","Modern","Historic"], "Modern", 1),
        mcq("Choose the correct article: '___ university is nearby.'",
          ["A","An","The","No article"], "A", 2, 0.5),
        mcq("'Neither the students nor the teacher ___ present.'",
          ["were","was","are","be"], "was", 2, 0.5),
      ],
    }],
  },

  /* 6 ── Computer Science */
  {
    title:       "Computer Science — Basics",
    description: "Covers data structures, algorithms, networking and OS concepts.",
    duration:    50,
    published:   true,
    settings: { passPercentage: 50, maxAttempts: 2 },
    sections: [
      {
        title: "Programming & Data Structures",
        duration: 1500,
        questions: [
          mcq("Which data structure uses LIFO?",
            ["Queue","Stack","Linked List","Tree"], "Stack", 1, 0.25),
          mcq("What is the time complexity of binary search?",
            ["O(n)","O(n²)","O(log n)","O(1)"], "O(log n)", 2, 0.5),
          mcq("Which sorting algorithm has worst-case O(n log n)?",
            ["Bubble Sort","Selection Sort","Merge Sort","Insertion Sort"],
            "Merge Sort", 2, 0.5),
          num("How many bits are in a byte?", 8, 1),
          mcq("What does HTML stand for?",
            [
              "Hyper Text Markup Language",
              "High Text Machine Language",
              "Hyper Transfer Markup Language",
              "None of the above",
            ],
            "Hyper Text Markup Language", 1),
        ],
      },
      {
        title: "Networking & OS",
        duration: 1500,
        questions: [
          mcq("Which protocol is used to send email?",
            ["FTP","HTTP","SMTP","TCP"], "SMTP", 1, 0.25),
          mcq("What does 'CPU' stand for?",
            [
              "Central Process Unit",
              "Central Processing Unit",
              "Computer Personal Unit",
              "Core Processing Unit",
            ],
            "Central Processing Unit", 1),
          num("How many layers does the OSI model have?", 7, 2),
          mcq("Which of the following is NOT an operating system?",
            ["Linux","Windows","Oracle","macOS"], "Oracle", 1, 0.25),
          mcq("RAM stands for?",
            [
              "Read Access Memory",
              "Random Access Memory",
              "Rapid Action Memory",
              "Read Anywhere Memory",
            ],
            "Random Access Memory", 1),
        ],
      },
    ],
  },

  /* 7 ── History */
  {
    title:       "World History — Modern Era",
    description: "Key events from the French Revolution to the Cold War.",
    duration:    30,
    published:   true,
    settings: { passPercentage: 40 },
    sections: [{
      title: "Modern History",
      duration: 0,
      questions: [
        mcq("In which year did the French Revolution begin?",
          ["1776","1789","1799","1804"], "1789", 1, 0.25),
        mcq("Who was the first President of the United States?",
          ["Abraham Lincoln","Thomas Jefferson","George Washington","John Adams"],
          "George Washington", 1),
        mcq("World War I began in which year?",
          ["1912","1914","1916","1918"], "1914", 1, 0.25),
        mcq("The Berlin Wall fell in?",
          ["1987","1988","1989","1990"], "1989", 1, 0.25),
        mcq("Who was the leader of the Soviet Union during WWII?",
          ["Lenin","Trotsky","Stalin","Khrushchev"], "Stalin", 2, 0.5),
        mcq("The Cold War was primarily between which two nations?",
          ["USA & China","USA & USSR","UK & USSR","USA & Germany"],
          "USA & USSR", 1, 0.25),
        num("In what year did India gain independence from Britain?", 1947, 2),
        mcq("The United Nations was founded in?",
          ["1944","1945","1946","1947"], "1945", 1, 0.25),
        mcq("Who invented the telephone?",
          ["Thomas Edison","Nikola Tesla","Alexander Graham Bell","Guglielmo Marconi"],
          "Alexander Graham Bell", 1),
        mcq("The apartheid regime was in which country?",
          ["Kenya","Zimbabwe","South Africa","Nigeria"], "South Africa", 1, 0.25),
      ],
    }],
  },

  /* 8 ── Biology */
  {
    title:       "Biology — Cell & Human Body",
    description: "Covers cell biology, genetics, and human physiology.",
    duration:    40,
    published:   true,
    settings: { passPercentage: 40, shuffleOptions: true },
    sections: [{
      title: "Biology",
      duration: 0,
      questions: [
        mcq("What is the powerhouse of the cell?",
          ["Nucleus","Ribosome","Mitochondria","Golgi body"], "Mitochondria", 1),
        mcq("DNA stands for?",
          [
            "Deoxyribonucleic Acid",
            "Diribonucleic Acid",
            "Deoxyribose Nucleic Acid",
            "None of the above",
          ],
          "Deoxyribonucleic Acid", 1),
        mcq("How many chromosomes does a normal human cell have?",
          ["23","44","46","48"], "46", 2, 0.5),
        mcq("Which organ produces insulin?",
          ["Liver","Kidney","Pancreas","Spleen"], "Pancreas", 1, 0.25),
        mcq("What is the largest organ of the human body?",
          ["Liver","Lungs","Skin","Heart"], "Skin", 1),
        num("How many chambers does the human heart have?", 4, 2),
        mcq("Which blood type is the universal donor?",
          ["A","B","AB","O"], "O", 2, 0.5),
        mcq("Photosynthesis occurs in which organelle?",
          ["Mitochondria","Chloroplast","Nucleus","Vacuole"], "Chloroplast", 1, 0.25),
        mcq("What is the basic unit of life?",
          ["Organ","Tissue","Cell","Organism"], "Cell", 1),
        mcq("Which vitamin is produced by the skin in sunlight?",
          ["Vitamin A","Vitamin B","Vitamin C","Vitamin D"], "Vitamin D", 1, 0.25),
      ],
    }],
  },

  /* 9 ── Reasoning & Aptitude */
  {
    title:       "Logical Reasoning & Aptitude",
    description: "Pattern recognition, analogies, and quantitative aptitude.",
    duration:    45,
    published:   true,
    settings: { passPercentage: 50, shuffleQuestions: true, maxAttempts: 3 },
    sections: [
      {
        title: "Logical Reasoning",
        duration: 1200,
        questions: [
          mcq("Find the odd one out: Cat, Dog, Rose, Cow",
            ["Cat","Dog","Rose","Cow"], "Rose", 1, 0.25),
          mcq("Complete the series: 2, 4, 8, 16, ___",
            ["24","28","32","30"], "32", 1, 0.25),
          mcq("If APPLE = 50, MANGO = 50, then GRAPE = ?",
            ["40","45","50","55"], "50", 2, 0.5),
          mcq("A is B's sister. B is C's brother. What is A to C?",
            ["Brother","Sister","Mother","Cannot be determined"], "Sister", 2, 0.5),
          mcq("Which shape comes next: Circle, Square, Triangle, Circle, Square, ___?",
            ["Circle","Square","Triangle","Hexagon"], "Triangle", 1, 0.25),
        ],
      },
      {
        title: "Quantitative Aptitude",
        duration: 1500,
        questions: [
          num("A train travels 360 km in 4 hours. What is its speed in km/h?", 90, 2),
          mcq("What is 30% of 450?",
            ["100","125","135","150"], "135", 1, 0.25),
          num("If a shirt costs ₹500 and is discounted by 20%, what is the final price?", 400, 2),
          mcq("Simple interest on ₹1000 at 5% per annum for 2 years?",
            ["₹50","₹100","₹150","₹200"], "₹100", 2, 0.5),
          num("Average of 10, 20, 30, 40, 50 is?", 30, 1),
        ],
      },
    ],
  },

  /* 10 ── Mixed / Mock Test */
  {
    title:       "Full Mock Test — Mixed Subjects",
    description: "A comprehensive mock exam covering science, maths, English and GK.",
    duration:    90,
    published:   false,   // draft — not published yet
    settings: {
      passPercentage: 40,
      shuffleQuestions: true,
      shuffleOptions:   true,
      maxAttempts:      1,
    },
    sections: [
      {
        title: "Mathematics",
        duration: 1800,
        questions: [
          num("What is 23 × 17?", 391, 2, 0.5),
          mcq("√225 = ?", ["13","14","15","16"], "15", 2, 0.5),
          mcq("What is LCM of 12 and 18?",
            ["6","24","36","54"], "36", 2, 0.5),
          num("If x + y = 10 and x − y = 4, what is x?", 7, 2, 0.5),
          mcq("Area of a circle with radius 7 (use π = 22/7)?",
            ["144","154","164","174"], "154", 2, 0.5),
        ],
      },
      {
        title: "Science",
        duration: 1800,
        questions: [
          mcq("Which gas do plants absorb from the atmosphere?",
            ["Oxygen","Carbon Dioxide","Nitrogen","Hydrogen"],
            "Carbon Dioxide", 1, 0.25),
          mcq("What is the unit of frequency?",
            ["Watt","Joule","Hertz","Pascal"], "Hertz", 1, 0.25),
          mcq("Which planet is closest to the Sun?",
            ["Venus","Earth","Mars","Mercury"], "Mercury", 1, 0.25),
          num("Boiling point of water in Celsius?", 100, 1),
          mcq("Which part of the eye controls the amount of light entering?",
            ["Retina","Cornea","Iris","Lens"], "Iris", 2, 0.5),
        ],
      },
      {
        title: "English & GK",
        duration: 1800,
        questions: [
          mcq("Choose the correctly spelled word:",
            ["Accomodation","Accommodation","Acommodation","Acomodation"],
            "Accommodation", 1, 0.25),
          mcq("The President of India is elected by?",
            [
              "Direct public vote",
              "Parliament only",
              "Electoral College",
              "Supreme Court",
            ],
            "Electoral College", 2, 0.5),
          mcq("Which is the longest river in the world?",
            ["Amazon","Yangtze","Mississippi","Nile"], "Nile", 1, 0.25),
          mcq("'Philanthropy' means?",
            [
              "Love of money",
              "Love of mankind / charitable acts",
              "Study of philosophy",
              "Fear of people",
            ],
            "Love of mankind / charitable acts", 1, 0.25),
          num("How many states are there in India (as of 2024)?", 28, 2, 0.5),
        ],
      },
    ],
  },

];

/* ══════════════════════════════════════════════════
   SEED
══════════════════════════════════════════════════ */
async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅  Connected to MongoDB");

  let created = 0;
  for (const t of tests) {
    try {
      const doc = await Test.create({ ...t, createdBy: CREATOR_ID });
      console.log(`  ✔  Created: "${doc.title}"  [${doc.testCode}]`);
      created++;
    } catch (err) {
      console.error(`  ✘  Failed: "${t.title}" — ${err.message}`);
    }
  }

  console.log(`\n🎉  Done — ${created}/${tests.length} tests seeded.`);
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });