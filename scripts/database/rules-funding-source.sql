-- ==========================================
-- MIGRACIÓN: REGLAS CON FUENTE DE FONDOS (connection_id + asset)
-- ==========================================
-- Ejecutar en el SQL Editor y después ejecutar views.sql (la vista cambia de columnas).

-- Las reglas existentes repartían el saldo global y no tienen fuente, así que no se pueden migrar:
-- se eliminan para poder agregar las columnas NOT NULL. Las vuelves a crear desde "Manage Allocation".
DELETE FROM public.rules;

ALTER TABLE public.rules
    ADD COLUMN source_connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
    ADD COLUMN source_asset TEXT NOT NULL;

-- El UNIQUE anterior (target_envelope_id, trigger_event) puede tener dos nombres según cómo se creó.
ALTER TABLE public.rules DROP CONSTRAINT IF EXISTS rules_envelope_trigger_key;
ALTER TABLE public.rules DROP CONSTRAINT IF EXISTS rules_target_envelope_id_trigger_event_key;

ALTER TABLE public.rules
    ADD CONSTRAINT rules_source_envelope_trigger_key
    UNIQUE (target_envelope_id, source_connection_id, source_asset, trigger_event);

CREATE INDEX IF NOT EXISTS idx_rules_source ON public.rules(source_connection_id, source_asset);
