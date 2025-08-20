import { useState, useEffect, useRef } from 'react';
import { Shipment } from '../types';
import { useApp } from '../context/AppContext';
import { getShipments, ShipmentsFilters } from '../api/shipments';
import { useDebounce } from './useDebounce';

export function useFilteredShipments() {
  const { state } = useApp();
  const { filters } = state;

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // Aplicar debounce a los filtros de búsqueda
  const debouncedSearchTerm = useDebounce(filters.searchTerm, 500);
  const debouncedStatus = useDebounce(filters.status, 300);
  const debouncedPriority = useDebounce(filters.priority, 300);

  // Convertir filtros del contexto a filtros de API
  const apiFilters: ShipmentsFilters = {
    ...(debouncedStatus && { status: debouncedStatus }),
    ...(debouncedPriority && { priority: debouncedPriority }),
    ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
    page: pagination.page,
    limit: pagination.limit,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  };

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getShipments(apiFilters);
        setShipments(response.shipments);
        setPagination(response.pagination);
      } catch (err) {
        console.error('Error fetching shipments:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar los envíos');
      } finally {
        setLoading(false);
      }
    };

    fetchShipments();
  }, [debouncedStatus, debouncedPriority, debouncedSearchTerm, pagination.page, pagination.limit]);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getShipments(apiFilters);
      setShipments(response.shipments);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Error refetching shipments:', err);
      setError(err instanceof Error ? err.message : 'Error al recargar los envíos');
    } finally {
      setLoading(false);
    }
  };

  const changePage = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const changeLimit = (newLimit: number) => {
    setPagination(prev => ({ ...prev, page: 1, limit: newLimit }));
  };

  return {
    shipments,
    loading,
    error,
    pagination,
    refetch,
    changePage,
    changeLimit,
    totalCount: pagination.total,
    filteredCount: shipments.length,
  };
}
