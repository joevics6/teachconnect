-- ============================================================
-- ClassHire: Resources batch 2 + official sources (DRAFTS)
-- Run AFTER resource_sources.sql. All new rows: is_published = false.
-- Every source URL was found on the official site/search; re-check
-- that each link opens before publishing. Fees/dates/deadlines on
-- TRCN topics change often: confirm on trcn.gov.ng.
-- ============================================================

-- ─── 1. Attach official sources to batch-1 posts ─────────────
UPDATE resource_posts SET sources = $j$[
 {"label":"NERDC: Basic Education Curriculum (BEC) home","url":"https://nerdc.gov.ng/content_manager/curriculum.html"},
 {"label":"NERDC: Basic and Senior Secondary Curriculum Offerings (PDF)","url":"https://nerdc.gov.ng/content_manager/Basic%20and%20Senior%20Secondary%20Education%20Curriculum%20Offerings.pdf"},
 {"label":"Federal Ministry of Education: Curriculum overview (PDF)","url":"https://education.gov.ng/wp-content/uploads/2025/09/FG-OVERHAULS-CURRICULUM-1.pdf"}
]$j$::jsonb WHERE slug = 'nigeria-revised-curriculum-teachers-overview';

UPDATE resource_posts SET sources = $j$[
 {"label":"Federal Ministry of Education: Approved subject lists (PDF)","url":"https://education.gov.ng/wp-content/uploads/2025/09/FG-OVERHAULS-CURRICULUM-1.pdf"},
 {"label":"NERDC: Basic and Senior Secondary Curriculum Offerings (PDF)","url":"https://nerdc.gov.ng/content_manager/Basic%20and%20Senior%20Secondary%20Education%20Curriculum%20Offerings.pdf"}
]$j$::jsonb WHERE slug = 'primary-school-subjects-by-level-nigeria';

UPDATE resource_posts SET sources = $j$[
 {"label":"NERDC: Primary 1-3 curriculum subjects","url":"https://nerdc.gov.ng/content_manager/pri1-3.html"},
 {"label":"NERDC: Teachers' Handbook (PDF)","url":"https://nerdc.gov.ng/content_manager/pdf_files/teachers_handbook.pdf"}
]$j$::jsonb WHERE slug IN ('how-to-write-lesson-note-nigeria','lesson-note-template-primary-nigeria');

UPDATE resource_posts SET sources = $j$[
 {"label":"NERDC: Basic Education Curriculum (BEC) home","url":"https://nerdc.gov.ng/content_manager/curriculum.html"},
 {"label":"NERDC: Teachers' Handbook (PDF)","url":"https://nerdc.gov.ng/content_manager/pdf_files/teachers_handbook.pdf"}
]$j$::jsonb WHERE slug IN ('how-to-make-scheme-of-work-nigeria','scheme-of-work-template-nigeria');

UPDATE resource_posts SET sources = $j$[
 {"label":"TRCN: PQE Exam Guide","url":"https://trcn.gov.ng/status/knowledge-base/pqe-exam-guide"},
 {"label":"TRCN: Candidate CBT registration","url":"https://teachers.trcn.gov.ng/cbt"},
 {"label":"TRCN: PQE past questions (Category B)","url":"https://trcn.gov.ng/pqe-pass-questions/category-b"}
]$j$::jsonb WHERE slug = 'trcn-pqe-guide-for-teachers';

UPDATE resource_posts SET sources = $j$[
 {"label":"TRCN official website","url":"https://trcn.gov.ng/"},
 {"label":"Vanguard: TRCN warns teachers against fake portals","url":"https://www.vanguardngr.com/2026/09/trcn-warns-teachers-against-fake-portals-invalid-certificates/"}
]$j$::jsonb WHERE slug = 'avoid-trcn-scams-fake-portals';

UPDATE resource_posts SET sources = $j$[
 {"label":"NERDC: Teachers' Handbook (PDF)","url":"https://nerdc.gov.ng/content_manager/pdf_files/teachers_handbook.pdf"}
]$j$::jsonb WHERE slug IN ('classroom-management-large-classes-nigeria','teaching-methods-nigerian-teachers');

-- ─── 2. New resources ────────────────────────────────────────
INSERT INTO resource_posts
  (title, slug, excerpt, body, category, resource_type, external_url, sources, tags, read_time_minutes, seo_title, seo_description, is_published)
VALUES

