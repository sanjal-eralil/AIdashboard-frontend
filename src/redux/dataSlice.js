// src/redux/dataSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Create an async thunk to fetch data
export const fetchData = createAsyncThunk('data/fetchData', async () => {
  const response = await fetch('/api/data');  // Replace with your actual API endpoint
  const data = await response.json();
  return data;
});

// Create a slice of the store
const dataSlice = createSlice({
  name: 'data',
  initialState: {
    analysis: null,
    status: 'idle',  // 'loading', 'succeeded', 'failed'
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.analysis = action.payload;
      })
      .addCase(fetchData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export default dataSlice.reducer;
