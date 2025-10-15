import React, { useState, useEffect, useCallback } from 'react';
import { NominatimResult } from './types';
import { fetchAddresses } from './services/locationService';
import { MapPinIcon, Link2Icon, CopyIcon, Share2Icon, CheckCircleIcon, Loader2Icon, AlertCircleIcon } from './components/icons';

type LocationType = 'pickup' | 'dropoff';
type AppType = '99' | 'uber';

// --- Local UI Components for a Cleaner Structure ---

const AppSelector: React.FC<{ selectedApp: AppType; setSelectedApp: (app: AppType) => void; }> = ({ selectedApp, setSelectedApp }) => (
  <div className="flex justify-center mb-8">
    <div className="flex p-1 bg-gray-100 rounded-full border border-gray-200">
      <button
        onClick={() => setSelectedApp('99')}
        className={`px-6 sm:px-8 py-2 rounded-full text-sm sm:text-base font-semibold transition-all duration-300 ${
          selectedApp === '99' ? 'bg-yellow-400 text-black shadow-sm' : 'text-gray-500 hover:bg-gray-200'
        }`}
        aria-pressed={selectedApp === '99'}
      >
        99
      </button>
      <button
        onClick={() => setSelectedApp('uber')}
        className={`px-6 sm:px-8 py-2 rounded-full text-sm sm:text-base font-semibold transition-all duration-300 ${
          selectedApp === 'uber' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200'
        }`}
        aria-pressed={selectedApp === 'uber'}
      >
        Uber
      </button>
    </div>
  </div>
);

const AddressResultItem: React.FC<{ result: NominatimResult; onSelect: () => void; }> = React.memo(({ result, onSelect }) => (
  <button
    onClick={onSelect}
    className="w-full px-4 py-3 text-left hover:bg-yellow-100 border-b last:border-b-0 transition bg-white"
  >
    <p className="font-bold text-gray-900 text-base mb-1 truncate">
      {result.address?.road || result.name || result.display_name.split(',')[0]}
    </p>
    <p className="text-sm text-gray-600 truncate">
      {result.address?.suburb || result.address?.neighbourhood || ''}{result.address?.city ? ` - ${result.address.city}` : ''}
    </p>
  </button>
));

