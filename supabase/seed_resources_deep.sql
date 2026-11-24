-- ============================================================
-- ClassHire: in-depth resources (DRAFTS, is_published = false)
-- Requires resource_sources.sql (adds the sources column).
-- Replaces the earlier thin seed files. Every source URL was seen
-- on an official site or in search results. Review, then publish
-- from /admin/resources.
-- ============================================================

INSERT INTO resource_posts
  (title, slug, excerpt, body, category, resource_type, external_url, sources, tags, read_time_minutes, seo_title, seo_description, is_published)
VALUES
(
  'TRCN Registration, PQE and Licensing: The Complete Guide for Nigerian Teachers (2026)', 'trcn-registration-pqe-licensing-guide',
  'Eligibility, documents, official fees by category, PQE format and weights, licensing, MCPD renewal, the 2027 deadline and how to avoid scams, checked against TRCN''s own pages.',
  $b$<p><em>Details in this guide were checked against TRCN's own website on 23 November 2026. TRCN updates its pages and fees from time to time, so confirm anything you are about to pay for at <a href="https://trcn.gov.ng/registration" target="_blank" rel="noopener noreferrer">trcn.gov.ng/registration</a>.</em></p>

<h2>The short version</h2>
<p>Teaching in a Nigerian school requires registration with the Teachers Registration Council of Nigeria (TRCN). TRCN describes registration as a legal requirement for all teachers working in Nigerian schools. The route for most people is: <strong>check you qualify, register online, sit and pass the Professional Qualifying Examination (PQE), then complete certification and licensing, and renew your licence through Mandatory Continuing Professional Development (MCPD).</strong></p>

<h2>Step 1: Check that you are eligible</h2>
<p>For the PQE, TRCN lists a minimum of an NCE, PGDE or PDE in Education. Your registration category depends on your highest relevant qualification:</p>
<table>
<tr><th>Category</th><th>Qualification</th></tr>
<tr><td>A</td><td>Ph.D.</td></tr>
<tr><td>B</td><td>Master's degree</td></tr>
<tr><td>C</td><td>Bachelor's degree / PGDE</td></tr>
<tr><td>D</td><td>NCE</td></tr>
</table>
<p>If you trained outside Nigeria, TRCN has a separate route for foreign-trained teachers. It mentions certificate regularisation, translation of non-English certificates and extra verification steps. If you are a Nigerian teaching abroad, TRCN advertises remote registration options and digital document submission. If you were registered before and lapsed, use the "Return to the Register" route.</p>

<h2>Step 2: Prepare your documents</h2>
<p>On its page for teachers qualified in Nigeria, TRCN lists the information it asks you to provide when you apply by email after finishing a qualification without registering at the time:</p>
<ul>
<li>Full name, date of birth, current postal address, telephone number and email address.</li>
<li>Proof of your National Identification Number (NIN), if you have one.</li>
<li>A Police Clearance Certificate if you have spent six months or more in a single period outside Nigeria in the last five years.</li>
<li>Evidence of completing any Return to Teaching Programme, if you did one.</li>
<li>A copy of the photograph page of your international passport and/or your Nigerian driver's licence.</li>
<li>A copy of your birth certificate or another valid form of identification.</li>
<li>A copy of a utility bill showing your current address.</li>
</ul>
<p>On that page, TRCN asks for these to be attached to one email sent to <strong>registration@trcn.gov.ng</strong>. The online registration tool also offers a document checklist and accepts PDF, JPG and PNG files, so scan your documents clearly before you start.</p>

<h2>Step 3: Know the fees</h2>
<p>TRCN publishes this fee structure for teachers qualified in Nigeria:</p>
<table>
<tr><th>Category</th><th>Registration fee</th><th>Licence fee</th><th>Total</th></tr>
<tr><td>A (Ph.D.)</td><td>₦10,000</td><td>₦7,000</td><td>₦17,000</td></tr>
<tr><td>B (Master's)</td><td>₦8,000</td><td>₦6,000</td><td>₦14,000</td></tr>
<tr><td>C (Bachelor's/PGDE)</td><td>₦6,000</td><td>₦4,000</td><td>₦10,000</td></tr>
<tr><td>D (NCE)</td><td>₦3,000</td><td>₦3,000</td><td>₦6,000</td></tr>
</table>
<p>Three things to note from TRCN's page. The fee covers the registration period set by TRCN and is not prorated, so it does not matter when in that period you join or leave the register. The PQE fee is separate and not included in the table. And late processing or verification fees may apply in some cases. Use the fee calculator on TRCN's registration page for the exact figure that applies to you.</p>

<h2>Step 4: Register for and sit the PQE</h2>
<p>The PQE is mandatory for teacher registration. According to TRCN's PQE curriculum page, it is computer-based with <strong>60 questions in 60 minutes</strong>, held in batches in the <strong>May and November</strong> diets. You receive your exam date and venue by SMS and email at least two weeks before the exam.</p>
<p>TRCN's PQE guide describes the process:</p>
<ol>
<li>Log in to the Teacher Portal and open the PQE section.</li>
<li>Check that you are eligible for the current exam window.</li>
<li>Pay the examination fee.</li>
<li>Download your exam slip, which shows your exam number and centre.</li>
</ol>
<p><strong>On exam day:</strong> arrive at your centre at least 30 minutes early, bring your exam slip and a valid ID, and leave electronic devices out of the hall. Results are published on the portal, with a notification by email and SMS.</p>

<h3>What the PQE tests</h3>
<p>The streamlined PQE has five areas, each weighted at 20 per cent:</p>
<table>
<tr><th>Area</th><th>Weight</th></tr>
<tr><td>Pedagogy</td><td>20%</td></tr>
<tr><td>Literacy</td><td>20%</td></tr>
<tr><td>Numeracy</td><td>20%</td></tr>
<tr><td>ICT</td><td>20%</td></tr>
<tr><td>Safeguarding</td><td>20%</td></tr>
</table>
<p>For Literacy, TRCN gives a further breakdown: reading comprehension 30%, grammar and structure 25%, vocabulary 20%, professional communication skills 15% and writing skills 10%. TRCN officials have said the reformed PQE reduced 23 subject papers to five areas. See our PQE preparation guide for a study plan.</p>

<h2>Step 5: Certification, licence and induction</h2>
<p>After the PQE, TRCN's Certification and Licensing Department handles the issue of certificates and licences. Its structure also includes an induction division that handles oath taking and membership benefits. News reports in November 2026 quote TRCN's Registrar as saying a teacher gets professional certification once in their career, while the practising licence is renewed every three years with evidence of MCPD participation. Treat that as a reported summary and check the licence-renewal page for the current rule.</p>

<h2>Step 6: Renew your licence through MCPD</h2>
<p>TRCN says MCPD is a programme to help teachers maintain and improve professional competence, and that credits are required for licence renewal. Its MCPD page describes how to earn credits: log in to the MCPD Portal, browse programmes, register for ones matching your needs, complete the requirements, and credits are added to your profile. Counted activities include workshops and seminars, online courses, conferences, research publications and community service in education. TRCN accredits MCPD providers, so use accredited ones only. The exact number of credits required is not stated on the knowledge-base page, so check the portal or the MCPD manual.</p>

<h2>Deadlines and pressure in 2026-2027</h2>
<ul>
<li>TRCN's Registrar was reported in November 2026 as saying all practising teachers must be registered and licensed by 2027.</li>
<li>Vanguard reported a December 2026 deadline for schools to have at least 75 per cent of their teachers certified and licensed, and noted that many teachers pass the PQE but do not finish licensing.</li>
<li>TRCN announced an accelerated pathway (ATPP) for teachers without education degrees: complete the ATPP programme, sit the PQE, then be registered and licensed.</li>
<li>TRCN reported finding about 250 fake teaching certificates and is introducing QR-coded certificates.</li>
</ul>
<p><strong>What this means for you:</strong> if you are a practising teacher, do not wait for 2027. For schools hiring teachers, ask for the TRCN certificate and licence and verify it through TRCN's "Search the Register" page.</p>

<h2>Avoiding scams</h2>
<p>TRCN has warned about fake portals and about social media, WhatsApp, email and website offers claiming to give access to registration, PQE or certification. Only use trcn.gov.ng and its sub-sites. Do not pay agents. Keep every receipt and reference number.</p>

<h2>Common questions</h2>
<h3>Do I need to register if I teach in a private school?</h3>
<p>TRCN states registration is a legal requirement for all teachers working in Nigerian schools.</p>
<h3>I passed the PQE. Am I done?</h3>
<p>Not yet. Passing the exam leads to registration, certification and licensing, and TRCN says many teachers who pass do not complete that process.</p>
<h3>How long does registration take?</h3>
<p>TRCN's registration page indicates a one to two week process, but this depends on documents and exam timing.</p>
<h3>Where do I get help?</h3>
<p>Use trcn.gov.ng/support, email info@trcn.gov.ng, or call +234 (0)905 446 8360. TRCN's head office is at 12 Oda Crescent, Off Aminu Kano Crescent, Wuse II, Abuja.</p>

<h2>Official links</h2>
<p>All the pages this guide relies on are listed under "Sources & official documents" below.</p>$b$,
  'TRCN Guide', 'article', 'https://trcn.gov.ng/registration',
  $j$[{"label": "TRCN: Teacher registration", "url": "https://trcn.gov.ng/registration"}, {"label": "TRCN: Registration for teachers qualified in Nigeria (documents and fees)", "url": "https://trcn.gov.ng/qualified-in-nigeria"}, {"label": "TRCN: Registration for foreign-trained teachers", "url": "https://trcn.gov.ng/qualified-outside-nigeria"}, {"label": "TRCN: Return to the Register", "url": "https://trcn.gov.ng/return-to-register"}, {"label": "TRCN: PQE curriculum guide", "url": "https://trcn.gov.ng/pqe-curriculum"}, {"label": "TRCN: PQE exam guide", "url": "https://trcn.gov.ng/status/knowledge-base/pqe-exam-guide"}, {"label": "TRCN: Understanding MCPD credits", "url": "https://trcn.gov.ng/status/knowledge-base/mcpd-credits"}, {"label": "TRCN: Licence renewal", "url": "https://trcn.gov.ng/status/knowledge-base/license-renewal"}, {"label": "TRCN: Certification and Licensing Department", "url": "https://trcn.gov.ng/certification-and-licensing"}, {"label": "TRCN: Search the Register", "url": "https://trcn.gov.ng/search-register"}, {"label": "TRCN: Teachers' Code of Conduct", "url": "https://trcn.gov.ng/code-of-conduct"}, {"label": "TRCN: Support", "url": "https://trcn.gov.ng/support"}, {"label": "ThisDay: All Nigerian teachers must be registered, licensed by 2027", "url": "https://www.thisdaylive.com/2026/11/17/all-nigerian-teachers-must-be-registered-licensed-by-2027-says-trcn-registrar/"}, {"label": "Vanguard: TRCN sets December deadline for teachers' certification", "url": "https://www.vanguardngr.com/2026/11/waec-neco-exams-trcn-sets-december-deadline-for-teachers-certification/"}, {"label": "Vanguard: TRCN warns teachers against fake portals", "url": "https://www.vanguardngr.com/2026/09/trcn-warns-teachers-against-fake-portals-invalid-certificates/"}, {"label": "The Sun: TRCN to license 250,000 unqualified teachers through ATPP", "url": "https://thesun.ng/trcn-to-license-250000-unqualified-teachers-through-atpp/"}, {"label": "Nairametrics: TRCN uncovers 250 fake teaching certificates", "url": "https://nairametrics.com/2026/11/13/trcn-uncovers-250-fake-teaching-certificates-rolls-out-qr-coded-certificates/"}]$j$::jsonb,
  ARRAY['trcn','pqe','registration','licence','mcpd','fees'], 9,
  'TRCN Registration, PQE and Licensing Guide for Nigerian Teachers (2026)',
  'Step-by-step TRCN guide: eligibility, documents, official fees by category, PQE format, licensing, MCPD renewal and the 2027 deadline.', false
),
(
  'TRCN PQE Preparation Guide: Format, Five-Area Syllabus, Six-Week Study Plan and Practice Questions', 'trcn-pqe-preparation-guide-study-plan',
  'How the 60-question computer-based PQE is structured, what each of the five areas covers, official practice sets, a six-week study plan and ten original practice questions with answers.',
  $b$<p><em>Format and weights below come from TRCN's PQE curriculum page (checked 23 November 2026). The revision topics for each area are our own suggestions based on the five area names, not an official TRCN syllabus. Always use TRCN's official practice questions as your main check.</em></p>

<h2>What you are preparing for</h2>
<ul>
<li><strong>Format:</strong> computer-based, 60 questions, 60 minutes. That is about one minute a question.</li>
<li><strong>Diets:</strong> May and November.</li>
<li><strong>Five areas, 20% each:</strong> Pedagogy, Literacy, Numeracy, ICT and Safeguarding.</li>
<li><strong>Literacy breakdown (official):</strong> reading comprehension 30%, grammar and structure 25%, vocabulary 20%, professional communication 15%, writing skills 10%.</li>
</ul>
<p>Because every area carries the same weight, a teacher who is strong in their subject but weak in ICT or safeguarding can still fail. Aim for balance, not perfection in one area.</p>

<h2>Free official practice questions</h2>
<p>TRCN publishes online practice sets for each of the five areas: Numeracy, ICT, Safeguarding, Literacy and Pedagogy. They are on TRCN's PQE Practice Questions page (linked under Sources below). Do each set at least twice: once cold to find your gaps, and once after revision.</p>

<h2>A six-week study plan</h2>
<table>
<tr><th>Week</th><th>Focus</th><th>What to do</th></tr>
<tr><td>1</td><td>Baseline</td><td>Do all five official practice sets untimed. Record your score for each area. Read TRCN's PQE curriculum page.</td></tr>
<tr><td>2</td><td>Numeracy</td><td>Revise fractions, decimals, percentages, ratio, averages, simple interest, measurement, and reading tables and charts. Do 15 questions a day.</td></tr>
<tr><td>3</td><td>Literacy</td><td>Passage reading with timed comprehension questions, grammar (tenses, agreement, punctuation), vocabulary in context, and writing short professional emails and notes.</td></tr>
<tr><td>4</td><td>Pedagogy</td><td>Lesson planning, objectives, teaching methods, classroom management, assessment (formative and summative), feedback and inclusive teaching.</td></tr>
<tr><td>5</td><td>ICT and Safeguarding</td><td>ICT: file management, word processing, spreadsheets, email, internet safety, data protection. Safeguarding: recognising signs of abuse, reporting procedures, professional boundaries, safe online communication, and the TRCN Code of Conduct.</td></tr>
<tr><td>6</td><td>Mock exams</td><td>Take two full 60-question, 60-minute mock sessions under timed conditions. Revise only your weakest two areas.</td></tr>
</table>
<p>If you have less time, compress to four weeks: baseline, two weeks on your two weakest areas, then mocks.</p>

<h2>Area-by-area revision checklist</h2>

<h3>Pedagogy</h3>
<ul>
<li>Writing clear, measurable objectives (use verbs like identify, solve, compare, not "understand").</li>
<li>Matching methods to objectives: demonstration for skills, discussion for concepts, projects for application.</li>
<li>Formative vs summative assessment, and how to give useful feedback.</li>
<li>Managing large and mixed-ability classes, and including pupils with special needs.</li>
<li>Lesson structure: introduction, development, evaluation, conclusion.</li>
</ul>

<h3>Literacy</h3>
<ul>
<li>Find the main idea, infer meaning and identify the writer's purpose in a passage.</li>
<li>Subject-verb agreement, tenses, pronouns, prepositions, punctuation.</li>
<li>Words in context, synonyms, antonyms and common idioms.</li>
<li>Formal language for letters, reports and messages to parents.</li>
</ul>

<h3>Numeracy</h3>
<ul>
<li>Four operations with fractions and decimals.</li>
<li>Percentages: discount, increase, percentage of a quantity.</li>
<li>Mean, median, mode and reading charts.</li>
<li>Ratio and proportion, and word problems from school life (class sizes, marks, budgets).</li>
</ul>

<h3>ICT</h3>
<ul>
<li>Basic use of word processors, spreadsheets and presentation software.</li>
<li>Email etiquette, attachments and online safety.</li>
<li>Strong passwords, avoiding scams and protecting pupils' data.</li>
<li>Using digital tools for teaching and record keeping.</li>
</ul>

<h3>Safeguarding</h3>
<ul>
<li>Types of abuse and neglect, and signs a child may show.</li>
<li>What to do when a child discloses harm: listen, do not promise secrecy, record, and report through the school procedure.</li>
<li>Professional boundaries with pupils, including online and social media.</li>
<li>The TRCN Code of Conduct and what counts as misconduct.</li>
</ul>

<h2>Ten practice questions with answers</h2>
<p>These are original practice questions written for this guide, not past TRCN questions.</p>
<ol>
<li><strong>(Numeracy)</strong> A class has 45 pupils and 60% are girls. How many boys are there?<br/><em>Answer: 18. Boys are 40% of 45 = 0.4 x 45 = 18.</em></li>
<li><strong>(Numeracy)</strong> Five test scores are 12, 15, 18, 10 and 20. What is the mean?<br/><em>Answer: 15. The total is 75, and 75 divided by 5 is 15.</em></li>
<li><strong>(Literacy)</strong> Choose the correct sentence: (a) Neither of the pupils have finished. (b) Neither of the pupils has finished.<br/><em>Answer: (b). "Neither" takes a singular verb.</em></li>
<li><strong>(Literacy)</strong> The teacher praised her diligent pupils. "Diligent" means:<br/><em>Answer: hardworking and careful.</em></li>
<li><strong>(Pedagogy)</strong> Which is an example of formative assessment? (a) End-of-year exam (b) Asking short questions during the lesson to check understanding.<br/><em>Answer: (b). Formative assessment happens during learning and guides teaching.</em></li>
<li><strong>(Pedagogy)</strong> Which learning objective is best written? (a) Pupils will understand fractions. (b) Pupils will be able to add two fractions with the same denominator.<br/><em>Answer: (b). It is specific and measurable.</em></li>
<li><strong>(ICT)</strong> Which tool is best for automatically totalling pupils' scores? (a) Word processor (b) Spreadsheet.<br/><em>Answer: (b). A spreadsheet can use formulas.</em></li>
<li><strong>(ICT)</strong> Which password is strongest? (a) 12345678 (b) a long mix of letters, numbers and symbols not used elsewhere.<br/><em>Answer: (b).</em></li>
<li><strong>(Safeguarding)</strong> A pupil tells you privately that an adult is hurting them and asks you to keep it secret. What should you do?<br/><em>Answer: Listen calmly, do not promise secrecy, tell the child you must get help, and report to the designated person using the school's safeguarding procedure.</em></li>
<li><strong>(Safeguarding)</strong> Which is the most appropriate way to contact a pupil's parent? (a) Private messages to the pupil's phone (b) The school's official channel, such as a call or message to the parent.<br/><em>Answer: (b). Keep communication professional and through official channels.</em></li>
</ol>

<h2>Exam-day technique</h2>
<ul>
<li>Spend about 50 seconds a question on a first pass. Skip any question that takes more than a minute and come back.</li>
<li>Answer every question. Do not leave blanks.</li>
<li>Read the whole passage or question before you choose. Many wrong answers are partly right.</li>
<li>Arrive 30 minutes early with your exam slip and valid ID. No electronic devices are allowed in the hall.</li>
<li>Use the elimination method: cross out options you know are wrong.</li>
</ul>

<h2>After the exam</h2>
<p>Results are posted on the TRCN portal with an email and SMS notification. A pass is only part of the process: you still need to complete registration, certification and licensing. Our TRCN guide explains the next steps.</p>$b$,
  'TRCN Guide', 'article', 'https://trcn.gov.ng/pqe-practice-questions',
  $j$[{"label": "TRCN: PQE curriculum guide", "url": "https://trcn.gov.ng/pqe-curriculum"}, {"label": "TRCN: PQE practice questions (all five areas)", "url": "https://trcn.gov.ng/pqe-practice-questions"}, {"label": "TRCN: PQE exam guide", "url": "https://trcn.gov.ng/status/knowledge-base/pqe-exam-guide"}, {"label": "TRCN: Teacher registration", "url": "https://trcn.gov.ng/registration"}]$j$::jsonb,
  ARRAY['trcn','pqe','exam preparation','study plan','practice questions'], 8,
  'TRCN PQE Preparation Guide: Study Plan and Practice Questions',
  'Prepare for the TRCN PQE: exam format, five-area weights, a six-week study plan, official practice sets and original practice questions with answers.', false
),
(
  'How to Write a Lesson Note in Nigeria: Parts, Objectives, a Complete Example and Checklist', 'how-to-write-lesson-note-nigeria-complete-guide',
  'Every part of a Nigerian lesson note explained, how to write measurable objectives, a full worked Primary 5 Mathematics note, ten common mistakes and a pre-submission checklist.',
  $b$<p>A lesson note is the written plan a Nigerian teacher prepares before a lesson, and school heads, inspectors and TRCN-trained supervisors all expect to see one. This guide explains each part, shows how to write measurable objectives, gives a complete worked example you can copy, and ends with a checklist your head teacher is likely to use.</p>

<h2>Lesson note or lesson plan?</h2>
<p>People use the two terms loosely. In most Nigerian schools the lesson <strong>plan</strong> is the short outline, while the lesson <strong>note</strong> adds the full content the teacher will teach and the exact steps. If your school asks for "lesson notes", write the content as well as the outline, so another teacher could take over and deliver the lesson from your notes alone.</p>

<h2>The standard parts of a lesson note</h2>
<table>
<tr><th>Part</th><th>What to write</th></tr>
<tr><td>Heading details</td><td>School, subject, class, term, week, date, time, duration, number of pupils, average age.</td></tr>
<tr><td>Topic and sub-topic</td><td>The topic from your scheme of work. Add the sub-topic taught in this lesson.</td></tr>
<tr><td>Behavioural objectives</td><td>What pupils will be able to do by the end. Two to four, each measurable.</td></tr>
<tr><td>Previous knowledge</td><td>What pupils already know that the lesson builds on. This lets you plan the introduction.</td></tr>
<tr><td>Instructional materials</td><td>Charts, real objects, flashcards, textbook pages, board work. Name the textbook and page.</td></tr>
<tr><td>Reference materials</td><td>The curriculum, teacher's guide and textbooks you used to prepare.</td></tr>
<tr><td>Introduction</td><td>A hook that links to previous knowledge, in 3 to 5 minutes.</td></tr>
<tr><td>Presentation (development)</td><td>Numbered steps. Each has the teacher's activity, the pupils' activity and a time guide.</td></tr>
<tr><td>Board summary</td><td>The notes pupils copy. Keep it short and correct.</td></tr>
<tr><td>Evaluation</td><td>3 to 5 questions or tasks that test each objective.</td></tr>
<tr><td>Conclusion</td><td>A one-minute recap in the teacher's words.</td></tr>
<tr><td>Assignment</td><td>Homework linked to the objectives.</td></tr>
</table>

<h2>Writing objectives that can be checked</h2>
<p>A good objective starts with "By the end of the lesson, pupils should be able to..." followed by a verb you can observe. Compare:</p>
<ul>
<li><strong>Weak:</strong> understand fractions; know the parts of a plant; appreciate poetry.</li>
<li><strong>Strong:</strong> shade 3/4 of a shape; label four parts of a plant; identify two images in a short poem.</li>
</ul>
<p>Useful verbs by level of thinking:</p>
<ul>
<li><strong>Remember:</strong> list, name, state, define, label.</li>
<li><strong>Understand:</strong> explain, describe, classify, give examples.</li>
<li><strong>Apply:</strong> solve, calculate, use, demonstrate, construct.</li>
<li><strong>Analyse and evaluate:</strong> compare, distinguish, justify, judge.</li>
<li><strong>Create:</strong> design, compose, write, plan.</li>
</ul>
<p>For each objective, check that your evaluation has at least one question that tests it. If an objective has no matching question, either drop the objective or add a question.</p>

<h2>Presentation: planning the steps well</h2>
<ol>
<li><strong>Start from what pupils know.</strong> Use a question, object or short story.</li>
<li><strong>Teach one idea at a time.</strong> Three new ideas in one lesson is usually too many for Primary pupils.</li>
<li><strong>Show before you tell.</strong> Use a real object, a drawing or a worked example.</li>
<li><strong>Let pupils do something in every step</strong> (answer, draw, discuss, write), not only listen.</li>
<li><strong>Check understanding as you go</strong> with quick questions or slates held up.</li>
<li><strong>Time every step.</strong> If your steps add up to more than the lesson period, cut content.</li>
</ol>

<h2>A complete worked example</h2>
<p><strong>Subject:</strong> Mathematics &nbsp; <strong>Class:</strong> Primary 5 &nbsp; <strong>Term/Week:</strong> First Term, Week 6 &nbsp; <strong>Duration:</strong> 40 minutes &nbsp; <strong>Pupils:</strong> 42</p>
<p><strong>Topic:</strong> Fractions &nbsp; <strong>Sub-topic:</strong> Equivalent fractions</p>
<p><strong>Objectives:</strong> By the end of the lesson, pupils should be able to:</p>
<ol>
<li>shade equal parts of a shape to show that 1/2 = 2/4;</li>
<li>find an equivalent fraction by multiplying the numerator and denominator by the same number;</li>
<li>solve four equivalent fraction questions correctly.</li>
</ol>
<p><strong>Previous knowledge:</strong> Pupils can name halves, thirds and quarters and can write a fraction with a numerator and denominator.</p>
<p><strong>Materials:</strong> Paper strips (one per pair), a chart of fraction strips, coloured chalk.</p>
<p><strong>Reference:</strong> NERDC Primary 4-6 Mathematics curriculum; approved Primary 5 Mathematics textbook (add title and page).</p>

<table>
<tr><th>Step / time</th><th>Teacher's activity</th><th>Pupils' activity</th></tr>
<tr><td>Introduction (5 min)</td><td>Gives each pair a paper strip. Asks: "Fold the strip into two equal parts and shade one. What fraction is shaded?"</td><td>Fold, shade and answer 1/2.</td></tr>
<tr><td>Step 1 (8 min)</td><td>Asks pupils to fold the same strip again so it has four equal parts. Asks how many parts are now shaded.</td><td>Count two shaded parts out of four and say 2/4.</td></tr>
<tr><td>Step 2 (8 min)</td><td>Draws both strips on the board, one above the other. Writes 1/2 = 2/4. Explains that the shaded amount is the same, so the fractions are equivalent.</td><td>Compare the strips and repeat the statement.</td></tr>
<tr><td>Step 3 (9 min)</td><td>Shows the rule: multiply the top and bottom by the same number. 1/2 = (1 x 2)/(2 x 2) = 2/4; 2/3 = (2 x 2)/(3 x 2) = 4/6. Does a third example with the class.</td><td>Copy the rule and solve 1/3 = ?/6 with the teacher.</td></tr>
<tr><td>Step 4 (6 min)</td><td>Sets pair work: find an equivalent fraction for 1/4, 3/5 and 2/3. Moves around the class and checks.</td><td>Work in pairs, then show one answer on a slate.</td></tr>
</table>
<p><strong>Board summary:</strong> Equivalent fractions have the same value. To find one, multiply the numerator and denominator by the same number. Example: 1/2 = 2/4 = 3/6.</p>
<p><strong>Evaluation:</strong> (1) Find the missing number: 1/3 = ?/6. (2) Write one fraction equal to 3/4. (3) Is 2/5 equal to 4/10? Give a reason. (4) Shade 2/4 of a rectangle and say which simpler fraction it equals.</p>
<p><strong>Conclusion:</strong> Review the rule and the example.</p>
<p><strong>Assignment:</strong> Write two equivalent fractions for each of 1/2, 2/3 and 1/4, and shade one pair to show they are equal.</p>
<p><strong>Answers for the teacher:</strong> (1) 2; (2) 6/8, 9/12 or similar; (3) Yes, multiply top and bottom of 2/5 by 2; (4) 1/2.</p>

<h2>Ten common mistakes (and fixes)</h2>
<ol>
<li><strong>Vague objectives.</strong> Replace "understand" with a verb you can check.</li>
<li><strong>Too much content.</strong> Teach one main idea well.</li>
<li><strong>No pupil activity.</strong> Add a question or task in every step.</li>
<li><strong>No time plan.</strong> Put minutes beside each step.</li>
<li><strong>Evaluation that does not match the objectives.</strong> Map each objective to a question.</li>
<li><strong>Copying a note without adapting it</strong> to your class, school and materials.</li>
<li><strong>Wrong or unchecked board work.</strong> Solve every example before the lesson.</li>
<li><strong>Missing materials.</strong> Prepare cheap local alternatives.</li>
<li><strong>No assignment, or an assignment that is too hard.</strong> Link it to the lesson.</li>
<li><strong>Not reflecting after the lesson.</strong> Add a short note: what worked, what to repeat.</li>
</ol>

<h2>Checklist before you submit your note</h2>
<ul>
<li>Class, term, week, date and duration are filled in.</li>
<li>The topic matches your scheme of work.</li>
<li>Objectives are measurable and fewer than five.</li>
<li>Steps are numbered and timed, with teacher and pupil activities.</li>
<li>Examples are worked out and correct.</li>
<li>Evaluation questions test every objective.</li>
<li>Assignment is clear and linked to the lesson.</li>
<li>Materials are ready and listed.</li>
</ul>$b$,
  'Lesson Notes', 'article', NULL,
  $j$[{"label": "NERDC: Basic Education Curriculum (BEC)", "url": "https://nerdc.gov.ng/content_manager/curriculum.html"}, {"label": "NERDC: Primary 4-6 curriculum", "url": "https://nerdc.gov.ng/content_manager/pri4-6.html"}, {"label": "NERDC: Publications", "url": "https://nerdc.gov.ng/content_manager/publications.html"}]$j$::jsonb,
  ARRAY['lesson note','lesson plan','objectives','primary','teaching practice'], 9,
  'How to Write a Lesson Note in Nigeria (With a Complete Example)',
  'Learn every part of a Nigerian lesson note, how to write objectives, and copy a complete worked example with a checklist.', false
),
(
  'How to Make a Scheme of Work in Nigeria: Step-by-Step Guide with a Worked Primary 4 Example', 'how-to-make-scheme-of-work-nigeria-complete-guide',
  'A seven-step method for turning the curriculum into a term scheme of work, with columns, a 13-week worked example, common mistakes and tips for multi-class teachers.',
  $b$<p>A scheme of work is the term-by-term map that turns the curriculum into weekly teaching. It sits between the curriculum (what must be taught in the year) and your lesson notes (what you teach each day). Done well, it protects you from last-minute rushing and tells school leaders exactly where you are in the syllabus.</p>

<h2>Scheme of work, curriculum and lesson note: how they fit</h2>
<ul>
<li><strong>Curriculum:</strong> the official document from NERDC or your state. It lists topics, objectives and suggested activities for each class and subject.</li>
<li><strong>Scheme of work:</strong> your plan for spreading those topics over the weeks of each term.</li>
<li><strong>Lesson note:</strong> the detailed plan for one lesson, taken from one line of your scheme.</li>
</ul>
<p>Some states and school groups issue a unified scheme. If your school has one, follow it and use the steps below to add your own detail.</p>

<h2>Step by step: building a scheme of work</h2>
<h3>Step 1: Count your real teaching weeks</h3>
<p>Take the term calendar and remove weeks you cannot teach new content. A typical Nigerian term is about 13 weeks. Remove the first week if it is used for resumption and revision, the mid-term break and test week, the last one or two weeks for revision and examinations, and any public holiday weeks. You may end up with 9 to 11 teaching weeks. Plan for that number, not 13.</p>
<h3>Step 2: Collect the topics</h3>
<p>List all the topics for your subject and class from the curriculum. If the curriculum has more topics than you have weeks, combine closely related topics and prioritise the ones that later topics depend on. Do not drop required topics silently; note any you move to another term.</p>
<h3>Step 3: Put topics in a logical order</h3>
<p>Teach prerequisites first. In Mathematics, whole numbers come before fractions, and addition before multiplication. In English, vocabulary and sentence work come before composition.</p>
<h3>Step 4: Give each topic enough weeks</h3>
<p>Estimate by difficulty and importance. A big topic like fractions may need 2 or 3 weeks. A light topic may need 1 week. Leave one week near the end for revision.</p>
<h3>Step 5: Add objectives, activities and resources</h3>
<p>For every row, write what pupils should be able to do, the main activities, and the materials you need. Copy and adapt objectives from the curriculum.</p>
<h3>Step 6: Plan assessments</h3>
<p>Mark the weeks for class tests, assignments, the mid-term test and the exam. Make sure the content tested has already been taught.</p>
<h3>Step 7: Review mid-term</h3>
<p>At mid-term, compare your actual progress against the scheme. If you are behind, adjust the remaining weeks, not the exam date.</p>

<h2>Suggested columns</h2>
<table>
<tr><th>Column</th><th>Content</th></tr>
<tr><td>Week</td><td>1, 2, 3... (and the date if you wish)</td></tr>
<tr><td>Topic / sub-topic</td><td>From the curriculum</td></tr>
<tr><td>Objectives</td><td>Measurable outcomes</td></tr>
<tr><td>Activities</td><td>Main teaching and learning activities</td></tr>
<tr><td>Resources</td><td>Charts, textbooks, objects</td></tr>
<tr><td>Evaluation</td><td>Class work, quizzes, tests</td></tr>
<tr><td>Remarks</td><td>What happened, what to repeat</td></tr>
</table>

<h2>A worked example: Primary 4 Mathematics, first term</h2>
<p><em>This example shows the layout and the thinking. The topics are illustrative: before using it, replace them with the topics and order given in your official curriculum or school scheme.</em></p>
<table>
<tr><th>Week</th><th>Topic</th><th>Objectives (pupils should be able to...)</th><th>Activities and resources</th><th>Evaluation</th></tr>
<tr><td>1</td><td>Revision of Primary 3 work</td><td>Add and subtract numbers up to 1,000</td><td>Oral drill, worksheet, number cards</td><td>Baseline test</td></tr>
<tr><td>2-3</td><td>Whole numbers: place value up to 100,000</td><td>Read, write and compare numbers; state place value</td><td>Place-value chart, bundles of sticks, number cards</td><td>Class work</td></tr>
<tr><td>4-5</td><td>Addition and subtraction</td><td>Solve word problems with regrouping</td><td>Shop role-play with bottle tops as money</td><td>Quiz</td></tr>
<tr><td>6</td><td>Revision and mid-term test</td><td>Show mastery of weeks 1-5</td><td>Revision games and test</td><td>Mid-term test</td></tr>
<tr><td>7-8</td><td>Multiplication</td><td>Recall tables to 12; multiply by 2-digit numbers</td><td>Times table chart, arrays</td><td>Table recital, class work</td></tr>
<tr><td>9-10</td><td>Division</td><td>Divide by single digits; relate to multiplication</td><td>Sharing activities with objects</td><td>Class work</td></tr>
<tr><td>11</td><td>Fractions: introduction</td><td>Name and shade halves, thirds and quarters</td><td>Paper folding, fraction strips</td><td>Assignment</td></tr>
<tr><td>12</td><td>General revision</td><td>Solve mixed problems</td><td>Past questions, group work</td><td>Practice test</td></tr>
<tr><td>13</td><td>Examination</td><td>-</td><td>-</td><td>Term exam</td></tr>
</table>

<h2>Common mistakes</h2>
<ul>
<li>Planning 13 weeks of teaching when only 10 exist.</li>
<li>Putting a topic before the topic it depends on.</li>
<li>Copying last year's scheme without checking the current curriculum.</li>
<li>Leaving no revision week.</li>
<li>Writing topics only, without objectives or resources, so the scheme cannot guide lesson notes.</li>
<li>Never updating the remarks column, so no one knows what was actually taught.</li>
</ul>

<h2>Tips for teachers who handle several classes</h2>
<ul>
<li>Keep one file per subject per class, named the same way every term.</li>
<li>Use a spreadsheet so you can sort and print by week.</li>
<li>Colour-code assessment weeks so they stand out.</li>
<li>Write your lesson notes one week ahead, straight from the scheme.</li>
</ul>

<h2>Where to get the curriculum</h2>
<p>Use the official NERDC pages for Primary 1-3, Primary 4-6 and JSS 1-3, and the curriculum offerings document. These are linked under Sources. For senior secondary subjects, schools usually follow the national curriculum together with the examination body's syllabus (for example, WAEC or NECO) for external exam classes.</p>$b$,
  'Schemes of Work', 'article', NULL,
  $j$[{"label": "NERDC: Basic Education Curriculum (BEC)", "url": "https://nerdc.gov.ng/content_manager/curriculum.html"}, {"label": "NERDC: Primary 1-3 curriculum", "url": "https://nerdc.gov.ng/content_manager/pri1-3.html"}, {"label": "NERDC: Primary 4-6 curriculum", "url": "https://nerdc.gov.ng/content_manager/pri4-6.html"}, {"label": "NERDC: Junior Secondary 1-3 curriculum", "url": "https://nerdc.gov.ng/content_manager/jss1-3.html"}, {"label": "NERDC: National Curriculum in Brief", "url": "https://nerdc.gov.ng/content_manager/national_curriculum_brief.html"}, {"label": "NERDC: Basic and Senior Secondary Curriculum Offerings (PDF)", "url": "https://nerdc.gov.ng/content_manager/Basic%20and%20Senior%20Secondary%20Education%20Curriculum%20Offerings.pdf"}]$j$::jsonb,
  ARRAY['scheme of work','planning','curriculum','term planning'], 7,
  'How to Make a Scheme of Work in Nigeria (Step-by-Step with Example)',
  'Seven steps to build a term scheme of work from the Nigerian curriculum, with a worked example, columns and common mistakes.', false
),
(
  '16 Classroom Games for Nigerian Schools: Maths, English and Revision Games with Rules', 'classroom-games-nigerian-schools-16-games',
  'Sixteen low-cost games for large classes, each with learning aim, class level, materials, rules and variations, plus tips for running games so pupils actually learn.',
  $b$<p>These 16 games need little or no equipment, work in large Nigerian classrooms, and each one has a clear learning aim. Use them for 5 to 15 minutes to introduce a topic, practise a skill or revise. A game is only useful if pupils know the learning goal, so say it before you start.</p>

<h2>How to run any classroom game well</h2>
<ol>
<li><strong>State the learning aim</strong> in one sentence ("Today we practise adding to 20").</li>
<li><strong>Demonstrate once</strong> with two pupils while the others watch.</li>
<li><strong>Set a time limit.</strong> Five to ten minutes keeps energy high.</li>
<li><strong>Make teams mixed-ability</strong> so strong pupils help weaker ones.</li>
<li><strong>Keep score on the board</strong>, but praise effort and teamwork, not only winners.</li>
<li><strong>Finish with a quick check:</strong> ask two or three pupils to use what they practised.</li>
</ol>

<h2>Mathematics games</h2>

<h3>1. Number line jump</h3>
<p><strong>Level:</strong> Primary 1-3 &nbsp; <strong>Aim:</strong> addition and subtraction to 20 &nbsp; <strong>Materials:</strong> chalk</p>
<p><strong>How to play:</strong> Draw a number line from 0 to 20 on the ground or a long board. Call a sum such as 8 + 5. A pupil starts at 8 and jumps forward 5 steps, then states the answer. Use subtraction by jumping backwards. <strong>Variation:</strong> Let pupils set the problems for each other.</p>

<h3>2. Beat the teacher</h3>
<p><strong>Level:</strong> Primary 3-6 &nbsp; <strong>Aim:</strong> mental calculation &nbsp; <strong>Materials:</strong> board</p>
<p><strong>How to play:</strong> Write a sum on the board. The teacher and a pupil each solve it without writing. The first to give the correct answer scores. Let pupils lead the next round. <strong>Tip:</strong> Make sure you "lose" often enough to keep pupils motivated.</p>

<h3>3. Shop role-play</h3>
<p><strong>Level:</strong> Primary 2-5 &nbsp; <strong>Aim:</strong> money, addition and change &nbsp; <strong>Materials:</strong> bottle tops as coins, 5 to 6 items with prices on paper</p>
<p><strong>How to play:</strong> Set up a small shop. Pupils take turns as shopkeeper and buyer. The buyer chooses items, the shopkeeper adds the total and gives change. <strong>Variation:</strong> Use real naira notes and coins for older pupils.</p>

<h3>4. Multiplication circle</h3>
<p><strong>Level:</strong> Primary 3-5 &nbsp; <strong>Aim:</strong> times tables &nbsp; <strong>Materials:</strong> a ball or rolled paper</p>
<p><strong>How to play:</strong> Pupils stand or sit in a circle. The teacher calls a table, such as "6 times". A pupil throws the ball and says "6 times 1"; the catcher says "6", then throws and says "6 times 2". Continue until the end of the table. <strong>Variation:</strong> Mix questions out of order.</p>

<h3>5. Domino sums</h3>
<p><strong>Level:</strong> Primary 2-4 &nbsp; <strong>Aim:</strong> number bonds &nbsp; <strong>Materials:</strong> cards cut from cartons</p>
<p><strong>How to play:</strong> Make cards with a sum on the left half and an answer on the right half, joined in a chain (for example "3 + 4 | 10" matches next with "10 | 6 + 2"). Pupils join cards so each answer meets its sum. The chain closes when it returns to the first card.</p>

<h3>6. Fraction fold</h3>
<p><strong>Level:</strong> Primary 4-6 &nbsp; <strong>Aim:</strong> equivalent fractions &nbsp; <strong>Materials:</strong> one sheet of paper per pair</p>
<p><strong>How to play:</strong> Pairs fold a strip into halves, shade one half, then fold again into quarters and eighths. They write the fractions they see (1/2 = 2/4 = 4/8). The pair that finds the most equivalent fractions in 5 minutes wins.</p>

<h2>English and language games</h2>

<h3>7. Sound hunt</h3>
<p><strong>Level:</strong> Primary 1-2 &nbsp; <strong>Aim:</strong> beginning sounds &nbsp; <strong>Materials:</strong> classroom objects</p>
<p><strong>How to play:</strong> Say a sound, such as /b/. Pupils find and point to or name objects starting with it (book, bag, bench). Give one point for each correct object. <strong>Variation:</strong> Use ending sounds for Primary 2.</p>

<h3>8. Word chain</h3>
<p><strong>Level:</strong> Primary 3-6 &nbsp; <strong>Aim:</strong> vocabulary and spelling &nbsp; <strong>Materials:</strong> none</p>
<p><strong>How to play:</strong> The first pupil says a word. The next says a word that begins with the last letter of the previous word (door, rain, news, sun). A pupil who cannot continue sits down. <strong>Variation:</strong> Limit words to a topic, such as animals or foods.</p>

<h3>9. Spelling relay</h3>
<p><strong>Level:</strong> Primary 3-6 &nbsp; <strong>Aim:</strong> spelling &nbsp; <strong>Materials:</strong> board and chalk</p>
<p><strong>How to play:</strong> Divide the class into teams in lines. Call a word. The first pupil in each line runs to the board and writes the first letter; the next writes the second letter, and so on. The first team to finish with correct spelling scores.</p>

<h3>10. Sentence scramble</h3>
<p><strong>Level:</strong> Primary 2-5 &nbsp; <strong>Aim:</strong> sentence structure &nbsp; <strong>Materials:</strong> word cards</p>
<p><strong>How to play:</strong> Give each group a set of cards with the words of a sentence in the wrong order. They arrange them into a correct sentence and read it aloud. <strong>Variation:</strong> Add a punctuation card and a capital-letter card.</p>

<h3>11. Mime the verb</h3>
<p><strong>Level:</strong> Primary 2-5 &nbsp; <strong>Aim:</strong> verbs and tenses &nbsp; <strong>Materials:</strong> none</p>
<p><strong>How to play:</strong> A pupil acts out a verb (jump, write, sweep). The class guesses, then says a sentence in the present tense ("She is sweeping") and the past tense ("She swept").</p>

<h3>12. Story circle</h3>
<p><strong>Level:</strong> Primary 3-6 and JSS &nbsp; <strong>Aim:</strong> speaking and sequencing &nbsp; <strong>Materials:</strong> none</p>
<p><strong>How to play:</strong> The teacher starts a story with one sentence. Each pupil adds one sentence. Remind pupils to use "first", "then", "after that" and "finally". <strong>Variation:</strong> Use a local folktale starter.</p>

<h2>Science, social studies and general revision</h2>

<h3>13. True or false corners</h3>
<p><strong>Level:</strong> Primary 3-JSS &nbsp; <strong>Aim:</strong> recall and reasoning &nbsp; <strong>Materials:</strong> two signs, "True" and "False"</p>
<p><strong>How to play:</strong> Place the signs on opposite sides of the room. Read a statement. Pupils move to the side they think is right. Ask a few pupils to explain their choice.</p>

<h3>14. Hot seat</h3>
<p><strong>Level:</strong> Primary 4-SSS &nbsp; <strong>Aim:</strong> topic revision &nbsp; <strong>Materials:</strong> a chair</p>
<p><strong>How to play:</strong> One pupil sits facing the class and answers questions about the topic. A correct answer keeps them in the seat; a wrong answer swaps them with the pupil who asked.</p>

<h3>15. Sort it out</h3>
<p><strong>Level:</strong> Primary 2-6 &nbsp; <strong>Aim:</strong> classification (living/non-living, healthy/unhealthy food, states of matter) &nbsp; <strong>Materials:</strong> picture or word cards</p>
<p><strong>How to play:</strong> Give each group a set of cards and two or three labelled areas. They sort the cards and justify their choices to another group.</p>

<h3>16. Quiz ladder</h3>
<p><strong>Level:</strong> Primary 4-SSS &nbsp; <strong>Aim:</strong> exam revision &nbsp; <strong>Materials:</strong> a ladder drawn on the board with 8 rungs</p>
<p><strong>How to play:</strong> Two teams each have a marker on the bottom rung. A correct answer moves the team's marker up one rung; a wrong answer keeps it where it is. The first team to reach the top wins. Make rungs harder as they go up.</p>

<h2>Using games for learning, not just for fun</h2>
<ul>
<li>Link every game to the lesson objective, and note it in your lesson note.</li>
<li>Rotate roles so quiet pupils speak and strong pupils do not dominate.</li>
<li>Use games to find gaps: if many pupils get a question wrong, reteach it.</li>
<li>Keep it safe: clear desks, avoid running in small spaces, and do not shame pupils who make mistakes.</li>
</ul>$b$,
  'Class Games', 'article', NULL,
  $j$[]$j$::jsonb,
  ARRAY['games','classroom games','primary','mathematics','english','revision'], 8,
  '16 Classroom Games for Nigerian Schools (Rules, Aims and Variations)',
  'Sixteen low-cost classroom games for Nigerian teachers with learning aims, materials, rules and variations for maths, English and revision.', false
),
(
  'Classroom Management for Large Nigerian Classes: Routines, Group Work, Marking and a Four-Week Plan', 'classroom-management-large-classes-nigeria-guide',
  'Practical routines, seating, pupil roles, pair and group work, low-marking ways to check understanding, fair discipline and a four-week plan for 40 to 60 pupils.',
  $b$<p>Managing 40, 50 or 60 pupils with a blackboard, limited books and no assistant is a real skill. The aim of this guide is not to make you stricter; it is to help you build routines so that lessons start quickly, noise stays manageable, every pupil is seen, and marking does not eat your evenings.</p>

<h2>1. Build routines in the first two weeks</h2>
<p>Pupils behave well when they know exactly what to do. Teach each routine as if it were a short lesson: explain, model it, practise it, and praise it. Core routines:</p>
<ul>
<li><strong>Entering and leaving:</strong> where bags go, how pupils line up, who leads.</li>
<li><strong>Starting a lesson:</strong> a short task on the board that pupils begin before you speak (for example, three recall questions).</li>
<li><strong>Getting attention:</strong> choose one signal (a raised hand, a clap pattern or a call-and-response phrase) and always use that same one.</li>
<li><strong>Handing out and collecting books:</strong> pass along rows; one monitor per row.</li>
<li><strong>Asking questions:</strong> raise your hand; call on pupils fairly, not only the same few.</li>
<li><strong>Ending a lesson:</strong> pack up, final question, dismiss row by row.</li>
</ul>

<h2>2. Arrange seating for visibility and movement</h2>
<ul>
<li>Leave at least one clear aisle so you can reach every row.</li>
<li>Seat pupils who need extra help near the front or near your walking path.</li>
<li>Where desks are fixed, make pairs or groups of 4 to 6 by turning the front row to face the back.</li>
<li>Where there are not enough chairs, rotate who sits on the floor so it is fair, and make sure everyone can see the board.</li>
</ul>

<h2>3. Use pupil roles</h2>
<p>Give each role to a different pupil each week so that everyone takes a turn:</p>
<ul>
<li><strong>Board monitor:</strong> cleans the board and sets out chalk.</li>
<li><strong>Book monitors:</strong> one per row.</li>
<li><strong>Time keeper:</strong> uses a watch or clock to warn when activities should end.</li>
<li><strong>Group leader and reporter:</strong> leads discussion and reports back.</li>
</ul>

<h2>4. Teach with the whole class, then pairs, then groups</h2>
<p>With a large class, aim for a lesson shape such as: 10 minutes whole-class teaching, 10 minutes pair work, 10 minutes individual or group practice, and 5 minutes review. Pair work is the easiest group method in a crowded room because it needs no movement and everyone speaks.</p>
<p>For groups of 5 or 6, give each pupil a role (reader, writer, speaker, checker) and a short task with a clear product. Move around and listen; do not stand at the front while groups work.</p>

<h2>5. Check understanding without marking 50 books</h2>
<ul>
<li><strong>Slates or paper held up:</strong> ask a question; all pupils write the answer and hold it up. You see the whole class in seconds.</li>
<li><strong>Thumbs signals:</strong> up for "I understand", sideways for "partly", down for "not yet".</li>
<li><strong>Exit questions:</strong> two quick questions in the last 3 minutes; sort answers into "got it" and "needs help".</li>
<li><strong>Peer marking:</strong> pupils swap books and mark against your board answers.</li>
<li><strong>Sampling:</strong> carefully mark 10 to 12 books per lesson, rotating through the class, and scan the rest for common errors.</li>
</ul>

<h2>6. Handle noise and misbehaviour fairly</h2>
<ol>
<li><strong>Prevent first:</strong> clear instructions, interesting tasks and plenty of pupil activity reduce most disruption.</li>
<li><strong>Use a quiet reminder first:</strong> stand near the pupil, use eye contact, or call the pupil's name calmly.</li>
<li><strong>Use a consistent, proportionate consequence</strong> that your school allows, and apply it to everyone in the same way.</li>
<li><strong>Talk privately</strong> after class for repeated problems, and involve parents and the school head when needed.</li>
<li><strong>Do not use physical punishment or humiliation.</strong> It harms pupils, can breach safeguarding rules and TRCN's Code of Conduct, and does not improve learning.</li>
</ol>

<h2>7. Look after mixed abilities</h2>
<ul>
<li>Plan a basic task everyone can do, a core task for most, and an extension for fast finishers.</li>
<li>Pair stronger pupils with weaker ones for explanation, but do not let the strong pupil do the work.</li>
<li>Check every pupil's attendance and progress over a few weeks and give extra practice to those falling behind.</li>
</ul>

<h2>8. A four-week plan to improve your classroom</h2>
<table>
<tr><th>Week</th><th>Focus</th><th>Do this</th></tr>
<tr><td>1</td><td>Routines</td><td>Teach and practise entering, attention signal, and handing out books.</td></tr>
<tr><td>2</td><td>Participation</td><td>Introduce pair work and slate checks in every lesson.</td></tr>
<tr><td>3</td><td>Feedback</td><td>Start exit questions and peer marking.</td></tr>
<tr><td>4</td><td>Review</td><td>Ask pupils what helps them learn, note what is working, and adjust one routine.</td></tr>
</table>

<h2>9. Take care of yourself</h2>
<p>Large classes are tiring. Keep a simple lesson structure so you do not reinvent every lesson, share routines and resources with colleagues, and ask your head teacher about class size and support if it becomes unmanageable.</p>$b$,
  'Teaching Guide', 'article', NULL,
  $j$[{"label": "TRCN: Teachers' Code of Conduct", "url": "https://trcn.gov.ng/code-of-conduct"}]$j$::jsonb,
  ARRAY['classroom management','large class','discipline','group work','assessment'], 7,
  'Classroom Management for Large Classes in Nigeria (Practical Guide)',
  'Routines, seating, group work, quick assessment and fair discipline for managing 40 to 60 pupils, with a four-week improvement plan.', false
)
ON CONFLICT (slug) DO NOTHING;