-- Curriculum hub
(
  'NERDC Curriculum Downloads: Where to Find Official Primary and JSS Curriculum Documents',
  'nerdc-curriculum-downloads-official',
  'A directory of the official NERDC pages and PDFs for the Basic Education Curriculum, with what each one is for.',
  $b$<h2>Why use the official source</h2><p>NERDC publishes the Basic Education Curriculum for Primary 1-3, Primary 4-6 and JSS 1-3 on its own website. Using the official pages means you get the current version, free of charge.</p><h2>What is available</h2><ul><li><strong>Primary 1-3, Primary 4-6 and JSS 1-3 curriculum pages:</strong> each lists the subject curricula (for example English Studies, Mathematics, Basic Science and Technology, Culture and Creative Arts, National Values, Pre-Vocational Studies, and Nigerian languages at Primary 1-3).</li><li><strong>Curriculum offerings (PDF):</strong> the list of subjects per level.</li><li><strong>BEC implementation strategy (PDF):</strong> how the revised curriculum is meant to be rolled out.</li><li><strong>Accelerated Basic Education Curriculum:</strong> for out-of-school and accelerated programmes.</li><li><strong>eCurriculum portal:</strong> NERDC's online curriculum access.</li></ul><h2>How to use a subject curriculum</h2><p>Each curriculum is laid out in columns: topic, performance objectives, content, teacher and pupil activities, teaching and learning resources, and evaluation guide. Copy the topics into your scheme of work, then expand them into lesson notes.</p><p><em>Some pages load subject files through the site's own buttons. If a link does not open directly, start from the level page.</em></p>$b$,
  'Curriculum Guide', 'link', 'https://nerdc.gov.ng/content_manager/curriculum.html',
  $j$[
   {"label":"NERDC: Basic Education Curriculum (BEC)","url":"https://nerdc.gov.ng/content_manager/curriculum.html"},
   {"label":"NERDC: Primary 1-3 curriculum","url":"https://nerdc.gov.ng/content_manager/pri1-3.html"},
   {"label":"NERDC: Primary 4-6 curriculum","url":"https://nerdc.gov.ng/content_manager/pri4-6.html"},
   {"label":"NERDC: JSS 1-3 curriculum","url":"https://nerdc.gov.ng/content_manager/jss1-3.html"},
   {"label":"NERDC: Accelerated Basic Education Curriculum","url":"https://nerdc.gov.ng/content_manager/aep.html"},
   {"label":"NERDC: Revised 9-Year BEC Implementation Strategy (PDF)","url":"https://nerdc.gov.ng/content_manager/Revised%209%20Year%20BEC%20Implementation%20Strategy%203.pdf"},
   {"label":"NERDC: Publications","url":"https://nerdc.gov.ng/content_manager/publications.html"},
   {"label":"NERDC eCurriculum portal","url":"http://nerdc.org.ng/eCurriculum/"}
  ]$j$::jsonb,
  ARRAY['nerdc','curriculum','download','primary','jss'], 5,
  'NERDC Curriculum Download: Official Primary and JSS Documents',
  'Official NERDC curriculum pages and PDFs for Primary 1-6 and JSS 1-3, with how to use them.', false
),
(
  'How to Read a NERDC Curriculum Table and Turn It into Weekly Lessons',
  'read-nerdc-curriculum-table-weekly-lessons',
  'Understand each column of the curriculum and convert a topic into a weekly lesson.',
  $b$<h2>The columns</h2><ul><li><strong>Topic / Content:</strong> what to teach.</li><li><strong>Performance objectives:</strong> what pupils should be able to do. Copy these into your lesson note.</li><li><strong>Activities (teacher and pupils):</strong> your lesson procedure.</li><li><strong>Teaching and learning resources:</strong> materials to prepare.</li><li><strong>Evaluation guide:</strong> questions and tasks to check learning.</li></ul><h2>From topic to weekly lesson</h2><ol><li>Pick the topic for the week from your scheme of work.</li><li>Copy the objectives and make them specific to your class.</li><li>List the activities in order with time estimates.</li><li>Prepare materials and at least three evaluation questions.</li></ol>$b$,
  'Curriculum Guide', 'article', NULL,
  $j$[
   {"label":"NERDC: Primary 1-3 curriculum","url":"https://nerdc.gov.ng/content_manager/pri1-3.html"},
   {"label":"NERDC: Primary 4-6 curriculum","url":"https://nerdc.gov.ng/content_manager/pri4-6.html"}
  ]$j$::jsonb,
  ARRAY['curriculum','nerdc','lesson planning'], 4,
  'How to Read a NERDC Curriculum and Plan Weekly Lessons',
  'Understand curriculum columns and convert topics into weekly lessons.', false
),