interface LocationInputProps {
  type: LocationType;
  value: string;
  onValueChange: (value: string) => void;
  onLocationSelect: (location: NominatimResult) => void;
  onClear: () => void;
  selectedLocation: NominatimResult | null;
  results: NominatimResult[];
  loading: boolean;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const LocationInput: React.FC<LocationInputProps> = ({ type, value, onValueChange, onLocationSelect, onClear, selectedLocation, results, loading, onKeyPress }) => {
  const isPickup = type === 'pickup';
  const label = isPickup ? 'Origem (De onde vai sair)' : 'Destino (Para onde vai)';
  const placeholder = isPickup ? 'Ex: Rua Tiradentes, Jabaquara, Santos' : 'Ex: Rua Princesa Isabel, Vila Belmiro, Santos';
  const iconColor = isPickup ? 'text-green-600' : 'text-red-600';

  return (
    <div>
      <label className="flex items-center gap-2 text-lg font-semibold text-gray-700 mb-3">
        <MapPinIcon className={`w-5 h-5 ${iconColor}`} /> {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder={placeholder}
          className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-yellow-500 focus:outline-none transition pr-12"
          aria-label={label}
        />
        {selectedLocation && <button onClick={onClear} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-2xl" aria-label={`Limpar ${label}`}>&times;</button>}
      </div>
      {loading && <div className="flex items-center gap-2 mt-2 text-gray-600"><Loader2Icon className="w-4 h-4 animate-spin" /><span>Buscando endereços...</span></div>}
      {results.length > 0 && !selectedLocation && (
        <div className="mt-2 border-2 border-yellow-300 rounded-xl overflow-hidden bg-yellow-50">
          <p className="px-4 py-2 bg-yellow-100 text-sm font-semibold text-yellow-800" role="status">👇 Clique em um endereço ou pressione Enter:</p>
          {results.map((r) => <AddressResultItem key={r.place_id} result={r} onSelect={() => onLocationSelect(r)} />)}
        </div>
      )}
      {selectedLocation && <div className="mt-2 p-3 bg-green-50 border-2 border-green-300 rounded-lg text-sm text-green-800 font-semibold flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 flex-shrink-0" /><span className="truncate">{selectedLocation.display_name}</span></div>}
    </div>
  );
};


// --- Main App Component ---

export default function App() {
  const [selectedApp, setSelectedApp] = useState<AppType>('99');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [pickupResults, setPickupResults] = useState<NominatimResult[]>([]);
  const [dropoffResults, setDropoffResults] = useState<NominatimResult[]>([]);
  const [selectedPickup, setSelectedPickup] = useState<NominatimResult | null>(null);
  const [selectedDropoff, setSelectedDropoff] = useState<NominatimResult | null>(null);
  const [generatedLink, setGeneratedLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [loading, setLoading] = useState({ pickup: false, dropoff: false });
  const [showHelp, setShowHelp] = useState(false);

  const searchAddress = useCallback(async (query: string, type: LocationType) => {
    if (query.length < 3) return;

    setLoading(prev => ({ ...prev, [type]: true }));
    const data = await fetchAddresses(query);
    
    if (type === 'pickup') {
      setPickupResults(data);
    } else {
      setDropoffResults(data);
    }
    setLoading(prev => ({ ...prev, [type]: false }));
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (pickup.length >= 3 && !selectedPickup) searchAddress(pickup, 'pickup');
    }, 500);
    return () => clearTimeout(handler);
  }, [pickup, selectedPickup, searchAddress]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (dropoff.length >= 3 && !selectedDropoff) searchAddress(dropoff, 'dropoff');
    }, 500);
    return () => clearTimeout(handler);
  }, [dropoff, selectedDropoff, searchAddress]);

  const selectLocation = (location: NominatimResult, type: LocationType) => {
    if (type === 'pickup') {
      setSelectedPickup(location);
      setPickupResults([]);
    } else {
      setSelectedDropoff(location);
      setDropoffResults([]);
    }
    setShowHelp(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, type: LocationType) => {
    if (e.key === 'Enter') {
      const results = type === 'pickup' ? pickupResults : dropoffResults;
      if (results.length > 0) {
        selectLocation(results[0], type);
      }
    }
  };

  const generateLink = () => {
    if (!selectedPickup || !selectedDropoff) {
      setShowHelp(true);
      return;
    }

    let link: string;

    if (selectedApp === '99') {
      // Use the user's full input from the state for the title to preserve the house number.
      const pickupTitle = pickup;
      const dropoffTitle = dropoff;

      const params = new URLSearchParams({
        client_id: 'GOOGLE_MAPS',
        deep_link_product_id: '316',
        pickup_latitude: selectedPickup.lat,
        pickup_longitude: selectedPickup.lon,
        pickup_title: pickupTitle,
        pickup_formatted_address: selectedPickup.display_name,
        dropoff_latitude: selectedDropoff.lat,
        dropoff_longitude: selectedDropoff.lon,
        dropoff_title: dropoffTitle,
        dropoff_formatted_address: selectedDropoff.display_name,
        fare_currency: 'BRL'
      });
      link = `https://99.onelink.me/Mayr/ac1f1c4e?${params.toString()}`;
    } else { // Uber
      // Use the correct universal link format with individual parameters.
      const params = new URLSearchParams({
          action: 'setPickup',
          'pickup[latitude]': selectedPickup.lat,
          'pickup[longitude]': selectedPickup.lon,
          'pickup[formatted_address]': pickup, // Use user's full input
          'dropoff[latitude]': selectedDropoff.lat,
          'dropoff[longitude]': selectedDropoff.lon,
          'dropoff[formatted_address]': dropoff, // Use user's full input
      });
      // Use the recommended 'ul' universal link
      link = `https://m.uber.com/ul/?${params.toString()}`;
    }

    setGeneratedLink(link);
    setIsCopied(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const message = `Oi! Criei uma corrida do ${selectedApp === '99' ? '99' : 'Uber'} pra você. É só clicar no link que vai abrir o app pronto:\n\n${generatedLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const clearLocation = (type: LocationType) => {
    if (type === 'pickup') {
      setPickup('');
      setSelectedPickup(null);
      setPickupResults([]);
    } else {
      setDropoff('');
      setSelectedDropoff(null);
      setDropoffResults([]);
    }
  };

  const canGenerate = selectedPickup && selectedDropoff;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 font-sans">
      <div className="max-w-3xl mx-auto">
        <main className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <header className="flex items-center gap-4 mb-6">
            <div className="bg-yellow-500 p-3 rounded-xl shadow-md">
              <Link2Icon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Gerador de Links</h1>
              <p className="text-gray-600">Crie links de corrida para 99 e Uber</p>
            </div>
          </header>

          <AppSelector selectedApp={selectedApp} setSelectedApp={setSelectedApp} />

          {showHelp && !canGenerate && (
            <div className="mb-6 p-4 bg-orange-50 border-2 border-orange-300 rounded-xl flex items-start gap-3">
              <AlertCircleIcon className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-800">
                <p className="font-semibold mb-1">Como usar:</p>
                <ol className="list-decimal list-inside space-y-1">
                    <li>Digite o endereço completo com número.</li>
                    <li>Clique no endereço correto na lista que aparecer.</li>
                    <li>Repita para origem e destino, e então gere o link!</li>
                </ol>
              </div>
            </div>
          )}
          
          <div className="space-y-6 mb-8">
            <LocationInput
              type="pickup"
              value={pickup}
              onValueChange={(val) => { setPickup(val); if(selectedPickup) setSelectedPickup(null); }}
              onLocationSelect={(loc) => selectLocation(loc, 'pickup')}
              onClear={() => clearLocation('pickup')}
              selectedLocation={selectedPickup}
              results={pickupResults}
              loading={loading.pickup}
              onKeyPress={(e) => handleKeyPress(e, 'pickup')}
            />
            <LocationInput
              type="dropoff"
              value={dropoff}
              onValueChange={(val) => { setDropoff(val); if(selectedDropoff) setSelectedDropoff(null); }}
              onLocationSelect={(loc) => selectLocation(loc, 'dropoff')}
              onClear={() => clearLocation('dropoff')}
              selectedLocation={selectedDropoff}
              results={dropoffResults}
              loading={loading.dropoff}
              onKeyPress={(e) => handleKeyPress(e, 'dropoff')}
            />
          </div>
          
          <button onClick={generateLink} disabled={!canGenerate} className={`w-full font-bold py-5 px-6 rounded-xl text-xl transition-all duration-300 shadow-lg transform active:scale-[0.98] ${canGenerate ? 'bg-yellow-500 hover:bg-yellow-600 text-white hover:shadow-xl cursor-pointer' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
            {canGenerate ? `Gerar Link do ${selectedApp === '99' ? '99 ✨' : 'Uber 🚙'}` : 'Selecione origem e destino'}
          </button>

          {generatedLink && (
            <div className="mt-8 p-6 bg-green-50 border-2 border-green-200 rounded-xl">
              <h3 className="font-bold text-lg text-green-800 mb-3 flex items-center gap-2"><CheckCircleIcon className="w-5 h-5" />Link criado com sucesso!</h3>
              <div className="bg-white p-4 rounded-lg mb-4 break-all text-sm text-gray-700 border border-green-200 max-h-32 overflow-y-auto shadow-inner">{generatedLink}</div>
              <div className="flex gap-3 flex-col sm:flex-row">
                <button onClick={copyToClipboard} className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition transform active:scale-95">
                  {isCopied ? <><CheckCircleIcon className="w-5 h-5" />Copiado!</> : <><CopyIcon className="w-5 h-5" />Copiar Link</>}
                </button>
                <button onClick={shareWhatsApp} className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition transform active:scale-95">
                  <Share2Icon className="w-5 h-5" />Enviar no WhatsApp
                </button>
              </div>
            </div>
          )}
        </main>
        <footer className="mt-6 text-center text-sm text-gray-600">
          <p>✨ Facilitando a vida de quem você ama</p>
        </footer>
      </div>
    </div>
  );
}
