-- ============================================================
-- ClassHire: Seed Nigerian teaching resources (DRAFTS)
-- Run in Supabase SQL Editor. All rows are is_published = false:
-- review in /admin/resources, then publish.
-- Content is original. Official documents are linked, not copied.
-- Verify dates, fees and deadlines against the linked source
-- before publishing (TRCN rules change often).
-- ============================================================

INSERT INTO resource_posts
  (title, slug, excerpt, body, category, resource_type, external_url, tags, read_time_minutes, seo_title, seo_description, is_published)
VALUES

-- ─── CURRICULUM ──────────────────────────────────────────────
(
  'Nigeria''s Revised Basic and Senior Secondary Curriculum: A Teacher''s Overview',
  'nigeria-revised-curriculum-teachers-overview',
  'What changed in the revised NERDC curriculum, how subjects are grouped by level, and where to download the official documents.',
  '<h2>What this guide covers</h2><p>The Federal Government and NERDC released a revised Basic Education Curriculum and Senior Secondary curriculum with streamlined subject lists per level. This page helps you find the official documents and understand how to use them in your planning.</p><h2>How to use the curriculum</h2><ul><li>Start from the subject list for your level (Primary 1-3, Primary 4-6, JSS, SSS).</li><li>Use the curriculum content and performance objectives as the base for your scheme of work.</li><li>Check whether your state or school has a unified scheme that follows the same document.</li></ul><h2>Official sources</h2><p>Always download from NERDC (nerdc.gov.ng) or the Federal Ministry of Education (education.gov.ng). Paid third-party copies may be outdated.</p><h2>Tip</h2><p>Save the PDF for your subject and class offline. Mark each topic with the term and week you plan to teach it.</p>',
  'Curriculum Guide', 'link', 'https://nerdc.gov.ng',
  ARRAY['curriculum','nerdc','basic education','secondary','nigeria'], 6,
  'Nigeria Revised Curriculum 2025: Teacher Overview and Downloads',
  'Overview of Nigeria''s revised basic and senior secondary curriculum with links to official NERDC documents.', false
),
(
  'Primary School Subjects by Class Level in Nigeria',
  'primary-school-subjects-by-level-nigeria',
  'A quick reference to the core subjects at Primary 1-3, Primary 4-6 and Junior Secondary under the revised curriculum.',
  '<h2>Core subjects</h2><p>English Studies, Mathematics and a Nigerian language appear at every basic level. Other subjects vary by level, so confirm against the official subject list before planning.</p><h2>Why it matters</h2><p>Schools are expected to teach the approved subjects only. Knowing the list helps you answer interview questions and plan a realistic timetable.</p><h2>Check the source</h2><p>The authoritative list is published by NERDC and the Federal Ministry of Education.</p>',
  'Curriculum Guide', 'link', 'https://education.gov.ng/wp-content/uploads/2025/09/FG-OVERHAULS-CURRICULUM-1.pdf',
  ARRAY['subjects','primary','jss','curriculum'], 4,
  'Approved Primary and JSS Subjects in Nigeria',
  'Quick reference to approved subjects by class level in Nigeria, with the official Federal Ministry source.', false
),

-- ─── LESSON NOTES ────────────────────────────────────────────
(
  'How to Write a Lesson Note in Nigeria: Format and Steps',
  'how-to-write-lesson-note-nigeria',
  'A clear, step-by-step lesson note format for Nigerian primary and secondary teachers, with the headings schools and inspectors expect.',
  '<h2>Lesson note vs lesson plan</h2><p>A lesson plan is the outline. A lesson note expands it with the full classroom procedure. Many schools combine both.</p><h2>Standard headings</h2><ul><li>Subject, class, term, week, date, duration</li><li>Topic and sub-topic</li><li>Behavioural (performance) objectives</li><li>Previous knowledge</li><li>Instructional materials</li><li>Introduction</li><li>Presentation (steps with teacher and pupil activities)</li><li>Evaluation</li><li>Summary / conclusion</li><li>Assignment</li></ul><h2>Writing good objectives</h2><p>Use measurable verbs: list, define, identify, solve, draw. Avoid "understand" or "know".</p><h2>Practical tips</h2><ul><li>Write the lesson from your scheme of work, one week at a time.</li><li>Keep each step short, with a time guide.</li><li>Plan at least three evaluation questions.</li></ul>',
  'Lesson Notes', 'article', NULL,
  ARRAY['lesson note','lesson plan','format','primary','secondary'], 8,
  'How to Write a Lesson Note in Nigeria (Format + Steps)',
  'Step-by-step Nigerian lesson note format with objectives, procedure, evaluation and assignment.', false
),
(
  'Free Lesson Note Template for Nigerian Primary Schools',
  'lesson-note-template-primary-nigeria',
  'A fill-in-the-blank lesson note template you can copy for any primary subject.',
  '<h2>Template</h2><p><strong>Subject:</strong> ______ &nbsp; <strong>Class:</strong> ______ &nbsp; <strong>Term/Week:</strong> ______</p><p><strong>Topic:</strong> ______ &nbsp; <strong>Duration:</strong> ______</p><p><strong>Objectives:</strong> By the end of the lesson, pupils should be able to (1) ______ (2) ______</p><p><strong>Previous knowledge:</strong> ______</p><p><strong>Materials:</strong> ______</p><p><strong>Introduction:</strong> ______</p><p><strong>Presentation:</strong><br/>Step 1 - Teacher: ______ / Pupils: ______<br/>Step 2 - Teacher: ______ / Pupils: ______</p><p><strong>Evaluation:</strong> ______</p><p><strong>Summary:</strong> ______</p><p><strong>Assignment:</strong> ______</p>',
  'Lesson Notes', 'article', NULL,
  ARRAY['template','lesson note','primary'], 4,
  'Lesson Note Template for Nigerian Primary Schools',
  'Copy-ready lesson note template for any Nigerian primary school subject.', false
),

