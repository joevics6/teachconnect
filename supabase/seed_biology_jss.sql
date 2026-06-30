-- ============================================================
-- Seed: Biology JSS Quiz Questions
-- 3 sets: Specialization (MCQ), Job Objective (MCQ), Job Theory
-- Table: quiz_questions
-- ============================================================


-- ─── 1. SPECIALIZATION QUIZ — Biology JSS (10 MCQ) ──────────
-- Fetched by subject only. Always MCQ.

INSERT INTO quiz_questions (subject, difficulty_level, question_text, option_a, option_b, option_c, option_d, correct_option, is_active)
VALUES

('Biology', 'jss',
 'Which organ in the human body is responsible for pumping blood?',
 'Liver', 'Lungs', 'Heart', 'Kidney',
 'c', true),

('Biology', 'jss',
 'What is the basic unit of life?',
 'Tissue', 'Organ', 'Cell', 'Organism',
 'c', true),

('Biology', 'jss',
 'Which part of a plant makes food using sunlight?',
 'Root', 'Stem', 'Leaf', 'Flower',
 'c', true),

('Biology', 'jss',
 'What gas do plants release during photosynthesis?',
 'Carbon dioxide', 'Nitrogen', 'Oxygen', 'Hydrogen',
 'c', true),

('Biology', 'jss',
 'Which of the following is NOT a vertebrate?',
 'Fish', 'Frog', 'Grasshopper', 'Lizard',
 'c', true),

('Biology', 'jss',
 'What is the function of the root in a plant?',
 'To make food', 'To carry water upward only', 'To absorb water and mineral salts from the soil', 'To produce flowers',
 'c', true),

('Biology', 'jss',
 'Which blood cells help the body fight infections?',
 'Red blood cells', 'Platelets', 'White blood cells', 'Plasma',
 'c', true),

('Biology', 'jss',
 'The process by which green plants make their own food is called?',
 'Respiration', 'Digestion', 'Photosynthesis', 'Excretion',
 'c', true),

('Biology', 'jss',
 'Which of these animals is a mammal?',
 'Crocodile', 'Eagle', 'Dolphin', 'Tilapia',
 'c', true),

('Biology', 'jss',
 'What is the powerhouse of the cell?',
 'Nucleus', 'Cell membrane', 'Ribosome', 'Mitochondria',
 'd', true);


-- ─── 2. JOB QUIZ — Biology JSS Speed/Standard (10 MCQ) ──────
-- Fetched by subject + difficulty_level. Mode = speed or standard.

INSERT INTO quiz_questions (subject, difficulty_level, question_text, option_a, option_b, option_c, option_d, correct_option, is_active)
VALUES

('Biology', 'jss',
 'Which part of the cell controls all its activities?',
 'Cell wall', 'Cytoplasm', 'Nucleus', 'Vacuole',
 'c', true),

('Biology', 'jss',
 'The movement of water through a semi-permeable membrane from high to low concentration is called?',
 'Diffusion', 'Osmosis', 'Active transport', 'Transpiration',
 'b', true),

('Biology', 'jss',
 'Which of the following is a characteristic of living things?',
 'They are all green', 'They all have roots', 'They all respire', 'They all live in water',
 'c', true),

('Biology', 'jss',
 'The skeleton of a fish is made of?',
 'Cartilage only', 'Bone only', 'Bone or cartilage depending on the species', 'Chitin',
 'c', true),

('Biology', 'jss',
 'Which of these is an example of asexual reproduction in plants?',
 'Pollination', 'Fertilisation', 'Budding in yeast', 'Vegetative propagation by cuttings',
 'd', true),

('Biology', 'jss',
 'In which organ does digestion of protein begin?',
 'Mouth', 'Oesophagus', 'Stomach', 'Small intestine',
 'c', true),

('Biology', 'jss',
 'What is the role of chlorophyll in photosynthesis?',
 'To absorb water', 'To absorb light energy', 'To release carbon dioxide', 'To produce glucose directly',
 'b', true),

('Biology', 'jss',
 'Which type of nutrition do fungi use?',
 'Autotrophic', 'Holozoic', 'Saprophytic', 'Parasitic',
 'c', true),

('Biology', 'jss',
 'The exchange of gases in the lungs takes place in the?',
 'Trachea', 'Bronchi', 'Alveoli', 'Diaphragm',
 'c', true),

('Biology', 'jss',
 'What do we call an organism that can make its own food?',
 'Heterotroph', 'Decomposer', 'Autotroph', 'Parasite',
 'c', true);


-- ─── 3. JOB QUIZ — Biology JSS Theory (10 Written) ──────────
-- Fetched by subject + difficulty_level. Mode = written.
-- Options are set to '' (empty string) since columns are NOT NULL.
-- The written quiz API only ever selects question_text, so the
-- empty option values are never sent to the teacher or used.
-- correct_option is left NULL since theory answers are AI-graded, not matched.

INSERT INTO quiz_questions (subject, difficulty_level, question_text, option_a, option_b, option_c, option_d, correct_option, is_active)
VALUES

('Biology', 'jss',
 'Explain the process of photosynthesis. State the raw materials needed, the products formed, and where the process takes place in the plant.',
 '', '', '', '', NULL, true),

('Biology', 'jss',
 'What are the five characteristics of all living things? Give one example to illustrate each characteristic.',
 '', '', '', '', NULL, true),

('Biology', 'jss',
 'Describe the structure of a cell and explain the function of any three cell organelles.',
 '', '', '', '', NULL, true),

('Biology', 'jss',
 'What is the difference between sexual and asexual reproduction? Give one advantage of each type.',
 '', '', '', '', NULL, true),

('Biology', 'jss',
 'Explain how the human digestive system breaks down food. Name the organs involved and state what happens at each stage.',
 '', '', '', '', NULL, true),

('Biology', 'jss',
 'Describe the process of respiration in humans. How is it different from breathing?',
 '', '', '', '', NULL, true),

('Biology', 'jss',
 'What is the importance of the skeleton in the human body? Name three bones and state their functions.',
 '', '', '', '', NULL, true),

('Biology', 'jss',
 'Explain the food chain with an example from a Nigerian ecosystem. Identify the producer, primary consumer, and secondary consumer.',
 '', '', '', '', NULL, true),

('Biology', 'jss',
 'What is fertilisation in flowering plants? Describe the events that occur from pollination to the formation of a seed.',
 '', '', '', '', NULL, true),

('Biology', 'jss',
 'Explain three ways in which human activities affect the environment. Suggest one way to reduce each negative effect.',
 NULL, NULL, NULL, NULL, NULL, true);


-- ─── Verify ──────────────────────────────────────────────────
-- SELECT
--   COUNT(*) FILTER (WHERE correct_option IS NOT NULL) AS mcq_count,
--   COUNT(*) FILTER (WHERE correct_option IS NULL)     AS theory_count
-- FROM quiz_questions
-- WHERE subject = 'Biology' AND difficulty_level = 'jss';
--
-- Expected: mcq_count = 20, theory_count = 10
