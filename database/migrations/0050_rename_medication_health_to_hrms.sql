-- Migration 0050: Rename medication & health tables to hrms_ prefix
-- Migration 0048 renamed most tables but missed the medication/health register tables.
-- Safe to run: IF EXISTS guards prevent errors if already renamed or not yet created.

ALTER TABLE IF EXISTS participant_medications         RENAME TO hrms_participant_medications;
ALTER TABLE IF EXISTS participant_medication_logs     RENAME TO hrms_participant_medication_logs;
ALTER TABLE IF EXISTS participant_health_conditions   RENAME TO hrms_participant_health_conditions;
ALTER TABLE IF EXISTS participant_health_appointments RENAME TO hrms_participant_health_appointments;
