'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Country {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

interface City {
  id: string;
  name: string;
  country_id: string;
  is_active: boolean;
  countries?: { name: string };
}

interface Area {
  id: string;
  name: string;
  city_id: string;
  is_active: boolean;
  cities?: { name: string };
}

export default function LocationsPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'country' | 'city' | 'area'>('country');
  const [formData, setFormData] = useState({ name: '', code: '', country_id: '', city_id: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [countriesRes, citiesRes, areasRes] = await Promise.all([
      supabase.from('countries').select('*').order('name'),
      supabase.from('cities').select('*, countries(name)').order('name'),
      supabase.from('areas').select('*, cities(name)').order('name'),
    ]);

    if (countriesRes.data) setCountries(countriesRes.data);
    if (citiesRes.data) setCities(citiesRes.data);
    if (areasRes.data) setAreas(areasRes.data);
    setLoading(false);
  };

  const openDialog = (type: 'country' | 'city' | 'area') => {
    setDialogType(type);
    setFormData({ name: '', code: '', country_id: '', city_id: '' });
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    let error;
    if (dialogType === 'country') {
      if (!formData.code.trim()) {
        toast.error('Country code is required');
        return;
      }
      const res = await supabase
        .from('countries')
        .insert({ name: formData.name, code: formData.code.toUpperCase() });
      error = res.error;
    } else if (dialogType === 'city') {
      if (!formData.country_id) {
        toast.error('Please select a country');
        return;
      }
      const res = await supabase
        .from('cities')
        .insert({ name: formData.name, country_id: formData.country_id });
      error = res.error;
    } else {
      if (!formData.city_id) {
        toast.error('Please select a city');
        return;
      }
      const res = await supabase
        .from('areas')
        .insert({ name: formData.name, city_id: formData.city_id });
      error = res.error;
    }

    if (error) {
      toast.error('Failed to add location');
    } else {
      toast.success('Location added successfully');
      setShowDialog(false);
      fetchData();
    }
  };

  const toggleStatus = async (type: string, id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from(type === 'country' ? 'countries' : type === 'city' ? 'cities' : 'areas')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success('Status updated');
      fetchData();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-brand-navy">Location Management</h1>
            <p className="text-muted-foreground mt-2">Manage countries, cities, and areas</p>
          </div>
        </div>

        <Tabs defaultValue="countries" className="space-y-4">
          <TabsList>
            <TabsTrigger value="countries">Countries</TabsTrigger>
            <TabsTrigger value="cities">Cities</TabsTrigger>
            <TabsTrigger value="areas">Areas</TabsTrigger>
          </TabsList>

          <TabsContent value="countries">
            <Card className="shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Countries</CardTitle>
                  <Button onClick={() => openDialog('country')} className="bg-brand-green hover:bg-brand-green/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Country
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {countries.map((country) => (
                    <div
                      key={country.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 mr-3 text-brand-green" />
                        <div>
                          <p className="font-medium">{country.name}</p>
                          <p className="text-sm text-muted-foreground">Code: {country.code}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={country.is_active ? 'outline' : 'secondary'}
                        onClick={() => toggleStatus('country', country.id, country.is_active)}
                      >
                        {country.is_active ? 'Active' : 'Inactive'}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cities">
            <Card className="shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Cities</CardTitle>
                  <Button onClick={() => openDialog('city')} className="bg-brand-green hover:bg-brand-green/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add City
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cities.map((city) => (
                    <div
                      key={city.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 mr-3 text-brand-green" />
                        <div>
                          <p className="font-medium">{city.name}</p>
                          <p className="text-sm text-muted-foreground">{city.countries?.name}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={city.is_active ? 'outline' : 'secondary'}
                        onClick={() => toggleStatus('city', city.id, city.is_active)}
                      >
                        {city.is_active ? 'Active' : 'Inactive'}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="areas">
            <Card className="shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Areas</CardTitle>
                  <Button onClick={() => openDialog('area')} className="bg-brand-green hover:bg-brand-green/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Area
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {areas.map((area) => (
                    <div
                      key={area.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 mr-3 text-brand-green" />
                        <div>
                          <p className="font-medium">{area.name}</p>
                          <p className="text-sm text-muted-foreground">{area.cities?.name}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={area.is_active ? 'outline' : 'secondary'}
                        onClick={() => toggleStatus('area', area.id, area.is_active)}
                      >
                        {area.is_active ? 'Active' : 'Inactive'}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {dialogType}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={`Enter ${dialogType} name`}
              />
            </div>
            {dialogType === 'country' && (
              <div>
                <Label>Country Code</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., SO"
                  maxLength={2}
                />
              </div>
            )}
            {dialogType === 'city' && (
              <div>
                <Label>Country</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={formData.country_id}
                  onChange={(e) => setFormData({ ...formData, country_id: e.target.value })}
                >
                  <option value="">Select country</option>
                  {countries.filter(c => c.is_active).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
            {dialogType === 'area' && (
              <div>
                <Label>City</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={formData.city_id}
                  onChange={(e) => setFormData({ ...formData, city_id: e.target.value })}
                >
                  <option value="">Select city</option>
                  {cities.filter(c => c.is_active).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-brand-green hover:bg-brand-green/90">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
