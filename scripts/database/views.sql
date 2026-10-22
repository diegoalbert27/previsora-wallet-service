-- ==========================================
-- 7. VISTA: SALDO ASIGNADO A CADA SOBRE
-- ==========================================
-- Cada regla toma un porcentaje del saldo de una fuente (connection_id + asset); un sobre recibe de varias fuentes.
-- allocated_amount = suma de (balances.amount * rules.percentage_to_route / 100) sobre las reglas activas del sobre.
-- security_invoker hace que se apliquen las políticas RLS del usuario que consulta, no las del dueño de la vista.

-- Se elimina antes porque CREATE OR REPLACE no permite quitar columnas (ya no se devuelve percentage).
DROP VIEW IF EXISTS public.envelope_balances;

CREATE VIEW public.envelope_balances
WITH (security_invoker = on) AS
SELECT
    e.id AS envelope_id,
    e.name,
    e.icon,
    COALESCE(SUM(b.amount * r.percentage_to_route / 100), 0) AS allocated_amount,
    e.created_at
FROM public.envelopes e
-- LEFT JOIN: un sobre sin reglas (o cuya fuente no tiene saldo) sigue apareciendo, con 0.
LEFT JOIN public.rules r
    ON r.target_envelope_id = e.id
   AND r.is_active = TRUE
LEFT JOIN public.balances b
    ON b.connection_id = r.source_connection_id
   AND b.asset = r.source_asset
   AND b.delete_status = FALSE
WHERE e.delete_status = FALSE
GROUP BY e.id, e.name, e.icon, e.created_at;

GRANT SELECT ON public.envelope_balances TO authenticated;

-- ==========================================
-- 8. VISTA: DE DÓNDE VIENE EL SALDO DE CADA SOBRE
-- ==========================================
-- Una fila por regla activa con porcentaje > 0: la fuente (conexión + moneda), su porcentaje y lo que aporta al sobre.
-- La suma de allocated_amount por envelope_id coincide con envelope_balances.allocated_amount.
DROP VIEW IF EXISTS public.envelope_allocations;

CREATE VIEW public.envelope_allocations
WITH (security_invoker = on) AS
SELECT
    r.target_envelope_id AS envelope_id,
    r.source_connection_id,
    r.source_asset AS asset,
    c.connection_type,
    c.provider,
    c.network,
    c.public_address,
    r.percentage_to_route AS percentage,
    COALESCE(b.amount, 0) * r.percentage_to_route / 100 AS allocated_amount
FROM public.rules r
JOIN public.connections c ON c.id = r.source_connection_id
LEFT JOIN public.balances b
    ON b.connection_id = r.source_connection_id
   AND b.asset = r.source_asset
   AND b.delete_status = FALSE
WHERE r.is_active = TRUE
  AND r.percentage_to_route > 0;

GRANT SELECT ON public.envelope_allocations TO authenticated;
