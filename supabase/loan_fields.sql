-- הוסף עמודת פירוט מטרת ההלוואה לטבלת loans
-- הרץ פעם אחת ב-Supabase SQL Editor

alter table loans
  add column if not exists purpose_details text;
