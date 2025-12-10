"use server";

import { createClient } from "@/utils/supabase/server";

type CreateSecretParams = {
  p_secret_id: string;
  p_name: string;
  p_description: string;
  p_secret: string;
};
export async function createSecret({
  p_secret_id,
  p_name,
  p_description,
  p_secret,
}: CreateSecretParams) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("insert_secret_token", {
    p_secret_id,
    p_name,
    p_description,
    p_secret,
  });
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
export async function getSecret(p_secret_id: string) {
  console.log("getSecret", p_secret_id);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_secret_token", {
    p_secret_id,
  });
  if (error) {
    console.error("Error getting secret:", error);
    throw new Error(error.message);
  }
  return data;
}
export async function deleteSecret(p_secret_id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("delete_secret_by_key_id", {
    p_secret_id,
  });
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
export async function updateSecret(
  p_secret_id: string,
  p_secret: string,
  p_name?: string,
  p_description?: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("update_secret_token", {
    p_secret_id,
    p_secret,
    p_name,
    p_description,
  });
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function upsertSecret(
  p_secret_id: string,
  p_name: string,
  p_description: string,
  p_secret: string
) {
  console.log("upsertSecret", p_secret_id, p_name, p_description, p_secret);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("upsert_secret_token", {
    p_secret_id,
    p_name,
    p_description,
    p_secret,
  });
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
