-- Custom SQL migration file, put your code below! --
-- Updated secret helper functions to use deterministic public.secret.id instead of vault_secret_id
-- Drop all existing secret helper functions before recreating them
DROP FUNCTION IF EXISTS get_secret_token(uuid);

DROP FUNCTION IF EXISTS insert_secret_token(text, text, text);

DROP FUNCTION IF EXISTS insert_secret_token(uuid, text, text, text);

DROP FUNCTION IF EXISTS upsert_secret_token(uuid, text, text, text);

DROP FUNCTION IF EXISTS delete_secret_by_key_id(uuid);

DROP FUNCTION IF EXISTS update_secret_token(uuid, text, text, text);

-- Updated: get_secret_token now accepts the public.secret.id (deterministic UUID)
-- It looks up the vault_secret_id from the public.secret table, then retrieves the decrypted secret
CREATE
OR REPLACE FUNCTION get_secret_token(p_secret_id uuid) RETURNS TEXT SECURITY DEFINER
SET
    search_path = vault,
    public LANGUAGE plpgsql AS $$ DECLARE v_vault_secret_id UUID;

BEGIN -- First, get the vault_secret_id from the public.secret table
-- Also verify the user owns this secret
SELECT
    vault_secret_id INTO v_vault_secret_id
FROM
    public.secret
WHERE
    id = p_secret_id
    AND created_by = auth.uid();

-- If no secret found or unauthorized, raise exception
IF v_vault_secret_id IS NULL THEN RAISE EXCEPTION 'Secret not found or you are not authorized to access this secret';

END IF;

-- Return the decrypted_secret from the vault using the vault_secret_id
RETURN (
    SELECT
        decrypted_secret
    FROM
        vault.decrypted_secrets
    WHERE
        id = v_vault_secret_id
);

END;

$$;

-- Updated: insert_secret_token now accepts a deterministic p_secret_id
-- This allows the caller to specify the id for the public.secret table
CREATE
OR REPLACE FUNCTION insert_secret_token(
    p_secret_id UUID,
    p_name TEXT,
    p_description TEXT,
    p_secret TEXT
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER
SET
    search_path = '' AS $$ DECLARE v_vault_secret_id UUID;

BEGIN -- Use the built-in vault.create_secret function to store the secret in vault
v_vault_secret_id := vault.create_secret(p_secret, p_name, p_description);

-- Insert the reference into the public.secret table with the provided id
INSERT INTO
    public.secret (id, vault_secret_id, created_by)
VALUES
    (p_secret_id, v_vault_secret_id, auth.uid());

-- Return the public secret id (not the vault id)
RETURN p_secret_id;

END;

$$;

-- Updated: upsert_secret_token now uses the public.secret.id (deterministic UUID)
CREATE
OR REPLACE FUNCTION upsert_secret_token(
    p_secret_id UUID,
    p_name TEXT,
    p_description TEXT,
    p_secret TEXT
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER
SET
    search_path = '' AS $$ DECLARE v_vault_secret_id UUID;

v_exists BOOLEAN;

BEGIN -- Check if the secret exists with this id and belongs to the current user
SELECT
    vault_secret_id INTO v_vault_secret_id
FROM
    public.secret
WHERE
    id = p_secret_id
    AND created_by = auth.uid();

-- If it exists, update it
IF v_vault_secret_id IS NOT NULL THEN -- Update the secret in vault
PERFORM vault.update_secret(
    v_vault_secret_id,
    p_secret,
    p_name,
    p_description
);

-- Update the updated_at timestamp in the public.secret table
UPDATE
    public.secret
SET
    updated_at = NOW()
WHERE
    id = p_secret_id;

RETURN p_secret_id;

END IF;

-- If we reach here, the secret doesn't exist, so insert a new one
v_vault_secret_id := vault.create_secret(p_secret, p_name, p_description);

-- Insert the reference into the public.secret table with the provided id
INSERT INTO
    public.secret (id, vault_secret_id, created_by)
VALUES
    (p_secret_id, v_vault_secret_id, auth.uid());

RETURN p_secret_id;

END;

$$;

-- Updated: delete_secret_by_key_id now accepts the public.secret.id
CREATE
OR REPLACE FUNCTION delete_secret_by_key_id(p_secret_id uuid) RETURNS TEXT SECURITY DEFINER
SET
    search_path = vault,
    public LANGUAGE plpgsql AS $$ DECLARE v_vault_secret_id UUID;

v_secret_text TEXT;

BEGIN -- First, get the vault_secret_id from the public.secret table
-- Also verify the user owns this secret
SELECT
    vault_secret_id INTO v_vault_secret_id
FROM
    public.secret
WHERE
    id = p_secret_id
    AND created_by = auth.uid();

-- If no secret found or unauthorized, raise exception
IF v_vault_secret_id IS NULL THEN RAISE EXCEPTION 'Secret not found or you are not authorized to delete this secret';

END IF;

-- Retrieve the decrypted secret before deletion
SELECT
    decrypted_secret INTO v_secret_text
FROM
    vault.decrypted_secrets
WHERE
    id = v_vault_secret_id
LIMIT
    1;

-- Delete from vault
IF v_secret_text IS NOT NULL THEN
DELETE FROM
    vault.secrets
WHERE
    id = v_vault_secret_id;

END IF;

-- Return the captured secret (will be NULL if not found)
RETURN v_secret_text;

END;

$$;

-- Updated: update_secret_token now accepts the public.secret.id
CREATE
OR REPLACE FUNCTION update_secret_token(
    p_secret_id UUID,
    p_secret TEXT,
    p_name TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER
SET
    search_path = '' AS $$ DECLARE v_vault_secret_id UUID;

BEGIN -- First, get the vault_secret_id from the public.secret table
-- Also verify the user owns this secret
SELECT
    vault_secret_id INTO v_vault_secret_id
FROM
    public.secret
WHERE
    id = p_secret_id
    AND created_by = auth.uid();

-- If no secret found or unauthorized, raise exception
IF v_vault_secret_id IS NULL THEN RAISE EXCEPTION 'Secret not found or you are not authorized to update this secret';

END IF;

-- Update the secret in vault
PERFORM vault.update_secret(
    v_vault_secret_id,
    p_secret,
    p_name,
    p_description
);

-- Update the updated_at timestamp in the public.secret table
UPDATE
    public.secret
SET
    updated_at = NOW()
WHERE
    id = p_secret_id;

RETURN p_secret_id;

END;

$$;