-- NERDC teacher documents
(
  'NERDC Teachers'' Handbook and Teachers'' Guides: What Is Available',
  'nerdc-teachers-handbook-and-guides',
  'NERDC publishes a Teachers'' Handbook and subject guides for the Basic Education Curriculum. Here is what exists and how to use it.',
  $b$<h2>What NERDC has published</h2><p>NERDC's publication list includes teachers' guides for the revised 9-Year Basic Education Curriculum (Primary 1-3, Primary 4-6 and JSS 1-3), a teachers' guide for the pre-primary curriculum, a teachers' handbook for the primary level, and a handbook on selecting and using instructional materials from local resources.</p><h2>How to use them</h2><ul><li>Read the handbook for methods and planning advice.</li><li>Use subject guides to see suggested activities and assessment.</li><li>Use the local-materials handbook to make teaching aids from low-cost items.</li></ul><p><em>Some guides are sold, and some are listed as unpublished. The Teachers' Handbook PDF is on NERDC's publications page.</em></p>$b$,
  'Teaching Guide', 'link', 'https://nerdc.gov.ng/content_manager/pdf_files/teachers_handbook.pdf',
  $j$[
   {"label":"NERDC: Teachers' Handbook (PDF)","url":"https://nerdc.gov.ng/content_manager/pdf_files/teachers_handbook.pdf"},
   {"label":"NERDC: List of publications (PDF)","url":"https://www.nerdc.gov.ng/content_manager/pdf_files/nerdc_publications.pdf"},
   {"label":"NERDC: Curriculum Development Centre achievements","url":"https://nerdc.gov.ng/content_manager/cdc_achievements.html"}
  ]$j$::jsonb,
  ARRAY['teachers handbook','nerdc','teachers guide'], 4,
  'NERDC Teachers'' Handbook and Guides for Nigerian Teachers',
  'Overview of NERDC teachers'' handbooks and guides with official links.', false
),
(
  'National Reading Framework: A Practical Summary for Primary Teachers',
  'national-reading-framework-primary-teachers',
  'Why Nigeria has a national reading framework and how to bring reading practice into daily lessons.',
  $b$<h2>What it is</h2><p>The National Reading Framework is a NERDC publication on improving reading in schools. Read the full PDF for official guidance; the tips below are general classroom practice.</p><h2>Classroom habits that support reading</h2><ul><li>Read aloud daily, even for 10 minutes.</li><li>Teach letter sounds and blending in the early years.</li><li>Use short reading cards and rotate them among groups.</li><li>Ask pupils to retell what they read.</li><li>Create a class reading corner with donated books.</li></ul>$b$,
  'Teaching Guide', 'article', NULL,
  $j$[
   {"label":"NERDC: National Reading Framework (PDF)","url":"https://nerdc.gov.ng/content_manager/pdf_files/nrf.pdf"}
  ]$j$::jsonb,
  ARRAY['reading','literacy','primary','english'], 4,
  'National Reading Framework Nigeria: Summary for Teachers',
  'Plain summary and classroom tips from Nigeria''s National Reading Framework.', false
),
(
  'Teaching in the Mother Tongue: What the National Language Policy Means for Teachers',
  'national-language-policy-teachers',
  'A short guide to Nigeria''s language policy in education and how teachers can apply it.',
  $b$<h2>Why it matters</h2><p>Nigeria's curriculum includes Nigerian languages at the early primary level. The National Language Policy sets the framework. Read the full document for the official position.</p><h2>Practical ideas</h2><ul><li>Use the pupils' language to explain new ideas, then connect them to English terms.</li><li>Build a two-language word wall.</li><li>Use local stories and songs for early literacy.</li></ul>$b$,
  'Teaching Guide', 'article', NULL,
  $j$[
   {"label":"NERDC: National Language Policy (PDF)","url":"https://nerdc.gov.ng/content_manager/pdf_files/national_language_policy.pdf"},
   {"label":"NERDC: Primary 1-3 curriculum (Nigerian languages)","url":"https://nerdc.gov.ng/content_manager/pri1-3.html"}
  ]$j$::jsonb,
  ARRAY['language policy','mother tongue','primary'], 4,
  'National Language Policy Nigeria: Guide for Teachers',
  'What Nigeria''s language policy means for classroom teaching, with official link.', false
),
(
  'Choosing Good Textbooks and Teaching Materials: The NERDC Assessment Manual Explained',
  'nerdc-assessment-manual-textbooks',
  'How schools and teachers can judge the quality of textbooks and learning materials.',
  $b$<h2>What the manual is</h2><p>NERDC, supported by UBEC, published a manual for assessing and quality-assuring instructional and learning resources. It is useful for teachers, proprietors and book committees.</p><h2>Simple checks you can apply</h2><ul><li>Does the book follow the current curriculum?</li><li>Is the language right for the class level?</li><li>Are the examples and pictures accurate and Nigerian-relevant?</li><li>Are there exercises and answers?</li></ul>$b$,
  'School Management', 'article', NULL,
  $j$[
   {"label":"NERDC: Manual for Assessment and Quality Assurance of Instructional and Learning Resources (PDF)","url":"https://nerdc.gov.ng/content_manager/pdf_files/assessment_manual.pdf"}
  ]$j$::jsonb,
  ARRAY['textbooks','quality assurance','school management'], 4,
  'How to Choose Textbooks: NERDC Assessment Manual Guide',
  'Checks for judging textbooks and teaching materials using the NERDC manual.', false
),
(
  'Making Teaching Aids from Local Materials',
  'teaching-aids-from-local-materials',
  'Low-cost teaching aids Nigerian teachers can make from everyday items.',
  $b$<h2>Ideas by subject</h2><ul><li><strong>Maths:</strong> bottle-top counters, stick bundles for tens and units, cardboard number cards.</li><li><strong>English:</strong> flashcards from cartons, letter tiles, picture charts.</li><li><strong>Basic Science:</strong> real leaves, seeds, soil samples, simple models.</li><li><strong>Social studies:</strong> hand-drawn maps and charts.</li></ul><h2>Tips</h2><p>Keep aids durable, label them, and store them by topic. NERDC has a handbook on selecting and using instructional materials from local resources.</p>$b$,
  'Teaching Guide', 'article', NULL,
  $j$[
   {"label":"NERDC: List of publications (includes the local-resources handbook) (PDF)","url":"https://www.nerdc.gov.ng/content_manager/pdf_files/nerdc_publications.pdf"}
  ]$j$::jsonb,
  ARRAY['teaching aids','local materials','instructional materials'], 4,
  'Teaching Aids from Local Materials for Nigerian Teachers',
  'Ideas for low-cost teaching aids from local materials.', false
),

