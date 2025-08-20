import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Search, Filter, Plus, Eye, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useFilteredShipments } from '../hooks/useFilteredShipments';
import StatusBadge from '../components/Common/StatusBadge';
import PriorityBadge from '../components/Common/PriorityBadge';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { Shipment } from '../types';
import { useSearchParams } from 'react-router-dom';

const Shipments: React.FC = () => {
  const { state, actions } = useApp();
  const { filters } = state;
  const [searchParams] = useSearchParams();
  const [localSearchTerm, setLocalSearchTerm] = useState(filters.searchTerm);
  const [isUserEditing, setIsUserEditing] = useState(false);

  // Leer parámetros de la URL solo al cargar el componente inicialmente
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch && urlSearch !== filters.searchTerm) {
      actions.searchShipments(urlSearch);
      setLocalSearchTerm(urlSearch);
    }
  }, [searchParams]); // Solo depende de searchParams, no de filters.searchTerm

  // Sincronizar localSearchTerm con filters.searchTerm solo cuando venga del header
  // pero no cuando el usuario esté editando localmente
  useEffect(() => {
    if (!isUserEditing && filters.searchTerm !== localSearchTerm) {
      setLocalSearchTerm(filters.searchTerm);
    }
  }, [filters.searchTerm, isUserEditing, localSearchTerm]);
  const {
    shipments,
    loading,
    error,
    pagination,
    refetch,
    changePage,
    changeLimit,
  } = useFilteredShipments();

  const [showFilters, setShowFilters] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  const openShipmentModal = useCallback((shipment: Shipment) => {
    setSelectedShipment(shipment);
  }, []);

  const closeShipmentModal = useCallback(() => {
    setSelectedShipment(null);
  }, []);

  const handlePreviousPage = useCallback(() => {
    changePage(pagination.page - 1);
  }, [changePage, pagination.page]);

  const handleNextPage = useCallback(() => {
    changePage(pagination.page + 1);
  }, [changePage, pagination.page]);
  
  // Referencias para mantener el foco
  const searchInputRef = useRef<HTMLInputElement>(null);
  const statusSelectRef = useRef<HTMLSelectElement>(null);
  const prioritySelectRef = useRef<HTMLSelectElement>(null);
  
  const [focusedElement, setFocusedElement] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && focusedElement && isUserEditing) {
      const elementMap: { [key: string]: React.RefObject<HTMLElement> } = {
        search: searchInputRef,
        status: statusSelectRef,
        priority: prioritySelectRef,
      };
      
      const elementToFocus = elementMap[focusedElement];
      if (elementToFocus?.current) {

        setTimeout(() => {
          elementToFocus.current?.focus();
          if (focusedElement === 'search' && cursorPosition !== null && searchInputRef.current) {
            searchInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
          }
        }, 0);
        setFocusedElement(null);
        setCursorPosition(null);
      }
    }
  }, [loading, focusedElement, isUserEditing]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFocusedElement('search');
    setIsUserEditing(true);
    setCursorPosition(e.target.selectionStart);
    const value = e.target.value;
    setLocalSearchTerm(value);
    actions.searchShipments(value);
  }, [actions]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFocusedElement(key);
    actions.applyFilters({ [key]: value });
  }, [actions]);

  const clearFilters = useCallback(() => {
    actions.applyFilters({
      status: '',
      priority: '',
      searchTerm: '',
      dateRange: { start: '', end: '' },
    });
  }, [actions]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }, []);

  // Memoizar el contenido de carga y error para evitar re-renders
  const loadingContent = useMemo(() => (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" />
      <span className="ml-2 text-gray-600">Cargando envíos...</span>
    </div>
  ), []);

  const errorContent = useMemo(() => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-red-800">Error al cargar los envíos: {error}</p>
      <button
        onClick={refetch}
        className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Reintentar
      </button>
    </div>
  ), [error, refetch]);

  // Memoizar las filas de la tabla para evitar re-renders
  const tableRows = useMemo(() => 
    shipments.map((shipment) => (
      <tr key={shipment.id} className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <div>
            <div className="text-sm font-medium text-gray-900">
              {shipment.trackingNumber}
            </div>
            <div className="text-sm text-gray-500">
              {shipment.weight} kg
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div>
            <div className="text-sm font-medium text-gray-900">
              {shipment.customer.name}
            </div>
            <div className="text-sm text-gray-500">
              {shipment.customer.phone}
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm text-gray-900">
            <div>{shipment.origin}</div>
            <div className="text-gray-500">↓</div>
            <div>{shipment.destination}</div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <StatusBadge status={shipment.status} />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <PriorityBadge priority={shipment.priority} />
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {formatDate(shipment.createdAt)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <button
            onClick={() => openShipmentModal(shipment)}
            className="text-blue-600 hover:text-blue-900 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        </td>
      </tr> 
    )), [shipments, formatDate, openShipmentModal]);

  if (loading) {
    return loadingContent;
  }

  if (error) {
    return errorContent;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Envíos</h1>
          <p className="text-gray-600">
            Mostrando {pagination.total} envíos (página {pagination.page} de {pagination.pages})
          </p>
        </div>

        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Nuevo Envío</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar por número de seguimiento, cliente, origen o destino..."
                value={localSearchTerm}
                onChange={handleSearchChange}
                onFocus={() => setIsUserEditing(true)}
                onBlur={() => {
                  // Delay más largo para permitir que el foco se restaure después de actualizaciones
                  setTimeout(() => {
                    // Solo desactivar edición si el input no tiene foco actualmente
                    if (document.activeElement !== searchInputRef.current) {
                      setIsUserEditing(false);
                    }
                  }, 200);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={toggleFilters}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  ref={statusSelectRef}
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los estados</option>
                  <option value="pending">Pendiente</option>
                  <option value="in-transit">En tránsito</option>
                  <option value="delivered">Entregado</option>
                  <option value="delayed">Retrasado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridad
                </label>
                <select
                  ref={prioritySelectRef}
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas las prioridades</option>
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Shipments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Envío
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ruta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prioridad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableRows}
            </tbody>
          </table>
        </div>

        {shipments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No se encontraron envíos con los filtros aplicados</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Página {pagination.page} de {pagination.pages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handlePreviousPage}
                disabled={pagination.page <= 1}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Anterior
              </button>
              <button
                onClick={handleNextPage}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shipment Detail Modal */}
      {selectedShipment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Detalle del Envío: {selectedShipment.trackingNumber}
              </h2>
              <button
                onClick={closeShipmentModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Información General</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Estado:</span> <StatusBadge status={selectedShipment.status} /></div>
                    <div><span className="font-medium">Prioridad:</span> <PriorityBadge priority={selectedShipment.priority} /></div>
                    <div><span className="font-medium">Peso:</span> {selectedShipment.weight} kg</div>
                    <div><span className="font-medium">Distancia:</span> {selectedShipment.route.distance} km</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Cliente</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Nombre:</span> {selectedShipment.customer.name}</div>
                    <div><span className="font-medium">Email:</span> {selectedShipment.customer.email}</div>
                    <div><span className="font-medium">Teléfono:</span> {selectedShipment.customer.phone}</div>
                  </div>
                </div>
              </div>

              {selectedShipment.driver && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Conductor Asignado</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Nombre:</span> {selectedShipment.driver.name}</div>
                    <div><span className="font-medium">Teléfono:</span> {selectedShipment.driver.phone}</div>
                    <div><span className="font-medium">Vehículo:</span> {selectedShipment.driver.vehicle}</div>
                  </div>
                </div>
              )}

              {selectedShipment.notes.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Notas</h3>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {selectedShipment.notes.map((note, index) => (
                      <li key={index}>• {note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shipments;
