-- DB-level backstop against duplicate courses/assignments from eClass sync.
-- The sync logic (AI + code) already avoids creating duplicates in the normal
-- case; these unique indexes guarantee it even under races (e.g. a double
-- "Apply" click) or a bug in that logic.

create unique index if not exists courses_user_eclass_id_key
  on courses (user_id, eclass_course_id)
  where eclass_course_id is not null;

create unique index if not exists assignments_course_eclass_item_key
  on assignments (course_id, eclass_item_name)
  where eclass_item_name is not null;
