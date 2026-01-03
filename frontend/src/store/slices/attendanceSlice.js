
// src/store/slices/attendanceSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const checkIn = createAsyncThunk(
  'attendance/checkIn',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/attendance/checkin');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Check-in failed');
    }
  }
);

export const checkOut = createAsyncThunk(
  'attendance/checkOut',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/attendance/checkout');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Check-out failed');
    }
  }
);

export const getAttendance = createAsyncThunk(
  'attendance/getAttendance',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/attendance', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendance');
    }
  }
);

export const getAttendanceSummary = createAsyncThunk(
  'attendance/getSummary',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/attendance/summary', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch summary');
    }
  }
);

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    records: [],
    todayAttendance: null,
    summary: null,
    loading: false,
    error: null,
  },
  reducers: {
    updateTodayAttendance: (state, action) => {
      state.todayAttendance = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkIn.fulfilled, (state, action) => {
        state.todayAttendance = action.payload;
      })
      .addCase(checkOut.fulfilled, (state, action) => {
        state.todayAttendance = action.payload;
      })
      .addCase(getAttendance.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(getAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getAttendanceSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
      });
  },
});

export const { updateTodayAttendance } = attendanceSlice.actions;
export default attendanceSlice.reducer;