-- TRCN
(
  'The TRCN Teachers'' Code of Conduct: Key Points Every Teacher Should Know',
  'trcn-teachers-code-of-conduct-key-points',
  'A readable overview of the Teachers'' Code of Conduct and where to read the full text.',
  $b$<h2>What it is</h2><p>The Teachers' Code of Conduct was first published in 2004 by TRCN. It sets the standards of professional conduct for registered teachers: relationships with pupils, parents, colleagues and the community, and the handling of trust, authority and care.</p><h2>Why it matters</h2><ul><li>It is the reference used when a teacher is accused of misconduct.</li><li>Misconduct can lead to disciplinary action through TRCN's investigation and tribunal process.</li></ul><h2>Read the full code</h2><p>Use TRCN's official page. The chapters are also published on the TRCN site.</p>$b$,
  'TRCN Guide', 'link', 'https://trcn.gov.ng/code-of-conduct',
  $j$[
   {"label":"TRCN: Teachers' Code of Conduct","url":"https://trcn.gov.ng/code-of-conduct"},
   {"label":"TRCN: Code of Conduct, Chapter 1 (objectives)","url":"https://www.trcn.gov.ng/code_chap1/"},
   {"label":"TRCN: Code of Conduct, Chapter 2 (professionalisation)","url":"https://www.trcn.gov.ng/code_chap2/"},
   {"label":"Teachers Code of Conduct, 2017 edition (PDF, UNESCO IIEP Ethics repository)","url":"https://etico.iiep.unesco.org/sites/default/files/2025-08/Nigeria_2017_CC.pdf"}
  ]$j$::jsonb,
  ARRAY['trcn','code of conduct','ethics'], 5,
  'TRCN Teachers'' Code of Conduct: Key Points for Nigerian Teachers',
  'Overview of the TRCN Teachers'' Code of Conduct with official links.', false
),
(
  'TRCN Disciplinary Procedures: What Happens When a Teacher Is Reported',
  'trcn-disciplinary-procedures-explained',
  'A plain-language overview of TRCN''s disciplinary framework, with the official PDF.',
  $b$<h2>Overview</h2><p>TRCN publishes a national framework for investigating and addressing teacher misconduct. It is meant to protect learners, uphold professional standards and give a fair process.</p><h2>What teachers should do</h2><ul><li>Read the Code of Conduct and the disciplinary framework.</li><li>Keep records of your work and communications.</li><li>Respond to official TRCN letters promptly and in writing.</li></ul><p><em>This is not legal advice. Use the official PDF for the exact process.</em></p>$b$,
  'TRCN Guide', 'link', 'https://trcn.gov.ng/disciplinary-procedures',
  $j$[
   {"label":"TRCN: Disciplinary procedures","url":"https://trcn.gov.ng/disciplinary-procedures"},
   {"label":"TRCN: Disciplinary Procedures 2026 (PDF)","url":"https://www.trcn.gov.ng/documents/disciplinary-procedures-2026.pdf"},
   {"label":"TRCN: Teachers' Code of Conduct","url":"https://trcn.gov.ng/code-of-conduct"}
  ]$j$::jsonb,
  ARRAY['trcn','discipline','misconduct','tribunal'], 4,
  'TRCN Disciplinary Procedures Explained for Teachers',
  'Overview of TRCN''s disciplinary framework for teachers, with the official PDF.', false
),
(
  'TRCN MCPD and Licence Renewal: How It Works',
  'trcn-mcpd-licence-renewal-guide',
  'What Mandatory Continuing Professional Development (MCPD) is and how it connects to renewing your teaching licence.',
  $b$<h2>MCPD in brief</h2><p>TRCN says MCPD participation is mandatory for registered teachers and that non-compliance may affect licence renewal. TRCN accredits MCPD providers and supports credit allocation.</p><h2>Licence renewal</h2><p>Renewal is done through TRCN's online registration path. You may need to have completed the required MCPD credits before renewing.</p><h2>Practical steps</h2><ul><li>Check your licence expiry date on your TRCN account.</li><li>Choose TRCN-accredited MCPD providers only.</li><li>Keep your participation certificates.</li></ul><p><em>Credit requirements can change. Read the current TRCN pages linked below.</em></p>$b$,
  'TRCN Guide', 'link', 'https://trcn.gov.ng/status/knowledge-base/mcpd-credits',
  $j$[
   {"label":"TRCN: Understanding MCPD credits","url":"https://trcn.gov.ng/status/knowledge-base/mcpd-credits"},
   {"label":"TRCN: Licence renewal","url":"https://trcn.gov.ng/status/knowledge-base/license-renewal"},
   {"label":"TRCN: Teachers' training (MCPD)","url":"https://trcn.gov.ng/teachers-training"},
   {"label":"TRCN: Accreditation, Regulation and Teacher Development","url":"https://trcn.gov.ng/accreditation-regulation-and-teacher-development"}
  ]$j$::jsonb,
  ARRAY['trcn','mcpd','licence renewal','cpd'], 5,
  'TRCN MCPD and Licence Renewal Guide for Teachers',
  'How MCPD credits connect to TRCN licence renewal, with official links.', false
),
(
  'How to Register with TRCN: Step-by-Step Path for Nigerian Teachers',
  'how-to-register-with-trcn',
  'The registration route from qualification to PQE, certificate and licence, with official links.',
  $b$<h2>The route in short</h2><ol><li>Confirm your teaching qualification category.</li><li>Register for the Professional Qualifying Examination (PQE) through the official candidate portal.</li><li>Sit the exam.</li><li>If you pass, complete registration and licensing.</li><li>Renew your licence when due, with MCPD requirements.</li></ol><h2>Warnings</h2><ul><li>Use only trcn.gov.ng portals.</li><li>The exam fee and the registration fee are separate. Confirm amounts on the official site.</li></ul>$b$,
  'TRCN Guide', 'link', 'https://teachers.trcn.gov.ng/cbt',
  $j$[
   {"label":"TRCN: Candidate CBT registration","url":"https://teachers.trcn.gov.ng/cbt"},
   {"label":"TRCN: PQE Exam Guide","url":"https://trcn.gov.ng/status/knowledge-base/pqe-exam-guide"},
   {"label":"TRCN: How to register (older site page)","url":"https://www.trcn.gov.ng/howtoregister/"},
   {"label":"TRCN official website","url":"https://trcn.gov.ng/"}
  ]$j$::jsonb,
  ARRAY['trcn','registration','pqe','licence'], 5,
  'How to Register with TRCN in Nigeria (Step by Step)',
  'Step-by-step path from PQE to TRCN certificate and licence, with official links.', false
),
(
  'TRCN PQE Past Questions: How to Find and Use Them',
  'trcn-pqe-past-questions-how-to-use',
  'Where TRCN publishes past questions and how to practise with them.',
  $b$<h2>Where to look</h2><p>TRCN has a past-questions section by category. Pages may be updated over time, so start from the official site.</p><h2>How to practise</h2><ul><li>Time yourself under exam conditions.</li><li>Review every wrong answer and note the topic.</li><li>Study the topics you miss most.</li></ul><p>Be careful with paid PDF sellers; check against the official source.</p>$b$,
  'TRCN Guide', 'link', 'https://trcn.gov.ng/pqe-pass-questions/category-b',
  $j$[
   {"label":"TRCN: PQE past questions (Category B)","url":"https://trcn.gov.ng/pqe-pass-questions/category-b"},
   {"label":"TRCN: PQE Exam Guide","url":"https://trcn.gov.ng/status/knowledge-base/pqe-exam-guide"}
  ]$j$::jsonb,
  ARRAY['trcn','pqe','past questions','exam practice'], 4,
  'TRCN PQE Past Questions: Where to Find Them and How to Practise',
  'Where to find TRCN PQE past questions and how to practise.', false
),
(
  'TRCN 2027 Deadline: What Teachers and Schools Need to Know',
  'trcn-2027-deadline-teachers-schools',
  'A news-based summary of the push for all teachers to be registered and licensed by 2027.',
  $b$<h2>What has been reported</h2><p>In November 2026, TRCN's Registrar was reported as saying all practising teachers must be registered and licensed by 2027. Separate reports say schools were given a December 2026 deadline to have at least 75 per cent of their teachers certified and licensed. TRCN has also described an accelerated pathway (ATPP) for teachers without education degrees.</p><h2>What to do</h2><ul><li>Check whether you are registered and your licence is active.</li><li>Start the PQE process if you are not.</li><li>Schools: audit staff registration status.</li></ul><p><em>Based on news reports. Confirm current rules on trcn.gov.ng.</em></p>$b$,
  'TRCN Guide', 'article', NULL,
  $j$[
   {"label":"ThisDay: All Nigerian Teachers Must Be Registered, Licensed by 2027","url":"https://www.thisdaylive.com/2026/11/17/all-nigerian-teachers-must-be-registered-licensed-by-2027-says-trcn-registrar/"},
   {"label":"Vanguard: TRCN sets December deadline for teachers' certification","url":"https://www.vanguardngr.com/2026/11/waec-neco-exams-trcn-sets-december-deadline-for-teachers-certification/"},
   {"label":"The Sun: TRCN to license 250,000 unqualified teachers through ATPP","url":"https://thesun.ng/trcn-to-license-250000-unqualified-teachers-through-atpp/"},
   {"label":"TRCN official website","url":"https://trcn.gov.ng/"}
  ]$j$::jsonb,
  ARRAY['trcn','2027','licensing','deadline'], 4,
  'TRCN 2027 Registration and Licence Deadline for Teachers',
  'News summary of the TRCN push for all teachers to be registered and licensed by 2027.', false
),
(
  'TRCN Teachers'' Handbook: Registration, Licence, Discipline and More',
  'trcn-teachers-handbook-overview',
  'What is in the TRCN Teachers'' Handbook and where to access it.',
  $b$<h2>Contents</h2><p>The handbook covers the establishment and mandates of TRCN, registration of teachers, registration documents, categories and fees, licence expiry and renewal, the Code of Conduct, the Teachers Investigation Panel and Disciplinary Committee, job security and salary.</p><h2>Note</h2><p>It is an older document; fees and procedures may have changed. Use the current TRCN site to confirm.</p>$b$,
  'TRCN Guide', 'link', 'https://nigeriareposit.nln.gov.ng/items/79f6507f-9d74-4be3-92e2-bdde86d47b47/full',
  $j$[
   {"label":"National Library of Nigeria repository: TRCN Teachers' Handbook","url":"https://nigeriareposit.nln.gov.ng/items/79f6507f-9d74-4be3-92e2-bdde86d47b47/full"},
   {"label":"TRCN official website","url":"https://trcn.gov.ng/"}
  ]$j$::jsonb,
  ARRAY['trcn','handbook','registration'], 3,
  'TRCN Teachers'' Handbook Overview',
  'What the TRCN Teachers'' Handbook covers and where to access it.', false
),

