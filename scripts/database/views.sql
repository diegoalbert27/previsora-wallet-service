-- ==========================================
-- 7. VISTA: SALDO ASIGNADO A CADA SOBRE
-- ==========================================
-- Reparte la liquidez real del usuario (balances) entre sus sobres según el porcentaje de sus reglas activas.
-- security_invoker hace que se apliquen las políticas RLS del usuario que consulta, no las del dueño de la vista.
CREATE OR REPLACE VIEW public.envelope_balances
WITH (security_invoker = on) AS
WITH user_totals AS (
    -- Todos los activos soportados son stablecoins, así que se suman directo.
    SELECT user_id, SUM(amount) AS total_amount
    FROM public.balances
    WHERE delete_status = FALSE
    GROUP BY user_id
),
envelope_rules AS (
    -- Un sobre puede tener varias reglas activas: sus porcentajes se acumulan.
    SELECT target_envelope_id, SUM(percentage_to_route) AS percentage
    FROM public.rules
    WHERE is_active = TRUE
    GROUP BY target_envelope_id
)
SELECT
    e.id AS envelope_id,
    e.name,
    COALESCE(r.percentage, 0) AS percentage,
    COALESCE(t.total_amount, 0) * COALESCE(r.percentage, 0) / 100 AS allocated_amount,
    e.created_at
FROM public.envelopes e
-- LEFT JOIN: un sobre sin reglas (o un usuario sin saldos) sigue apareciendo, con 0.
LEFT JOIN envelope_rules r ON r.target_envelope_id = e.id
LEFT JOIN user_totals t ON t.user_id = e.user_id
WHERE e.delete_status = FALSE;

GRANT SELECT ON public.envelope_balances TO authenticated;