-- ─── SCHEMES OF WORK ─────────────────────────────────────────
(
  'How to Make a Scheme of Work from the NERDC Curriculum',
  'how-to-make-scheme-of-work-nigeria',
  'Turn the curriculum into a term-by-term scheme of work: weeks, topics, objectives and resources.',
  '<h2>What a scheme of work is</h2><p>A scheme of work spreads the curriculum topics across the weeks of a term. It is the bridge between the curriculum and your daily lesson notes.</p><h2>Steps</h2><ol><li>Count the usable weeks in the term (remove exam, holiday and revision weeks; most terms have about 12-13 teaching weeks).</li><li>List the curriculum topics for your class and subject.</li><li>Group related topics and give heavier topics more weeks.</li><li>Put revision and examination in the last weeks.</li><li>Add a column for objectives, activities and materials.</li></ol><h2>Suggested columns</h2><p>Week | Topic | Sub-topics | Objectives | Activities | Resources | Evaluation</p><h2>Check with your school</h2><p>Many states and schools issue a unified scheme. Follow it if one exists.</p>',
  'Schemes of Work', 'article', NULL,
  ARRAY['scheme of work','planning','curriculum','term'], 7,
  'How to Make a Scheme of Work in Nigeria (Step-by-Step)',
  'Learn how to build a term scheme of work from the Nigerian curriculum, with columns and a weekly plan.', false
),
(
  'Scheme of Work Template (Three Terms) for Nigerian Schools',
  'scheme-of-work-template-nigeria',
  'A reusable term-by-term scheme of work layout you can adapt for any subject and class.',
  '<h2>Layout</h2><table><tr><th>Week</th><th>Topic</th><th>Objectives</th><th>Activities</th><th>Resources</th></tr><tr><td>1</td><td></td><td></td><td></td><td></td></tr><tr><td>2</td><td></td><td></td><td></td><td></td></tr></table><p>Repeat for each week of the term. Reserve the final weeks for revision and examination.</p><h2>How to use</h2><p>Copy into Word or Google Sheets, fill from the official curriculum, and keep one file per subject per term.</p>',
  'Schemes of Work', 'article', NULL,
  ARRAY['scheme of work','template','term'], 3,
  'Scheme of Work Template for Nigerian Schools',
  'Free scheme of work template layout for Nigerian primary and secondary teachers.', false
),

-- ─── TEACHING GUIDES ─────────────────────────────────────────
(
  'Classroom Management Tips for Large Nigerian Classrooms',
  'classroom-management-large-classes-nigeria',
  'Practical routines for managing 40-60 pupils with limited materials.',
  '<h2>Start with routines</h2><ul><li>Teach entry, seating, and quiet signals in week one.</li><li>Assign pupil monitors for books, board and cleaning.</li></ul><h2>Use group work</h2><p>Groups of 5-6 let you check more pupils. Give each group a role (reader, writer, reporter).</p><h2>Check understanding fast</h2><ul><li>Use slates or exercise books held up on cue.</li><li>Ask pairs to explain to each other before you call on anyone.</li></ul><h2>Low-cost materials</h2><p>Use bottle tops, sticks, cardboard and local objects as counters and teaching aids.</p>',
  'Teaching Guide', 'article', NULL,
  ARRAY['classroom management','large class','teaching tips'], 6,
  'Classroom Management for Large Classes in Nigeria',
  'Practical routines and low-cost strategies for managing large Nigerian classrooms.', false
),
(
  'Teaching Methods Every Nigerian Teacher Should Know',
  'teaching-methods-nigerian-teachers',
  'Plain-language guide to common methods: demonstration, discussion, project, play, question and answer.',
  '<h2>Common methods</h2><ul><li><strong>Question and answer:</strong> quick checks and recall.</li><li><strong>Demonstration:</strong> show the skill, then let pupils try.</li><li><strong>Discussion:</strong> pupils explain and compare ideas.</li><li><strong>Project:</strong> pupils produce something over several days.</li><li><strong>Play and games:</strong> useful for early years and revision.</li></ul><h2>Choosing a method</h2><p>Match the method to the objective. A skill needs demonstration and practice; a concept needs discussion and examples.</p>',
  'Teaching Guide', 'article', NULL,
  ARRAY['teaching methods','pedagogy','lesson planning'], 5,
  'Teaching Methods for Nigerian Teachers',
  'Guide to common teaching methods and how to choose the right one for your lesson.', false
),

