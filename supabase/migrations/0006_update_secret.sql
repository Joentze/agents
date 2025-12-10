-- Custom SQL migration file, put your code below! ---- Custom SQL migration file, put your code below! --
-- Function to update an existing secret in vault and update the updated_at timestamp
CREATE
OR REPLACE FUNCTION update_secret_token(
    p_token_id UUID,
    p_secret TEXT,
    p_name TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER
SET
    search_path = '' AS $$ DECLARE v_old_name TEXT;

v_old_description TEXT;

BEGIN -- Check if user is authorized to update this secret
IF NOT EXISTS (
    SELECT
        1
    FROM
        public.secret
    WHERE
        vault_secret_id = p_token_id
        AND created_by = auth.uid()
) THEN RAISE EXCEPTION 'You are not authorized to update this secret';

END IF;

-- Get existing name and description if not provided
SELECT
    name,
    description INTO v_old_name,
    v_old_description
FROM
    vault.secrets
WHERE
    id = p_token_id;

-- Use provided values or fall back to existing ones
v_old_name := COALESCE(p_name, v_old_name);

v_old_description := COALESCE(p_description, v_old_description);

-- Update the secret in vault using the vault.update_secret function
-- Note: vault.update_secret updates the secret value, name, and description
PERFORM vault.update_secret(
    p_token_id,
    p_secret,
    v_old_name,
    v_old_description
);

-- Update the updated_at timestamp in the public.secret table
UPDATE
    public.secret
SET
    updated_at = NOW()
WHERE
    vault_secret_id = p_token_id;

RETURN p_token_id;

END;

$$;