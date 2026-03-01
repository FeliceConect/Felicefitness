-- Add 'consultation' to note_type check constraint
ALTER TABLE fitness_professional_notes
  DROP CONSTRAINT IF EXISTS fitness_professional_notes_note_type_check;

ALTER TABLE fitness_professional_notes
  ADD CONSTRAINT fitness_professional_notes_note_type_check
  CHECK (note_type IN ('observation','evolution','action_plan','alert','consultation'));
