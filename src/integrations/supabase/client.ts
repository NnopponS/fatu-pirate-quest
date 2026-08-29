const uploadedAssets = new Map<string, string>();

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });

const storageBucket = (bucket: string) => ({
  upload: async (path: string, file: File, _options?: unknown) => {
    try {
      const dataUrl = await fileToDataUrl(file);
      uploadedAssets.set(`${bucket}/${path}`, dataUrl);
      return { data: { path }, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
  getPublicUrl: (path: string) => ({
    data: { publicUrl: uploadedAssets.get(`${bucket}/${path}`) ?? "" },
  }),
  remove: async (_paths: string[]) => ({ data: [], error: null }),
});

const tableApi = () => ({
  update: (_value: unknown) => ({
    eq: async (_column: string, _value: unknown) => ({ data: null, error: null }),
  }),
});

export const supabase = {
  storage: { from: storageBucket },
  from: (_table: string) => tableApi(),
};
