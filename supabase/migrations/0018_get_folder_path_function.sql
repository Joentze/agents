CREATE OR REPLACE FUNCTION get_folder_path(folder_id UUID)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMP,        -- Change from TIMESTAMPTZ to TIMESTAMP
  updated_at TIMESTAMP,        -- Change from TIMESTAMPTZ to TIMESTAMP
  created_by UUID,
  name TEXT,
  parent_folder_id UUID,
  depth INT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE folder_hierarchy AS (
    -- Base case: start with the given folder
    SELECT 
      af.id,
      af.created_at,
      af.updated_at,
      af.created_by,
      af.name,
      af.parent_folder_id,
      0 as depth
    FROM artifact_folder af
    WHERE af.id = folder_id
    
    UNION ALL
    
    -- Recursive case: get parent folders
    SELECT 
      af.id,
      af.created_at,
      af.updated_at,
      af.created_by,
      af.name,
      af.parent_folder_id,
      fh.depth + 1 as depth
    FROM artifact_folder af
    INNER JOIN folder_hierarchy fh ON af.id = fh.parent_folder_id
  )
  SELECT 
    fh.id,
    fh.created_at,
    fh.updated_at,
    fh.created_by,
    fh.name,
    fh.parent_folder_id,
    fh.depth
  FROM folder_hierarchy fh
  ORDER BY fh.depth DESC;  -- Root folder first, target folder last
END;
$$;

GRANT EXECUTE ON FUNCTION get_folder_path(UUID) TO authenticated;