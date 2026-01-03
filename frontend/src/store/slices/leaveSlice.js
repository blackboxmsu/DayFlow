import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const applyLeave = createAsyncThunk(
  'leave/apply',
  async (leaveData, { rejectWithValue }) => {
    try {
      const response = await api.post('/leaves', leaveData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to apply leave');
    }
  }
);

export const getLeaves = createAsyncThunk(
  'leave/getLeaves',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/leaves', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leaves');
    }
  }
);

export const updateLeaveStatus = createAsyncThunk(
  'leave/updateStatus',
  async ({ id, status, comments }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/leaves/${id}/status`, { status, comments });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update leave');
    }
  }
);

const leaveSlice = createSlice({
  name: 'leave',
  initialState: {
    leaves: [],
    loading: false,
    error: null,
  },
  reducers: {
    addLeave: (state, action) => {
      state.leaves.unshift(action.payload);
    },
    updateLeave: (state, action) => {
      const index = state.leaves.findIndex(l => l._id === action.payload._id);
      if (index !== -1) {
        state.leaves[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(applyLeave.pending, (state) => {
        state.loading = true;
      })
      .addCase(applyLeave.fulfilled, (state, action) => {
        state.loading = false;
        state.leaves.unshift(action.payload);
      })
      .addCase(applyLeave.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getLeaves.pending, (state) => {
        state.loading = true;
      })
      .addCase(getLeaves.fulfilled, (state, action) => {
        state.loading = false;
        state.leaves = action.payload;
      })
      .addCase(getLeaves.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateLeaveStatus.fulfilled, (state, action) => {
        const index = state.leaves.findIndex(l => l._id === action.payload._id);
        if (index !== -1) {
          state.leaves[index] = action.payload;
        }
      });
  },
});

export const { addLeave, updateLeave } = leaveSlice.actions;
export default leaveSlice.reducer;