-- Sample lesson notes (original)
(
  'Sample Lesson Note: Primary 4 English Studies - Informal Letter',
  'sample-lesson-note-primary-4-informal-letter',
  'A complete original lesson note on parts of an informal letter, using the standard Nigerian format.',
  $b$<p><strong>Subject:</strong> English Studies &nbsp; <strong>Class:</strong> Primary 4 &nbsp; <strong>Duration:</strong> 40 minutes</p><p><strong>Topic:</strong> Writing: informal letter</p><p><strong>Objectives:</strong> By the end of the lesson, pupils should be able to (1) name the parts of an informal letter, (2) write a short informal letter to a friend.</p><p><strong>Previous knowledge:</strong> Pupils can write simple sentences.</p><p><strong>Materials:</strong> Chart showing a sample letter with labelled parts.</p><h3>Presentation</h3><p><strong>Step 1 (5 min) Introduction:</strong> Ask who has ever received a letter or message from a friend. Introduce the topic.</p><p><strong>Step 2 (10 min):</strong> Show the chart. Teacher names the parts: sender's address, date, greeting (salutation), body, closing, signature. Pupils repeat.</p><p><strong>Step 3 (10 min):</strong> Teacher writes a short letter on the board with pupils suggesting sentences for the body.</p><p><strong>Step 4 (10 min):</strong> Pupils write their own short letter to a friend about their favourite subject.</p><p><strong>Evaluation:</strong> Name three parts of a letter. Where do we write the date? What do we write before the signature?</p><p><strong>Summary:</strong> Review the six parts.</p><p><strong>Assignment:</strong> Write a letter to a cousin about your school.</p>$b$,
  'Lesson Notes', 'article', NULL,
  $j$[
   {"label":"NERDC: Primary 4-6 curriculum","url":"https://nerdc.gov.ng/content_manager/pri4-6.html"}
  ]$j$::jsonb,
  ARRAY['lesson note','english','primary 4','letter writing','sample'], 4,
  'Sample Lesson Note: Primary 4 English - Informal Letter',
  'Ready-to-adapt Primary 4 English lesson note on informal letters.', false
),
(
  'Sample Lesson Note: Primary 2 Mathematics - Addition of Two-Digit Numbers',
  'sample-lesson-note-primary-2-addition',
  'A complete original lesson note on adding two-digit numbers without regrouping.',
  $b$<p><strong>Subject:</strong> Mathematics &nbsp; <strong>Class:</strong> Primary 2 &nbsp; <strong>Duration:</strong> 35 minutes</p><p><strong>Topic:</strong> Addition of two-digit numbers (no regrouping)</p><p><strong>Objectives:</strong> Pupils should be able to (1) add tens and units separately, (2) solve five addition sums correctly.</p><p><strong>Previous knowledge:</strong> Pupils can add single-digit numbers and know tens and units.</p><p><strong>Materials:</strong> Bundles of sticks (tens) and single sticks (units), number cards.</p><h3>Presentation</h3><p><strong>Step 1:</strong> Revise single-digit addition with quick oral questions.</p><p><strong>Step 2:</strong> Demonstrate 23 + 14 with sticks: 2 bundles + 1 bundle = 3 bundles; 3 sticks + 4 sticks = 7 sticks; answer 37.</p><p><strong>Step 3:</strong> Write the vertical layout on the board and add units first, then tens.</p><p><strong>Step 4:</strong> Pupils solve 12 + 11, 24 + 13, 31 + 25 in pairs with sticks.</p><p><strong>Evaluation:</strong> 41 + 12, 23 + 36, 52 + 17.</p><p><strong>Assignment:</strong> Five addition sums on the board.</p>$b$,
  'Lesson Notes', 'article', NULL,
  $j$[
   {"label":"NERDC: Primary 1-3 curriculum","url":"https://nerdc.gov.ng/content_manager/pri1-3.html"}
  ]$j$::jsonb,
  ARRAY['lesson note','mathematics','primary 2','addition','sample'], 4,
  'Sample Lesson Note: Primary 2 Maths - Two-Digit Addition',
  'Ready-to-adapt Primary 2 mathematics lesson note on addition.', false
),