-- ─── CLASS GAMES ─────────────────────────────────────────────
(
  '10 Classroom Games for Nigerian Primary Schools (No Materials Needed)',
  'classroom-games-primary-nigeria',
  'Simple, low-cost games for English, mathematics and general revision that work in any classroom.',
  '<h2>Games</h2><ol><li><strong>Word chain:</strong> each pupil says a word starting with the last letter of the previous one.</li><li><strong>Number bingo:</strong> pupils write numbers on slates; call sums, they cross the answers.</li><li><strong>Hot seat:</strong> one pupil answers questions from the class.</li><li><strong>Spelling relay:</strong> teams send one pupil at a time to write the next word.</li><li><strong>Simon says (English commands):</strong> practise instructions and listening.</li><li><strong>I spy:</strong> vocabulary using classroom objects.</li><li><strong>Multiplication circle:</strong> pass a ball; the catcher answers.</li><li><strong>True or false corners:</strong> pupils move to a side of the room.</li><li><strong>Mime the word:</strong> act out verbs and animals.</li><li><strong>Story circle:</strong> each pupil adds one sentence.</li></ol><h2>Tips</h2><p>Keep games to 5-10 minutes, state the learning aim, and rotate roles so every pupil participates.</p>',
  'Class Games', 'article', NULL,
  ARRAY['games','primary','revision','english','mathematics'], 6,
  '10 Classroom Games for Nigerian Primary Schools',
  'Ten simple classroom games for Nigerian primary teachers that need no materials.', false
),
(
  'Indigenous Nigerian Games You Can Use for Learning',
  'indigenous-nigerian-games-for-learning',
  'Turn familiar playground games into counting, language and teamwork activities.',
  '<h2>Ideas</h2><ul><li><strong>Ayo/Mancala-style counting:</strong> practise addition and subtraction with seeds or stones.</li><li><strong>Clapping and rhyme games:</strong> rhythm, memory and vocabulary.</li><li><strong>Skipping and hopscotch:</strong> counting, number order and movement.</li><li><strong>Storytelling (moonlight tales):</strong> listening, sequencing and moral lessons.</li></ul><h2>Why use them</h2><p>Pupils already know the rules, so more time goes to learning. They also keep local culture in the classroom.</p>',
  'Class Games', 'article', NULL,
  ARRAY['indigenous games','culture','primary','counting'], 4,
  'Indigenous Nigerian Games for Classroom Learning',
  'Use traditional Nigerian games to teach counting, language and teamwork.', false
),

-- ─── TRCN GUIDES ─────────────────────────────────────────────
(
  'TRCN Professional Qualifying Examination (PQE): What Teachers Should Know',
  'trcn-pqe-guide-for-teachers',
  'An overview of the TRCN PQE, who needs it, and where to register and find past questions. Always confirm details on trcn.gov.ng.',
  '<h2>What is the PQE?</h2><p>The Professional Qualifying Examination is the mandatory exam for teacher registration in Nigeria. Passing it leads to certification and licensing.</p><h2>Where to start</h2><ul><li>Use the official TRCN website and candidate portal only.</li><li>Beware of fake portals and social media offers. TRCN has issued warnings about them.</li><li>Check the past-questions pages and the exam guide on the TRCN site.</li></ul><h2>Registration and licence</h2><p>Passing the exam is not the end: you must complete registration and licensing. Licences are renewed periodically through professional development, per TRCN rules.</p><p><em>Fees, dates and deadlines change. Confirm on trcn.gov.ng before acting.</em></p>',
  'TRCN Guide', 'link', 'https://trcn.gov.ng/status/knowledge-base/pqe-exam-guide',
  ARRAY['trcn','pqe','licence','registration'], 6,
  'TRCN PQE Guide for Nigerian Teachers',
  'Overview of the TRCN Professional Qualifying Examination with official links.', false
),
(
  'How to Avoid TRCN Scams and Fake Portals',
  'avoid-trcn-scams-fake-portals',
  'Simple checks to protect yourself when paying for TRCN registration, exams or certificates.',
  '<h2>Checklist</h2><ul><li>Only use trcn.gov.ng and its official sub-sites.</li><li>Do not pay individuals or WhatsApp agents.</li><li>Keep payment receipts and reference numbers.</li><li>Verify certificates through official TRCN channels.</li></ul><h2>If in doubt</h2><p>Contact your nearest TRCN state office through details on the official website.</p>',
  'TRCN Guide', 'article', NULL,
  ARRAY['trcn','scam','safety','certificate'], 3,
  'Avoid TRCN Scams and Fake Portals',
  'Checklist to avoid fake TRCN portals and scams when registering or paying for exams.', false
);
