import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, User } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
  isSidebarOpen: boolean;
  initialSearchTerm?: string;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, isSidebarOpen, initialSearchTerm = '' }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [isUserEditing, setIsUserEditing] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Navegar a shipments con el término de búsqueda
      navigate(`/shipments?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm(''); // Limpiar el input después de la búsqueda
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(e);
    }
  };

  // Actualizar searchTerm cuando cambie initialSearchTerm, pero solo si el usuario no está editando
  useEffect(() => {
    if (!isUserEditing && initialSearchTerm !== searchTerm) {
      setSearchTerm(initialSearchTerm);
    }
  }, [initialSearchTerm, isUserEditing, searchTerm]);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          <div className="hidden lg:block">
            <h1 className="text-xl font-bold text-gray-900">
              Sistema de Gestión de Transporte
            </h1>
          </div>

          <div className="lg:hidden">
            <h1 className="text-lg font-bold text-gray-900">RastreApp</h1>
          </div>
        </div>

        {/* Center section - Search bar */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar envíos, clientes..."
              value={searchTerm}
              onChange={(e) => {
                setIsUserEditing(true);
                setSearchTerm(e.target.value);
              }}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsUserEditing(true)}
              onBlur={() => {
                // Pequeño delay para permitir que el clic en el botón de búsqueda funcione
                setTimeout(() => setIsUserEditing(false), 100);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Buscar"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {/* Right section */}
        <div className="flex items-center space-x-3">
          <button 
            type="button"
            onClick={() => navigate('/shipments')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative md:hidden"
          >
            <Search className="w-5 h-5 text-gray-600" />
          </button>

          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-medium">3</span>
            </span>
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="hidden md:block text-sm font-medium text-gray-700">
              Admin
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