-- Scheme of work sample
(
  'Sample Scheme of Work Layout: Primary 4 Mathematics (First Term)',
  'sample-scheme-of-work-primary-4-maths-first-term',
  'A filled-in layout showing how to spread topics over a 13-week term. Replace topics with those in your official curriculum.',
  $b$<p><em>This is a layout example. Confirm topics and sequence against the NERDC curriculum or your state/school scheme before using.</em></p><table><tr><th>Week</th><th>Topic (example)</th><th>Focus</th></tr><tr><td>1</td><td>Revision of Primary 3 work</td><td>Baseline check</td></tr><tr><td>2-3</td><td>Whole numbers and place value</td><td>Reading, writing, comparing</td></tr><tr><td>4-5</td><td>Addition and subtraction</td><td>Word problems</td></tr><tr><td>6</td><td>Revision and mid-term test</td><td>Assessment</td></tr><tr><td>7-8</td><td>Multiplication</td><td>Tables and problems</td></tr><tr><td>9-10</td><td>Division</td><td>Sharing and grouping</td></tr><tr><td>11</td><td>Fractions (introduction)</td><td>Halves and quarters</td></tr><tr><td>12</td><td>General revision</td><td>Practice</td></tr><tr><td>13</td><td>Examination</td><td>Assessment</td></tr></table>$b$,
  'Schemes of Work', 'article', NULL,
  $j$[
   {"label":"NERDC: Primary 4-6 curriculum","url":"https://nerdc.gov.ng/content_manager/pri4-6.html"}
  ]$j$::jsonb,
  ARRAY['scheme of work','mathematics','primary 4','sample'], 3,
  'Primary 4 Maths Scheme of Work Layout (First Term)',
  'Sample layout of a Primary 4 mathematics first-term scheme of work for Nigerian schools.', false
),

