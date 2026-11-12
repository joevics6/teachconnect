-- ============================================================
-- cbt_practice.sql
--
-- Past-question CBT practice that works for any exam body: JAMB, WAEC,
-- NECO, Junior WAEC / BECE (per state), Common Entrance, and whatever
-- else gets added later. Separate from quiz_questions (teacher screening).
--
--   cbt_exams      one row per exam (JAMB UTME, WAEC WASSCE, ...)
--   cbt_subjects   shared subject list (Mathematics, English, ...)
--   cbt_passages   comprehension passages shared by several questions
--   cbt_questions  the questions; exam + subject + year (+ region for
--                  state-run exams such as Junior WAEC)
--
-- Questions start as 'draft' (admin import) and only 'published' ones
-- are readable by the public. All writes go through the service role.
-- ============================================================

create table if not exists cbt_exams (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_name text not null,
  description text,
  default_question_count int not null default 40,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists cbt_subjects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists cbt_passages (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references cbt_exams(id) on delete cascade,
  subject_id uuid not null references cbt_subjects(id) on delete cascade,
  year int,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists cbt_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references cbt_exams(id) on delete cascade,
  subject_id uuid not null references cbt_subjects(id) on delete cascade,
  year int,
  region text,                       -- state, for state-run exams (Junior WAEC)
  topic text,
  passage_id uuid references cbt_passages(id) on delete set null,
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  option_e text,
  correct_option text not null check (correct_option in ('a','b','c','d','e')),
  explanation text,
  answer_source text not null default 'document' check (answer_source in ('document','ai','manual')),
  status text not null default 'draft' check (status in ('draft','published')),
  source_note text,
  import_batch text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cbt_questions_lookup on cbt_questions (exam_id, subject_id, status);
create index if not exists cbt_questions_year on cbt_questions (exam_id, subject_id, year);
create index if not exists cbt_questions_batch on cbt_questions (import_batch);
create index if not exists cbt_passages_lookup on cbt_passages (exam_id, subject_id);

-- Re-importing the same file must not create duplicates.
create unique index if not exists cbt_questions_no_dupes on cbt_questions (
  exam_id, subject_id, coalesce(year, 0), coalesce(region, ''), md5(lower(question_text))
);

alter table cbt_exams enable row level security;
alter table cbt_subjects enable row level security;
alter table cbt_passages enable row level security;
alter table cbt_questions enable row level security;

drop policy if exists "cbt_exams_public_read" on cbt_exams;
create policy "cbt_exams_public_read" on cbt_exams for select using (is_active);
drop policy if exists "cbt_subjects_public_read" on cbt_subjects;
create policy "cbt_subjects_public_read" on cbt_subjects for select using (true);
drop policy if exists "cbt_passages_public_read" on cbt_passages;
create policy "cbt_passages_public_read" on cbt_passages for select using (true);
drop policy if exists "cbt_questions_public_read" on cbt_questions;
create policy "cbt_questions_public_read" on cbt_questions for select using (status = 'published');

insert into cbt_exams (slug, name, short_name, description, default_question_count, sort_order) values
  ('jamb',            'JAMB UTME',                   'JAMB',   'Practise JAMB UTME past questions in a timed computer-based test.', 40, 1),
  ('waec',            'WAEC WASSCE',                 'WAEC',   'Practise WAEC WASSCE past questions by subject and year.',            40, 2),
  ('neco',            'NECO SSCE',                   'NECO',   'Practise NECO SSCE past questions by subject and year.',              40, 3),
  ('junior-waec',     'Junior WAEC (BECE)',          'BECE',   'Practise Junior WAEC / BECE past questions for JSS 3 students.',      40, 4),
  ('common-entrance', 'Common Entrance',             'Common Entrance', 'Practise Common Entrance past questions for Primary 6 pupils.', 30, 5)
on conflict (slug) do nothing;

insert into cbt_subjects (slug, name, sort_order) values
  ('english-language','English Language',1), ('mathematics','Mathematics',2), ('biology','Biology',3),
  ('chemistry','Chemistry',4), ('physics','Physics',5), ('economics','Economics',6),
  ('government','Government',7), ('literature-in-english','Literature in English',8),
  ('christian-religious-studies','Christian Religious Studies',9), ('islamic-studies','Islamic Studies',10),
  ('geography','Geography',11), ('commerce','Commerce',12), ('accounting','Principles of Accounts',13),
  ('agricultural-science','Agricultural Science',14), ('civic-education','Civic Education',15),
  ('computer-studies','Computer Studies',16), ('history','History',17), ('further-mathematics','Further Mathematics',18),
  ('basic-science','Basic Science',19), ('basic-technology','Basic Technology',20), ('business-studies','Business Studies',21),
  ('social-studies','Social Studies',22), ('home-economics','Home Economics',23), ('yoruba','Yoruba',24),
  ('igbo','Igbo',25), ('hausa','Hausa',26), ('french','French',27), ('quantitative-reasoning','Quantitative Reasoning',28),
  ('verbal-reasoning','Verbal Reasoning',29)
on conflict (slug) do nothing;

-- Published-question counts per exam/subject/year. A view so the public
-- pages can aggregate in the database (PostgREST caps plain selects at
-- 1000 rows). Only published questions are counted.
create or replace view cbt_question_counts as
  select exam_id, subject_id, year, count(*)::int as n
  from cbt_questions
  where status = 'published'
  group by exam_id, subject_id, year;
grant select on cbt_question_counts to anon, authenticated;
