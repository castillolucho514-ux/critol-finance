import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";

const preferences = createSlice({
  name: "preferences",
  initialState: { theme: "dark" as "dark" | "light" },
  reducers: { setTheme: (state, action: PayloadAction<"dark" | "light">) => { state.theme = action.payload; } }
});

export const { setTheme } = preferences.actions;
export const store = configureStore({ reducer: { preferences: preferences.reducer } });
export type RootState = ReturnType<typeof store.getState>;