-- Games
(
  'Mathematics Games for Nigerian Classrooms',
  'mathematics-games-nigerian-classrooms',
  'Eight quick games that make number practice active.',
  $b$<ol><li><strong>Number line jump:</strong> chalk a line on the ground; pupils jump to answers.</li><li><strong>Beat the teacher:</strong> pupils race you to solve a sum.</li><li><strong>Stick bundles:</strong> build numbers with tens and units.</li><li><strong>Times-table clap:</strong> clap and count in multiples.</li><li><strong>Shop role-play:</strong> use bottle tops as money for buying and change.</li><li><strong>Domino sums:</strong> match cards that add to a target.</li><li><strong>Fraction fold:</strong> fold paper into halves and quarters.</li><li><strong>Mental maths ladder:</strong> teams climb a ladder drawn on the board.</li></ol>$b$,
  'Class Games', 'article', NULL,
  '[]'::jsonb,
  ARRAY['games','mathematics','primary','revision'], 4,
  'Mathematics Games for Nigerian Primary Classrooms',
  'Eight low-cost maths games for Nigerian classrooms.', false
),
(
  'English and Phonics Games for Early Primary',
  'english-phonics-games-early-primary',
  'Simple language games for Primary 1-3.',
  $b$<ol><li><strong>Sound hunt:</strong> find objects that start with a given sound.</li><li><strong>Letter jump:</strong> teacher calls a letter; pupils point to it on the wall chart.</li><li><strong>Rhyme match:</strong> pair rhyming words.</li><li><strong>Blend relay:</strong> teams build words from letter cards.</li><li><strong>Picture story:</strong> pupils tell a story from three pictures.</li><li><strong>Sentence scramble:</strong> arrange word cards into a sentence.</li></ol>$b$,
  'Class Games', 'article', NULL,
  $j$[
   {"label":"NERDC: National Reading Framework (PDF)","url":"https://nerdc.gov.ng/content_manager/pdf_files/nrf.pdf"}
  ]$j$::jsonb,
  ARRAY['games','phonics','english','early primary'], 3,
  'English and Phonics Games for Early Primary Classrooms',
  'Simple phonics and language games for Primary 1-3 teachers.', false
)
ON CONFLICT (slug) DO NOTHING;
