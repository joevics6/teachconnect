-- ============================================================
-- normalize_role_categories.sql
-- One-time merge of role_category spelling variants into the standard
-- names in lib/role-categories.ts, so role pages (/jobs/category/[slug],
-- which need 6+ live jobs) aren't split by spelling. New jobs are
-- normalized in code. Rows with no role_category are left as they are.
-- ============================================================
update jobs set role_category = case lower(trim(role_category))
  when 'english teacher'                  then 'English Language Teacher'
  when 'ict teacher'                      then 'Computer / ICT Teacher'
  when 'computer teacher'                 then 'Computer / ICT Teacher'
  when 'computer science teacher'         then 'Computer / ICT Teacher'
  when 'computer studies teacher'         then 'Computer / ICT Teacher'
  when 'basic science teacher'            then 'Science Teacher'
  when 'basic technology teacher'         then 'Technology Teacher'
  when 'design and technology teacher'    then 'Technology Teacher'
  when 'technical drawing teacher'        then 'Technology Teacher'
  when 'business management teacher'      then 'Business Studies Teacher'
  when 'accounts and economics teacher'   then 'Accounting Teacher'
  when 'junior secondary school teacher'  then 'Secondary School Teacher'
  when 'school bus driver'                then 'Driver'
  end
where lower(trim(role_category)) in (
  'english teacher','ict teacher','computer teacher','computer science teacher','computer studies teacher',
  'basic science teacher','basic technology teacher','design and technology teacher','technical drawing teacher',
  'business management teacher','accounts and economics teacher','junior secondary school teacher','school bus driver'
);
