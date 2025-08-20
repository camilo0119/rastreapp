import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { FilterState } from '../types';

interface AppState {
  loading: boolean;
  error: string | null;
  filters: FilterState;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_FILTERS'; payload: Partial<FilterState> };

const initialState: AppState = {
  loading: false,
  error: null,
  filters: {
    status: '',
    priority: '',
    searchTerm: '',
    dateRange: {
      start: '',
      end: '',
    },
  },
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'UPDATE_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };

    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  actions: {
    applyFilters: (filters: Partial<FilterState>) => void;
    searchShipments: (term: string) => void;
    clearFilters: () => void;
      };
      } | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const applyFilters = (filters: Partial<FilterState>) => {
    dispatch({ type: 'UPDATE_FILTERS', payload: filters });
  };

  const searchShipments = (term: string) => {
    dispatch({ type: 'UPDATE_FILTERS', payload: { searchTerm: term } });
  };

  const clearFilters = () => {
    dispatch({
      type: 'UPDATE_FILTERS',
      payload: {
        status: '',
        priority: '',
        searchTerm: '',
        dateRange: { start: '', end: '' },
      },
    });
  };

  const actions = {
    applyFilters,
    searchShipments,
    clearFilters,
  };

  return (
    <AppContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
