-- Custom SQL migration file, put your code below! --
-- Function to upsert (insert or update) a secret in vault
CREATE
OR REPLACE FUNCTION upsert_secret_token(
    p_token_id UUID,
    p_name TEXT,
    p_description TEXT,
    p_secret TEXT
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER
SET
    search_path = '' AS $$ DECLARE v_token_id UUID;

v_exists BOOLEAN;

BEGIN -- Check if token_id is provided and if the secret exists
IF p_token_id IS NOT NULL THEN -- Check if the secret exists and belongs to the current user
SELECT
    EXISTS (
        SELECT
            1
        FROM
            public.secret
        WHERE
            vault_secret_id = p_token_id
            AND created_by = auth.uid()
    ) INTO v_exists;

-- If it exists, update it
IF v_exists THEN -- Update the secret in vault
PERFORM vault.update_secret(
    p_token_id,
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
    vault_secret_id = p_token_id;

RETURN p_token_id;

END IF;

END IF;

-- If we reach here, either no token_id was provided or the secret doesn't exist
-- So we insert a new secret
v_token_id := vault.create_secret(p_secret, p_name, p_description);

-- Insert the reference into the public.secret table
INSERT INTO
    public.secret (vault_secret_id, created_by)
VALUES
    (v_token_id, auth.uid());

RETURN v_token_id;

END;

$$;