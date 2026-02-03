'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

export function SearchBar() {
  const router = useRouter();
  const [city, setCity] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (propertyType) params.append('type', propertyType);
    if (maxPrice) params.append('maxPrice', maxPrice);

    router.push(`/properties?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-5xl mx-auto">
      <div className="bg-white rounded-lg shadow-xl p-4 md:p-6 border border-border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-semibold text-brand-navy mb-2">
              City
            </label>
            <Input
              type="text"
              placeholder="e.g., Mogadishu"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full focus:ring-brand-green focus:border-brand-green"
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-semibold text-brand-navy mb-2">
              Property Type
            </label>
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger className="focus:ring-brand-green focus:border-brand-green">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="villa">Villa</SelectItem>
                <SelectItem value="hotel">Hotel</SelectItem>
                <SelectItem value="fully_furnished">Fully Furnished</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-semibold text-brand-navy mb-2">
              Max Price (per night)
            </label>
            <Input
              type="number"
              placeholder="$100"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full focus:ring-brand-green focus:border-brand-green"
            />
          </div>

          <div className="md:col-span-1 flex items-end">
            <Button
              type="submit"
              className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-semibold"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
