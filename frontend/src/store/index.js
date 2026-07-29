import { configureStore } from '@reduxjs/toolkit';

const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
  },
});

export { store };
