import { configureStore } from '@reduxjs/toolkit';
import journeyBuilderReducer from '../features/journey-builder/slice/journeyBuilderSlice';
import { journeyApi } from '../features/journey-builder/api/journeyApi';

export const store = configureStore({
  reducer: {
    journeyBuilder: journeyBuilderReducer,
    [journeyApi.reducerPath]: journeyApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(journeyApi.middleware),
});
