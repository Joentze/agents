-- Custom SQL migration file, put your code below! --
-- Update the trigger to use public.secret.id instead of vault_secret_id
-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS trigger_delete_vault_secret ON public.secret;

DROP FUNCTION IF EXISTS trigger_delete_vault_secret_fn();

-- Recreate the trigger function with updated logic
-- Now passes OLD.id (public.secret.id) instead of OLD.vault_secret_id
CREATE
OR REPLACE FUNCTION trigger_delete_vault_secret_fn() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET
    search_path = '' AS $$ BEGIN -- Call delete_secret_by_key_id with the public.secret.id
    -- The function will look up the vault_secret_id internally
    PERFORM public.delete_secret_by_key_id(OLD.id);

RETURN OLD;

END;

$$;

-- Recreate the trigger
CREATE TRIGGER trigger_delete_vault_secret
AFTER
    DELETE ON public.secret FOR EACH ROW EXECUTE FUNCTION trigger_delete_vault_secret_fn();