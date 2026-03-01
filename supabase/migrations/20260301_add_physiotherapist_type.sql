-- Add physiotherapist as a valid professional type
ALTER TABLE fitness_professionals DROP CONSTRAINT IF EXISTS fitness_professionals_type_check;
ALTER TABLE fitness_professionals ADD CONSTRAINT fitness_professionals_type_check
  CHECK (type IN ('nutritionist', 'trainer', 'coach', 'physiotherapist', 'admin'));
