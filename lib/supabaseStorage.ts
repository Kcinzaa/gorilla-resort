type UploadSupabaseObjectParams = {
  buffer: Buffer;
  contentType: string;
  objectPath: string;
};

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function hasSupabaseStorageConfig() {
  return Boolean(
    process.env.SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.SUPABASE_STORAGE_BUCKET
  );
}

export async function uploadSupabaseObject({
  buffer,
  contentType,
  objectPath,
}: UploadSupabaseObjectParams) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;

  if (!supabaseUrl || !serviceRoleKey || !bucket) {
    throw new Error("SUPABASE_STORAGE_NOT_CONFIGURED");
  }

  const baseUrl = trimTrailingSlash(supabaseUrl);
  const uploadUrl = `${baseUrl}/storage/v1/object/${bucket}/${objectPath}`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "content-type": contentType,
      "x-upsert": "false",
    },
    body: new Blob([new Uint8Array(buffer)], {
      type: contentType,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`SUPABASE_UPLOAD_FAILED: ${message}`);
  }

  const publicBaseUrl =
    process.env.SUPABASE_STORAGE_PUBLIC_URL ||
    `${baseUrl}/storage/v1/object/public/${bucket}`;

  return `${trimTrailingSlash(publicBaseUrl)}/${objectPath}`;
}
