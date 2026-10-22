-- ==========================================
-- 6. TRIGGER PARA CREACIÓN AUTOMÁTICA DE PERFIL
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Email sign-ups send the name as metadata (first_name / last_name); Google sign-ins provide given_name /
  -- family_name. Users created without any of them (older accounts) simply get NULLs.
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    new.id,
    NULLIF(TRIM(COALESCE(new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'given_name')), ''),
    NULLIF(TRIM(COALESCE(new.raw_user_meta_data->>'last_name', new.raw_user_meta_data->>'family_name')), '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
