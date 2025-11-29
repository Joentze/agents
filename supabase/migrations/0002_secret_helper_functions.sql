-- Custom SQL migration file, put your code below! ---- Custom SQL migration file, put your code below! --
-- Function to get a secret from vault (with authorization check)
DROP FUNCTION IF EXISTS get_secret_token(uuid);

CREATE
OR REPLACE FUNCTION get_secret_token(p_token_id uuid) RETURNS TEXT SECURITY DEFINER -- Function will run with the privileges of the creator
SET
    search_path = vault,
    public -- Set the search path for security
    LANGUAGE plpgsql AS $$ BEGIN -- Check if user that made get_secret_token is the same as the user that created the secret
    IF NOT EXISTS (
        SELECT
            1
        FROM
            public.secret
        WHERE
            vault_secret_id = p_token_id
            AND created_by = auth.uid()
    ) THEN RAISE EXCEPTION 'You are not authorized to access this secret';

END IF;

-- Return the decrypted_secret from the vault.decrypted_secrets table for the given ID
RETURN (
    SELECT
        decrypted_secret
    FROM
        vault.decrypted_secrets
    WHERE
        id = p_token_id
);

END;

$$;

-- Function to insert a secret into vault and create a record in the public.secret table
CREATE
OR REPLACE FUNCTION insert_secret_token(
    p_name TEXT,
    p_description TEXT,
    p_secret TEXT
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER
SET
    search_path = '' AS $$ DECLARE v_token_id UUID;

BEGIN -- Use the built-in vault.create_secret function to store the secret in vault
v_token_id := vault.create_secret(p_secret, p_name, p_description);

-- Insert the reference into the public.secret table
INSERT INTO
    public.secret (vault_secret_id, created_by)
VALUES
    (v_token_id, auth.uid());

RETURN v_token_id;

END;

$$;

-- Function to delete a secret from vault by key ID
DROP FUNCTION IF EXISTS delete_secret_by_key_id(uuid);

CREATE
OR REPLACE FUNCTION delete_secret_by_key_id(p_token_id uuid) RETURNS TEXT SECURITY DEFINER -- Function will run with the privileges of the creator
SET
    search_path = vault,
    public -- Set the search path for security
    LANGUAGE plpgsql AS $$ DECLARE v_secret_text TEXT;

BEGIN -- First, retrieve the decrypted secret
SELECT
    decrypted_secret INTO v_secret_text
FROM
    vault.decrypted_secrets
WHERE
    id = p_token_id
LIMIT
    1;

-- Then perform the deletion if we found the secret
IF v_secret_text IS NOT NULL THEN
DELETE FROM
    vault.secrets
WHERE
    id = p_token_id;

END IF;

-- Return the captured secret (will be NULL if not found)
RETURN v_secret_text;

END;

$$;

-- Trigger function to delete vault secret when public secret is deleted
CREATE
OR REPLACE FUNCTION trigger_delete_vault_secret_fn() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET
    search_path = '' AS $$ BEGIN PERFORM public.delete_secret_by_key_id(OLD.vault_secret_id);

RETURN OLD;

END;

$$;

-- Create trigger to automatically delete vault secret when public secret is deleted
DROP TRIGGER IF EXISTS trigger_delete_vault_secret ON public.secret;

CREATE TRIGGER trigger_delete_vault_secret
AFTER
    DELETE ON public.secret FOR EACH ROW EXECUTE FUNCTION trigger_delete_vault_secret_fn();