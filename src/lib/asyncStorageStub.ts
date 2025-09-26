// Minimal AsyncStorage stub for environments without React Native support.
export const AsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    void key;
    return null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    void key;
    void value;
  },
  removeItem: async (key: string): Promise<void> => {
    void key;
  },
  clear: async (): Promise<void> => {},
  getAllKeys: async (): Promise<string[]> => [],
  multiGet: async (keys: string[]): Promise<[string, string | null][]> => {
    void keys;
    return [];
  },
  multiSet: async (entries: [string, string][]): Promise<void> => {
    void entries;
  },
  multiRemove: async (keys: string[]): Promise<void> => {
    void keys;
  },
};

export default AsyncStorage;
