-- ==========================================
-- Un sobre solo recibe de fuentes en su misma moneda
-- ==========================================
-- Regla de negocio: rules.source_asset debe ser igual a envelopes.asset del sobre destino.
-- La app ya filtra los sobres en "Manage allocation" y, al cambiar la moneda de un sobre, borra sus reglas de otras
-- monedas. Este script lo hace cumplir también en la base de datos.

-- 1. Revisar: reglas que hoy no cumplen la regla (monedas distintas entre sobre y fuente).
SELECT r.id, e.name AS envelope, e.asset AS envelope_asset, r.source_asset, r.percentage_to_route
FROM public.rules r
JOIN public.envelopes e ON e.id = r.target_envelope_id
WHERE r.source_asset <> e.asset;

-- 2. Limpiar: borra esas reglas. Revisa el resultado del paso 1 antes de ejecutarlo; no se puede deshacer.
DELETE FROM public.rules r
USING public.envelopes e
WHERE e.id = r.target_envelope_id
  AND r.source_asset <> e.asset;

-- 3. Hacer cumplir: rechaza reglas cuya moneda de origen no coincide con la del sobre.
CREATE OR REPLACE FUNCTION public.enforce_rule_asset_matches_envelope()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    envelope_asset TEXT;
BEGIN
    SELECT asset INTO envelope_asset FROM public.envelopes WHERE id = NEW.target_envelope_id;

    IF envelope_asset IS DISTINCT FROM NEW.source_asset THEN
        RAISE EXCEPTION 'Envelope currency (%) does not match the funding source currency (%)', envelope_asset, NEW.source_asset;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rules_asset_matches_envelope ON public.rules;
CREATE TRIGGER rules_asset_matches_envelope
    BEFORE INSERT OR UPDATE OF target_envelope_id, source_asset ON public.rules
    FOR EACH ROW EXECUTE FUNCTION public.enforce_rule_asset_matches_envelope();
